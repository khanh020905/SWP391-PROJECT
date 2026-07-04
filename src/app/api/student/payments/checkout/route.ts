import { NextRequest, NextResponse } from "next/server";
import { getPackages, createInvoice } from "@/lib/paymentDb";
import { supabaseAdmin } from "@/lib/supabase";

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const mockUserId = request.headers.get("x-mock-user-id") || new URL(request.url).searchParams.get("mockUserId");
  if (mockUserId) {
    return { id: mockUserId, email: `${mockUserId}@example.com`, name: "Mock Student" };
  }

  if (!token) return null;

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json(
        { message: "Vui lòng chọn gói cước học tập cần thanh toán." },
        { status: 400 }
      );
    }

    // 1. Get packages list and check if package is active
    const packages = await getPackages();
    const pkg = packages.find(p => p.id === packageId && p.isActive);
    if (!pkg) {
      return NextResponse.json(
        { message: "Gói cước học tập này không tồn tại hoặc đã ngưng hoạt động." },
        { status: 404 }
      );
    }

    // 2. Create invoice for student
    const newInvoice = await createInvoice({
      userId: user.id,
      userName: user.user_metadata?.name || user.email?.split("@")[0] || "Học viên Quali IELTS",
      userEmail: user.email || "",
      packageId: pkg.id,
      packageName: pkg.name,
      amount: pkg.price
    });

    return NextResponse.json({
      success: true,
      message: "Tạo hóa đơn thanh toán thành công!",
      invoice: newInvoice
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Lỗi API POST /api/student/payments/checkout:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi tạo hóa đơn thanh toán.", error: error.message },
      { status: 500 }
    );
  }
}
