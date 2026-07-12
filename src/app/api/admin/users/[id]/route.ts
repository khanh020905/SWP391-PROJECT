import { NextRequest, NextResponse } from "next/server";
import { requireRole, ADMIN_ONLY } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLogger";
import { sendAccountLockEmail, sendAccountUnlockEmail } from "@/lib/emailService";

// PUT: Cập nhật thông tin chi tiết người dùng trên Supabase Auth DB
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ADMIN_ONLY);
    if (!auth) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { name, email, role, isLocked } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { message: "Vui lòng cung cấp đầy đủ thông tin: Tên, Email và Vai trò." },
        { status: 400 }
      );
    }

    const validRoles = ["ADMIN", "INSTRUCTOR", "STUDENT", "GUEST"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { message: "Vai trò không hợp lệ. Phải là ADMIN, INSTRUCTOR, STUDENT hoặc GUEST." },
        { status: 400 }
      );
    }

    console.log(`⚡ [Supabase Auth] Đang cập nhật người dùng: ${id}...`);

    // Fetch current user details to preserve other metadata if any
    const { data: { user: currentUser }, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(id);
    if (fetchError || !currentUser) {
      return NextResponse.json(
        { message: "Không tìm thấy người dùng này trên Supabase." },
        { status: 404 }
      );
    }

    const newMetadata = {
      ...(currentUser.user_metadata || {}),
      name,
      role,
      isLocked: typeof isLocked === "boolean" ? isLocked : (currentUser.user_metadata?.isLocked === true),
    };

    // Update email and metadata
    const { data: { user }, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email,
      user_metadata: newMetadata,
      // If user is locked, set ban duration to 10 years, else none
      ban_duration: newMetadata.isLocked ? "87600h" : "none",
    });

    if (updateError || !user) {
      throw new Error(updateError?.message || "Không thể cập nhật thông tin người dùng.");
    }

    // Gửi email thông báo khóa/mở tài khoản nếu trạng thái thay đổi
    const wasLocked = currentUser.user_metadata?.isLocked === true;
    const isNowLocked = newMetadata.isLocked === true;
    if (wasLocked !== isNowLocked) {
      try {
        if (isNowLocked) {
          await sendAccountLockEmail(email, name);
        } else {
          await sendAccountUnlockEmail(email, name);
        }
      } catch (mailErr: any) {
        console.warn("⚠️ Gặp lỗi khi gửi email thông báo trạng thái tài khoản:", mailErr.message);
      }
    }

    // Keep profiles.role (the source of truth enforced by the admin layout & RLS) in sync.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id, role }, { onConflict: "id" });
    if (profileError) {
      console.error("⚠️ [Supabase DB] Không thể đồng bộ profiles.role:", profileError.message);
    }

    const formattedUser = {

      id: user.id,
      name: user.user_metadata?.name || name,
      email: user.email || email,
      role: user.user_metadata?.role || role,
      isLocked: user.user_metadata?.isLocked === true || !!user.banned_until,
      updatedAt: user.updated_at,
    };

    // Ghi nhận lịch sử hoạt động
    const oldRole = currentUser.user_metadata?.role || "GUEST";
    const isUpgraded = oldRole === "GUEST" && role === "STUDENT";
    
    if (isUpgraded) {
      await logActivity(
        "UPGRADE",
        formattedUser.name,
        formattedUser.email,
        "Nâng cấp quyền học viên (từ GUEST lên STUDENT)",
        request
      );
    } else {
      await logActivity(
        "UPDATE",
        formattedUser.name,
        formattedUser.email,
        `Cập nhật thông tin tài khoản (Vai trò cũ: ${oldRole} -> Vai trò mới: ${formattedUser.role})`,
        request
      );
    }

    return NextResponse.json({
      message: "Cập nhật thông tin người dùng thành công trên Supabase!",
      user: formattedUser,
    });
  } catch (error: any) {
    console.error(`❌ Lỗi API PUT /api/admin/users/[id]:`, error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi cập nhật thông tin người dùng trên Supabase.", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Xóa người dùng hoàn toàn khỏi Supabase
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log(`⚡ [Supabase Auth] Đang xóa người dùng: ${id}...`);

    // Fetch user details first to get their name for response
    const { data: { user }, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(id);
    if (fetchError || !user) {
      return NextResponse.json(
        { message: "Không tìm thấy người dùng này trên Supabase." },
        { status: 404 }
      );
    }

    const name = user.user_metadata?.name || user.email || "Người dùng";
    const emailAddress = user.email || "";
    // Delete from public.users / public.profiles in Supabase public schema
    try {
      await supabaseAdmin.from("users").delete().eq("id", id);
      if (emailAddress) {
        await supabaseAdmin.from("users").delete().eq("email", emailAddress);
      }
      await supabaseAdmin.from("profiles").delete().eq("id", id);
      console.log(`✅ [Supabase DB] Đã dọn dẹp các bảng public (users/profiles) cho ID: ${id}`);
    } catch (sbDbErr: any) {
      console.log(`⚠️ [Supabase DB] Bỏ qua hoặc không thể xóa khỏi public tables:`, sbDbErr.message);
    }

    // 3. Delete user from Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Ghi nhận lịch sử hoạt động
    await logActivity(
      "DELETE",
      name,
      emailAddress,
      `Xóa vĩnh viễn tài khoản người dùng khỏi hệ thống (đồng bộ Auth + DB)`,
      request
    );

    return NextResponse.json({
      message: `Đã xóa tài khoản '${name}' thành công khỏi hệ thống Supabase!`,
    });
  } catch (error: any) {
    console.error(`❌ Lỗi API DELETE /api/admin/users/[id]:`, error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi xóa tài khoản người dùng trên Supabase.", error: error.message },
      { status: 500 }
    );
  }
}
