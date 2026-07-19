import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase";

export interface PaymentPackage {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  description: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface PaymentInvoice {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  amount: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
  paidAt: string | null;
  paymentMethod: "SEPAY" | "MANUAL_BANK" | null;
  sepayTransactionId: string | null;
}

export interface SepayTransaction {
  id: string;
  amount: number;
  transactionDate: string;
  transferContent: string;
  senderAccount: string;
  senderBank: string;
  bankTransactionId: string;
  status: "MATCHED" | "UNMATCHED" | "PENDING";
  matchedInvoiceId: string | null;
}

const PACKAGES_FILE = path.join(process.cwd(), "src", "lib", "paymentPackages.json");
const INVOICES_FILE = path.join(process.cwd(), "src", "lib", "paymentInvoices.json");
const SEPAY_FILE = path.join(process.cwd(), "src", "lib", "sepayTransactions.json");

declare global {
  var __paymentPackagesCache: PaymentPackage[] | undefined;
  var __paymentInvoicesCache: PaymentInvoice[] | undefined;
  var __sepayTransactionsCache: SepayTransaction[] | undefined;
}

function getTmpPath(filePath: string): string {
  const filename = path.basename(filePath);
  return path.join("/tmp", filename);
}

function safeReadFile<T>(filePath: string, defaultData: T): T {
  // 1. Try reading from primary path (process.cwd/src/lib/...)
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      if (data && data.trim().length > 0) {
        return JSON.parse(data);
      }
    }
  } catch {
    // Ignore error and fallback
  }

  // 2. Try reading from /tmp path
  try {
    const tmpPath = getTmpPath(filePath);
    if (fs.existsSync(tmpPath)) {
      const data = fs.readFileSync(tmpPath, "utf-8");
      if (data && data.trim().length > 0) {
        return JSON.parse(data);
      }
    }
  } catch {
    // Ignore error and fallback
  }

  return defaultData;
}

function safeWriteFile(filePath: string, data: any): void {
  const jsonStr = JSON.stringify(data, null, 2);

  // 1. Try writing to primary path (process.cwd/src/lib/...)
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, jsonStr, "utf-8");
    return;
  } catch {
    // Primary path failed (e.g. read-only file system on Vercel)
  }

  // 2. Try writing to /tmp directory
  try {
    const tmpPath = getTmpPath(filePath);
    const dir = path.dirname(tmpPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(tmpPath, jsonStr, "utf-8");
  } catch (err) {
    console.warn(`[paymentDb] Unable to write file to /tmp:`, err);
  }
}

// Initial Data Seeding
const initialPackages: PaymentPackage[] = [
  {
    id: "pkg_1",
    name: "IELTS Premium 3 Tháng",
    price: 5000,
    durationMonths: 3,
    description: "Gói học IELTS cơ bản cho học viên muốn cải thiện cấp tốc trong 3 tháng.",
    features: [
      "Truy cập đầy đủ ngân hàng câu hỏi Speaking",
      "Đánh giá AI tự động phản hồi phát âm",
      "Xem đáp án chi tiết các phần thi",
      "Luyện tập 30 bài thi thử IELTS thực tế"
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "pkg_2",
    name: "IELTS VIP 6 Tháng",
    price: 5000,
    durationMonths: 6,
    description: "Gói học tập nâng cao, chấm chữa chi tiết, thích hợp cho mục tiêu tăng 1.0 - 1.5 band.",
    features: [
      "Tất cả tính năng của gói Premium 3 Tháng",
      "Đánh giá chi tiết từ AI nâng cao (ngữ pháp, từ vựng, độ trôi chảy)",
      "Ưu tiên phản hồi hỗ trợ trong 2 giờ",
      "Thống kê tiến độ học tập thông minh",
      "Tặng thêm tài liệu Speaking dự đoán quý mới nhất"
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "pkg_3",
    name: "IELTS Master 12 Tháng",
    price: 5000,
    durationMonths: 12,
    description: "Giải pháp luyện thi toàn diện trong 1 năm cho người mất gốc hoặc mục tiêu band điểm cao 7.5+.",
    features: [
      "Tất cả tính năng của gói VIP 6 Tháng",
      "Thời hạn học tập trọn vẹn 12 tháng không giới hạn lượt truy cập",
      "Báo cáo phân tích điểm yếu kèm lộ trình khắc phục cá nhân hóa",
      "Cam kết đầu ra chuẩn IELTS Cambridge",
      "Hỗ trợ phân tích chuyên sâu và lộ trình tối ưu bằng AI"
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const initialInvoices: PaymentInvoice[] = [];
const initialSepayTransactions: SepayTransaction[] = [];

// Packages APIs
export async function getPackages(): Promise<PaymentPackage[]> {
  let packages: PaymentPackage[];
  if (globalThis.__paymentPackagesCache) {
    packages = globalThis.__paymentPackagesCache;
  } else {
    packages = safeReadFile(PACKAGES_FILE, initialPackages);
    globalThis.__paymentPackagesCache = packages;
  }

  // Ensure no stale 1-1 tutoring text exists in features
  packages.forEach(pkg => {
    if (Array.isArray(pkg.features)) {
      pkg.features = pkg.features.map(f =>
        typeof f === "string" && (f.includes("1-1") || f.includes("giảng viên"))
          ? "Hỗ trợ phân tích chuyên sâu và lộ trình tối ưu bằng AI"
          : f
      );
    }
  });

  return packages;
}

export async function savePackages(packages: PaymentPackage[]): Promise<void> {
  globalThis.__paymentPackagesCache = packages;
  safeWriteFile(PACKAGES_FILE, packages);
}

export async function createPackage(pkgData: Omit<PaymentPackage, "id" | "createdAt">): Promise<PaymentPackage> {
  const packages = await getPackages();
  const newPkg: PaymentPackage = {
    ...pkgData,
    id: "pkg_" + Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString()
  };
  packages.push(newPkg);
  await savePackages(packages);
  return newPkg;
}

export async function updatePackage(id: string, pkgData: Partial<Omit<PaymentPackage, "id" | "createdAt">>): Promise<PaymentPackage | null> {
  const packages = await getPackages();
  const index = packages.findIndex(p => p.id === id);
  if (index === -1) return null;

  packages[index] = {
    ...packages[index],
    ...pkgData
  };
  await savePackages(packages);
  return packages[index];
}

export async function deletePackage(id: string): Promise<boolean> {
  const packages = await getPackages();
  const filtered = packages.filter(p => p.id !== id);
  if (filtered.length === packages.length) return false;
  await savePackages(filtered);
  return true;
}

// Invoices APIs
export async function getInvoices(): Promise<PaymentInvoice[]> {
  if (globalThis.__paymentInvoicesCache) {
    return globalThis.__paymentInvoicesCache;
  }
  const invoices = safeReadFile(INVOICES_FILE, initialInvoices);
  globalThis.__paymentInvoicesCache = invoices;
  return invoices;
}

export async function saveInvoices(invoices: PaymentInvoice[]): Promise<void> {
  globalThis.__paymentInvoicesCache = invoices;
  safeWriteFile(INVOICES_FILE, invoices);
}

export async function createInvoice(invoiceData: Omit<PaymentInvoice, "id" | "status" | "createdAt" | "paidAt" | "paymentMethod" | "sepayTransactionId">): Promise<PaymentInvoice> {
  const invoices = await getInvoices();
  const newInv: PaymentInvoice = {
    ...invoiceData,
    id: "INV-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    status: "PENDING",
    createdAt: new Date().toISOString(),
    paidAt: null,
    paymentMethod: null,
    sepayTransactionId: null
  };
  invoices.unshift(newInv); // Add to beginning of array
  await saveInvoices(invoices);
  return newInv;
}

export async function updateInvoiceStatus(id: string, status: PaymentInvoice["status"]): Promise<PaymentInvoice | null> {
  const invoices = await getInvoices();
  const index = invoices.findIndex(i => i.id === id);
  if (index === -1) return null;

  invoices[index].status = status;
  if (status === "PAID") {
    invoices[index].paidAt = new Date().toISOString();
  } else {
    invoices[index].paidAt = null;
  }
  
  await saveInvoices(invoices);
  return invoices[index];
}

// Sepay Transactions APIs
export async function getSepayTransactions(): Promise<SepayTransaction[]> {
  if (globalThis.__sepayTransactionsCache) {
    return globalThis.__sepayTransactionsCache;
  }
  const transactions = safeReadFile(SEPAY_FILE, initialSepayTransactions);
  globalThis.__sepayTransactionsCache = transactions;
  return transactions;
}

export async function saveSepayTransactions(transactions: SepayTransaction[]): Promise<void> {
  globalThis.__sepayTransactionsCache = transactions;
  safeWriteFile(SEPAY_FILE, transactions);
}

export async function createSepayTransaction(txData: Omit<SepayTransaction, "status" | "matchedInvoiceId">): Promise<SepayTransaction> {
  const transactions = await getSepayTransactions();
  const newTx: SepayTransaction = {
    ...txData,
    status: "PENDING",
    matchedInvoiceId: null
  };
  transactions.unshift(newTx);
  await saveSepayTransactions(transactions);
  return newTx;
}

export async function matchTransactionAndInvoice(txId: string, invoiceId: string, method: "SEPAY" | "MANUAL_BANK"): Promise<boolean> {
  const transactions = await getSepayTransactions();
  const invoices = await getInvoices();

  const txIndex = transactions.findIndex(t => t.id === txId);
  const invIndex = invoices.findIndex(i => i.id === invoiceId);

  if (txIndex === -1 || invIndex === -1) return false;

  // Update invoice
  invoices[invIndex].status = "PAID";
  invoices[invIndex].paidAt = new Date().toISOString();
  invoices[invIndex].paymentMethod = method;
  invoices[invIndex].sepayTransactionId = txId;

  // Update transaction
  transactions[txIndex].status = "MATCHED";
  transactions[txIndex].matchedInvoiceId = invoiceId;

  await saveInvoices(invoices);
  await saveSepayTransactions(transactions);
  return true;
}

export async function fulfillPaidInvoice(
  invoice: PaymentInvoice,
  paymentMethod: "SEPAY" | "MANUAL_BANK" = "SEPAY",
  sepayTransactionId?: string
): Promise<PaymentInvoice> {
  const invoices = await getInvoices();
  const idx = invoices.findIndex(i => i.id === invoice.id);
  const paidAt = new Date().toISOString();

  const updatedInvoice: PaymentInvoice = {
    ...invoice,
    status: "PAID",
    paidAt: invoice.paidAt || paidAt,
    paymentMethod: paymentMethod || invoice.paymentMethod || "SEPAY",
    sepayTransactionId: sepayTransactionId || invoice.sepayTransactionId || null
  };

  if (idx !== -1) {
    invoices[idx] = updatedInvoice;
  } else {
    invoices.unshift(updatedInvoice);
  }
  await saveInvoices(invoices);

  // Sync Supabase Auth user_metadata, profiles table, and subscriptions table
  try {
    const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (!listErr && users) {
      const matchUser = users.find(u =>
        (invoice.userId && u.id === invoice.userId) ||
        (u.email?.toLowerCase() === invoice.userEmail?.toLowerCase())
      );

      if (matchUser) {
        const currentMetadata = matchUser.user_metadata || {};
        const newRole = currentMetadata.role === "ADMIN" ? "ADMIN" : "STUDENT";

        await supabaseAdmin.auth.admin.updateUserById(matchUser.id, {
          user_metadata: {
            ...currentMetadata,
            role: newRole,
            packageId: invoice.packageId,
            packageName: invoice.packageName,
            pendingInvoice: null,
            paidInvoice: updatedInvoice,
            invoices: [
              updatedInvoice,
              ...(currentMetadata.invoices || []).filter((i: any) => i.id !== invoice.id)
            ]
          }
        });

        // Sync profiles table
        try {
          await supabaseAdmin.from("profiles").upsert({
            id: matchUser.id,
            role: newRole
          }, { onConflict: "id" });
        } catch (pErr: any) {
          console.warn("⚠️ Could not sync profiles table:", pErr?.message);
        }

        // Sync subscriptions table
        try {
          const durationDays = invoice.packageId === "pkg_1" ? 90 : invoice.packageId === "pkg_2" ? 180 : 365;
          const expiresAt = new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString();
          const planName = invoice.packageId === "pkg_1" ? "premium" : invoice.packageId === "pkg_2" ? "vip" : "master";

          await supabaseAdmin.from("subscriptions").upsert({
            user_id: matchUser.id,
            plan: planName,
            status: "active",
            expires_at: expiresAt
          }, { onConflict: "user_id" });
        } catch (subErr: any) {
          console.warn("⚠️ Could not sync subscriptions table:", subErr?.message);
        }
      }
    }
  } catch (err: any) {
    console.error("⚠️ Error in fulfillPaidInvoice Supabase sync:", err?.message);
  }

  return updatedInvoice;
}
