import { NextRequest, NextResponse } from "next/server";
import { requireRole, ADMIN_ONLY } from "@/lib/roles";
import { getInvoices, createInvoice } from "@/lib/paymentDb";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLogger";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ADMIN_ONLY);
  if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    let invoices = await getInvoices();

    // Merge invoices from Supabase Auth user_metadata (for Vercel cross-lambda completeness)
    try {
      const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!listErr && users) {
        users.forEach((u: any) => {
          const meta = u.user_metadata || {};
          const pending = meta.pendingInvoice;
          const paid = meta.paidInvoice;
          const userInvoices = meta.invoices || [];

          [pending, paid, ...userInvoices].forEach((inv: any) => {
            if (inv && inv.id) {
              const idx = invoices.findIndex(i => i.id === inv.id);
              if (idx === -1) {
                invoices.unshift(inv);
              } else {
                if (inv.status === "PAID" && invoices[idx].status !== "PAID") {
                  invoices[idx] = inv;
                }
              }
            }
          });
        });
      }
    } catch (err: any) {
      console.warn("⚠️ Error merging user_metadata invoices in admin API:", err?.message);
    }

    // 1. Search filter
    if (search) {
      const s = search.toLowerCase();
      invoices = invoices.filter(
        i =>
          i.id.toLowerCase().includes(s) ||
          i.userName.toLowerCase().includes(s) ||
          i.userEmail.toLowerCase().includes(s) ||
          i.packageName.toLowerCase().includes(s)
      );
    }

    // 2. Status filter
    if (status && status !== "ALL") {
      invoices = invoices.filter(i => i.status === status);
    }

    // 3. Sort by created date newest first
    invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 4. Pagination
    const totalInvoices = invoices.length;
    const totalPages = Math.ceil(totalInvoices / limit);
    const paginatedInvoices = invoices.slice(skip, skip + limit);

    return NextResponse.json({
      invoices: paginatedInvoices,
      pagination: {
        totalInvoices,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error: any) {
    console.error("❌ Lỗi API GET /api/admin/payments/invoices:", error);
    return NextResponse.json(
      { message: "Không thể lấy danh sách hóa đơn.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ADMIN_ONLY);
  if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { userEmail, userName, packageId, packageName, amount, userId } = body;

    if (!userEmail || !userName || !packageId || !packageName || amount === undefined) {
      return NextResponse.json(
        { message: "Vui lòng nhập đầy đủ thông tin: Email học viên, Tên học viên, Gói cước và Số tiền." },
        { status: 400 }
      );
    }

    const newInvoice = await createInvoice({
      userId: userId || null,
      userName,
      userEmail,
      packageId,
      packageName,
      amount: Number(amount)
    });

    // Log admin activity
    await logActivity(
      "CREATE",
      newInvoice.userName,
      newInvoice.userEmail,
      `Tạo hóa đơn thủ công mới thành công: ${newInvoice.id} (${newInvoice.packageName}, Số tiền: ${newInvoice.amount.toLocaleString("vi-VN")} VNĐ)`,
      request
    );

    return NextResponse.json(
      { message: "Tạo hóa đơn thủ công thành công!", invoice: newInvoice },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Lỗi API POST /api/admin/payments/invoices:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi tạo hóa đơn.", error: error.message },
      { status: 500 }
    );
  }
}
