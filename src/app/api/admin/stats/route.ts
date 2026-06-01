import { NextRequest, NextResponse } from "next/server";
import { getInvoices } from "@/lib/paymentDb";
import { supabaseAdmin } from "@/lib/supabase";
import { mockDb } from "@/lib/mockDb";

export async function GET(request: NextRequest) {
  try {
    // 1. Lấy dữ liệu hóa đơn
    const invoices = await getInvoices();
    const paidInvoices = invoices.filter(i => i.status === "PAID");
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

    // 2. Lấy dữ liệu người dùng (từ Supabase Auth, fallback sang mockDb)
    let totalUsersCount = 0;
    let activeUsersCount = 0;
    let lockedUsersCount = 0;
    const roleCounts = { ADMIN: 0, STUDENT: 0, GUEST: 0 };

    try {
      console.log("⚡ [Supabase Auth] Đang tải danh sách người dùng cho thống kê...");
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        throw new Error(error.message);
      }

      if (users && users.length > 0) {
        const list = users.map((user) => {
          const metadata = user.user_metadata || {};
          const isLocked = metadata.isLocked === true || !!user.banned_until;
          const role = metadata.role || "GUEST";
          return {
            role: role,
            isLocked: isLocked,
            confirmed: !!user.email_confirmed_at
          };
        });

        totalUsersCount = list.length;
        // Lượng user hoạt động: đã xác thực email và không bị khóa
        activeUsersCount = list.filter(u => !u.isLocked && u.confirmed).length;
        lockedUsersCount = list.filter(u => u.isLocked).length;

        list.forEach(u => {
          const role = u.role as "ADMIN" | "STUDENT" | "GUEST";
          if (roleCounts[role] !== undefined) {
            roleCounts[role]++;
          }
        });
      } else {
        throw new Error("Không có người dùng nào được tìm thấy trên Supabase Auth.");
      }
    } catch (e: any) {
      console.warn("⚠️ Không thể tải dữ liệu người dùng từ Supabase Auth, chuyển sang dùng mockDb:", e.message);
      const users = mockDb.getUsers();
      totalUsersCount = users.length;
      activeUsersCount = users.filter(u => !u.isLocked).length;
      lockedUsersCount = users.filter(u => u.isLocked).length;

      users.forEach(u => {
        const role = u.role as "ADMIN" | "STUDENT" | "GUEST";
        if (roleCounts[role] !== undefined) {
          roleCounts[role]++;
        }
      });
    }

    // 3. Tính toán doanh thu theo 7 ngày gần đây
    const dailyRevenue: { date: string; amount: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      
      // Hóa đơn thanh toán vào ngày này
      const dayInvoices = paidInvoices.filter(inv => {
        const paidDate = inv.paidAt || inv.createdAt;
        return paidDate.startsWith(dateStr);
      });
      
      const dayAmount = dayInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      
      dailyRevenue.push({
        date: `${day}/${month}`,
        amount: dayAmount,
        count: dayInvoices.length
      });
    }

    // 4. Doanh thu theo gói học
    const packageStats: { [key: string]: { count: number; revenue: number; name: string } } = {};
    paidInvoices.forEach(inv => {
      if (!packageStats[inv.packageId]) {
        packageStats[inv.packageId] = {
          count: 0,
          revenue: 0,
          name: inv.packageName
        };
      }
      packageStats[inv.packageId].count++;
      packageStats[inv.packageId].revenue += inv.amount;
    });

    // 5. Tính tỷ lệ chuyển đổi hóa đơn
    const totalInvoicesCount = invoices.length;
    const paidInvoicesCount = paidInvoices.length;
    const conversionRate = totalInvoicesCount > 0 
      ? Math.round((paidInvoicesCount / totalInvoicesCount) * 100) 
      : 0;

    // 6. Danh sách 5 hóa đơn mới nhất
    const sortedInvoices = [...invoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const recentInvoices = sortedInvoices.slice(0, 5);

    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        paidCount: paidInvoicesCount,
        totalCount: totalInvoicesCount,
        conversionRate,
        daily: dailyRevenue,
        byPackage: Object.values(packageStats)
      },
      users: {
        total: totalUsersCount,
        active: activeUsersCount,
        locked: lockedUsersCount,
        roles: roleCounts
      },
      recentInvoices
    });
  } catch (error: any) {
    console.error("❌ Lỗi API GET /api/admin/stats:", error);
    return NextResponse.json(
      { message: "Không thể lấy số liệu thống kê hệ thống.", error: error.message },
      { status: 500 }
    );
  }
}
