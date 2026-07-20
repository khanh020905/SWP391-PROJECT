import { NextRequest, NextResponse } from "next/server";
import { requireRole, ADMIN_ONLY } from "@/lib/roles";
import { updatePackage, deletePackage, getPackages } from "@/lib/paymentDb";
import { logActivity } from "@/lib/activityLogger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ADMIN_ONLY);
  if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, durationMonths, description, features, isActive } = body;

    const packages = await getPackages();
    const oldPkg = packages.find(p => p.id === id);
    if (!oldPkg) {
      return NextResponse.json(
        { message: "Không tìm thấy gói thanh toán này." },
        { status: 404 }
      );
    }

    const updatedPkg = await updatePackage(id, {
      name,
      price: price !== undefined ? Number(price) : undefined,
      durationMonths: durationMonths !== undefined ? Number(durationMonths) : undefined,
      description,
      features,
      isActive
    });

    if (!updatedPkg) {
      return NextResponse.json(
        { message: "Cập nhật gói thanh toán thất bại." },
        { status: 500 }
      );
    }

    // Log admin activity
    await logActivity(
      "UPDATE",
      updatedPkg.name,
      "payment-package",
      `Cập nhật gói thanh toán '${oldPkg.name}' (Kích hoạt: ${updatedPkg.isActive})`,
      request
    );

    return NextResponse.json({
      message: "Cập nhật gói thanh toán thành công!",
      package: updatedPkg
    });
  } catch (error: any) {
    console.error("❌ Lỗi API PUT /api/admin/payments/packages/[id]:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi cập nhật gói thanh toán.", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ADMIN_ONLY);
  if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;

    const packages = await getPackages();
    const pkgToDelete = packages.find(p => p.id === id);
    if (!pkgToDelete) {
      return NextResponse.json(
        { message: "Không tìm thấy gói thanh toán này." },
        { status: 404 }
      );
    }

    const success = await deletePackage(id);
    if (!success) {
      return NextResponse.json(
        { message: "Xóa gói thanh toán thất bại." },
        { status: 500 }
      );
    }

    // Log admin activity
    await logActivity(
      "DELETE",
      pkgToDelete.name,
      "payment-package",
      `Xóa vĩnh viễn gói thanh toán '${pkgToDelete.name}' khỏi hệ thống`,
      request
    );

    return NextResponse.json({
      message: `Đã xóa gói thanh toán '${pkgToDelete.name}' thành công!`
    });
  } catch (error: any) {
    console.error("❌ Lỗi API DELETE /api/admin/payments/packages/[id]:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi xóa gói thanh toán.", error: error.message },
      { status: 500 }
    );
  }
}
