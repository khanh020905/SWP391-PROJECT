import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLogger";
import { requireRole, ADMIN_ONLY } from "@/lib/roles";

// GET: Lấy danh sách users từ Supabase Auth DB kèm tìm kiếm, lọc và phân trang
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ADMIN_ONLY);
  if (!auth) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  try {
    console.log("⚡ [Supabase Auth] Đang tải danh sách người dùng...");
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      throw new Error(error.message);
    }

    // Fetch subscription details if table exists
    const subsMap = new Map();
    try {
      const { data: subs, error: subErr } = await supabaseAdmin
        .from("subscriptions")
        .select("user_id, status, plan, expires_at");

      if (!subErr && subs) {
        subs.forEach((s: any) => {
          subsMap.set(s.user_id, s);
        });
      }
    } catch {
      // Ignore if table doesn't exist
    }

    // Format danh sách người dùng từ Supabase Auth thành định dạng mong muốn
    // Only include users who have confirmed their email
    let list = users.filter((user) => !!user.email_confirmed_at).map((user) => {
      const metadata = user.user_metadata || {};
      const isLocked = metadata.isLocked === true || !!user.banned_until;
      let planTier = null;
      let subStatus = "inactive";
      let expiresAt = null;

      if (sub && sub.plan) {
        if (sub.plan === "premium" || sub.plan === "pkg_1") planTier = "pkg_1";
        else if (sub.plan === "vip" || sub.plan === "pkg_2") planTier = "pkg_2";
        else if (sub.plan === "master" || sub.plan === "pkg_3") planTier = "pkg_3";
        else planTier = sub.plan;
        subStatus = sub.status || "active";
        expiresAt = sub.expires_at;
      } else if (metadata.packageId || metadata.role === "STUDENT" || metadata.role === "ADMIN") {
        if (metadata.packageId) {
          planTier = metadata.packageId;
        } else if (metadata.role === "ADMIN") {
          planTier = "pkg_3";
        } else if (metadata.role === "STUDENT") {
          planTier = "pkg_1";
        }
        subStatus = "active";
        expiresAt = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
      }

      return {
        id: user.id,
        name: metadata.name || user.email?.split("@")[0] || "Không tên",
        email: user.email || "",
        role: metadata.role || "GUEST",
        isLocked: isLocked,
        createdAt: user.created_at,
        updatedAt: user.updated_at || user.created_at,
        subscription: planTier ? {
          status: subStatus,
          plan_tier: planTier,
          expires_at: expiresAt
        } : null
      };
    });

    // 1. Tìm kiếm (Search) theo tên hoặc email
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }

    // 2. Lọc vai trò (Role: ADMIN, STUDENT, GUEST)
    if (role && role !== "ALL") {
      list = list.filter((u) => u.role === role);
    }

    // 3. Lọc trạng thái (LOCKED vs ACTIVE)
    if (status === "LOCKED") {
      list = list.filter((u) => u.isLocked);
    } else if (status === "ACTIVE") {
      list = list.filter((u) => !u.isLocked);
    }

    // 4. Sắp xếp theo ngày tạo mới nhất lên đầu
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 5. Phân trang
    const totalUsers = list.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const paginatedList = list.slice(skip, skip + limit);

    return NextResponse.json({
      users: paginatedList,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error: any) {
    console.error("❌ Lỗi tải danh sách users từ Supabase:", error);
    return NextResponse.json(
      { message: "Không thể lấy danh sách người dùng từ cơ sở dữ liệu Supabase.", error: error.message },
      { status: 500 }
    );
  }
}

// POST: Tạo mới một người dùng (Admin tạo trực tiếp trong Supabase)
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ADMIN_ONLY);
  if (!auth) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "Vui lòng cung cấp đầy đủ thông tin: Tên, Email, Mật khẩu và Vai trò." },
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

    console.log("⚡ [Supabase Auth] Đang tạo người dùng mới...");
    const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        isLocked: false,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!user) {
      throw new Error("Không thể khởi tạo đối tượng người dùng.");
    }

    // Create the profiles row with the role (source of truth for access control;
    // there is no DB signup trigger, so admin-created users need it set here).
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: user.id, role }, { onConflict: "id" });
    if (profileError) {
      console.error("⚠️ [Supabase DB] Không thể tạo profiles.role:", profileError.message);
    }

    const formattedUser = {
      id: user.id,
      name: user.user_metadata?.name || name,
      email: user.email || email,
      role: user.user_metadata?.role || role,
      isLocked: false,
      createdAt: user.created_at,
    };

    // Ghi nhận lịch sử hoạt động
    await logActivity(
      "CREATE",
      formattedUser.name,
      formattedUser.email,
      `Tạo tài khoản mới thành công (Vai trò: ${formattedUser.role})`,
      request
    );

    return NextResponse.json(
      { message: "Tạo tài khoản người dùng thành công trên Supabase!", user: formattedUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Lỗi API POST /api/admin/users:", error);
    return NextResponse.json(
      { message: "Đã xảy ra lỗi khi tạo người dùng trên Supabase.", error: error.message },
      { status: 500 }
    );
  }
}
