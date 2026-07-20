"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Check,
  Zap,
  HelpCircle,
  QrCode,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Copy,
  CheckCircle2,
  Crown
} from "lucide-react";

interface PaymentPackage {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  description: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  packageId?: string | null;
}

const getPackageLevel = (id: string | null | undefined): number => {
  if (!id) return 0;
  if (id === "pkg_1") return 1;
  if (id === "pkg_2") return 2;
  if (id === "pkg_3") return 3;
  return 0;
};

// Full bilingual localization mapping for Plus, Pro, Ultra tiers
const getLocalizedTierInfo = (pkg: PaymentPackage, index: number, isEn: boolean) => {
  const hasCustomFeatures = Array.isArray(pkg.features) && pkg.features.length > 0;
  const hasCustomDesc = Boolean(pkg.description && pkg.description.trim());

  let defaultName = pkg.name;
  let subLabel = isEn
    ? `Study Package (${pkg.durationMonths || 3} ${pkg.durationMonths === 1 ? "Month" : "Months"})`
    : `Luyện thi (${pkg.durationMonths || 3} tháng)`;
  let durationText = isEn
    ? `${pkg.durationMonths || 3} ${pkg.durationMonths === 1 ? "Month" : "Months"}`
    : `${pkg.durationMonths || 3} Tháng`;
  let defaultDesc = pkg.description || "";
  let defaultFeatures: string[] = hasCustomFeatures ? pkg.features : [];

  if (index === 0 || pkg.id === "pkg_1") {
    if (!defaultName || pkg.id === "pkg_1" || pkg.name === "IELTS Premium 3 Tháng") {
      defaultName = isEn ? "Plus Plan" : (pkg.name || "Gói Plus");
    }
    subLabel = isEn ? "Basic Test Prep (3 Months)" : "Luyện thi cơ bản (3 tháng)";
    durationText = isEn ? "3 Months" : "3 Tháng";
    if (!hasCustomDesc) {
      defaultDesc = isEn
        ? "Essential IELTS preparation package for students looking for fast 3-month score improvement."
        : "Gói học IELTS cơ bản cho học viên muốn cải thiện cấp tốc trong 3 tháng.";
    }
    if (!hasCustomFeatures) {
      defaultFeatures = isEn
        ? [
            "Full access to Speaking question bank",
            "Automated AI pronunciation evaluation",
            "Detailed answer key explanations",
            "Practice 30 realistic IELTS mock tests"
          ]
        : [
            "Truy cập đầy đủ ngân hàng câu hỏi Speaking",
            "Đánh giá AI tự động phản hồi phát âm",
            "Xem đáp án chi tiết các phần thi",
            "Luyện tập 30 bài thi thử IELTS thực tế"
          ];
    }
  } else if (index === 1 || pkg.id === "pkg_2") {
    if (!defaultName || pkg.id === "pkg_2" || pkg.name === "IELTS VIP 6 Tháng") {
      defaultName = isEn ? "Pro Plan" : (pkg.name || "Gói Pro");
    }
    subLabel = isEn ? "Intensive Band Booster (6 Months)" : "Nâng band chuyên sâu (6 tháng)";
    durationText = isEn ? "6 Months" : "6 Tháng";
    if (!hasCustomDesc) {
      defaultDesc = isEn
        ? "Advanced learning package with in-depth evaluation, ideal for boosting 1.0 - 1.5 bands."
        : "Gói học tập nâng cao, chấm chữa chi tiết, thích hợp cho mục tiêu tăng 1.0 - 1.5 band.";
    }
    if (!hasCustomFeatures) {
      defaultFeatures = isEn
        ? [
            "All features included in Plus Plan",
            "In-depth AI assessment (grammar, lexical resource, fluency)",
            "Priority support response within 2 hours",
            "Smart learning progress analytics",
            "Bonus latest quarterly forecast Speaking materials"
          ]
        : [
            "Tất cả tính năng của gói Plus",
            "Đánh giá chi tiết từ AI nâng cao (ngữ pháp, từ vựng, độ trôi chảy)",
            "Ưu tiên phản hồi hỗ trợ trong 2 giờ",
            "Thống kê tiến độ học tập thông minh",
            "Tặng thêm tài liệu Speaking dự đoán quý mới nhất"
          ];
    }
  } else if (index === 2 || pkg.id === "pkg_3") {
    if (!defaultName || pkg.id === "pkg_3" || pkg.name === "IELTS Master 12 Tháng") {
      defaultName = isEn ? "Ultra Plan" : (pkg.name || "Gói Ultra");
    }
    subLabel = isEn ? "Comprehensive Cambridge & AI (12 Months)" : "Toàn diện Cambridge & AI (12 tháng)";
    durationText = isEn ? "12 Months" : "12 Tháng";
    if (!hasCustomDesc) {
      defaultDesc = isEn
        ? "Comprehensive 1-year test prep solution for learners aiming for target band 7.5+."
        : "Giải pháp luyện thi toàn diện trong 1 năm cho người mất gốc hoặc mục tiêu band điểm cao 7.5+.";
    }
    if (!hasCustomFeatures) {
      defaultFeatures = isEn
        ? [
            "All features included in Pro Plan",
            "Full 12-month unlimited access",
            "Weakness analysis report & personalized improvement roadmap",
            "Cambridge standard output guarantee",
            "Deep-dive AI analytics & optimized personalized learning path"
          ]
        : [
            "Tất cả tính năng của gói Pro",
            "Thời hạn học tập trọn vẹn 12 tháng không giới hạn lượt truy cập",
            "Báo cáo phân tích điểm yếu kèm lộ trình khắc phục cá nhân hóa",
            "Cam kết đầu ra chuẩn IELTS Cambridge",
            "Hỗ trợ phân tích chuyên sâu và lộ trình tối ưu bằng AI"
          ];
    }
  }

  return {
    name: pkg.name || defaultName,
    subLabel,
    durationText,
    description: hasCustomDesc ? pkg.description : defaultDesc,
    features: hasCustomFeatures ? pkg.features : defaultFeatures
  };
};

export default function PricingPage() {
  const { isVip } = useSubscription();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const isEn = locale === "en";

  // State Management
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null);

  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "CANCELLED">("PENDING");
  const [statusPolling, setStatusPolling] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Localization resources
  const text = {
    heroTag: isEn ? "QUALIFICATION & MASTERY" : "GÓI HỌC TẬP QUALI IELTS",
    title: isEn ? "Choose Your Quali IELTS Path" : "Lựa chọn gói học bứt phá IELTS Band điểm",
    subTitle: isEn
      ? "Unlock full access to AI Speaking evaluations, official Cambridge test banks, and interactive study roadmaps tailored for your target score."
      : "Mở khóa toàn bộ tính năng chấm sửa AI Speaking chuyên sâu, ngân hàng đề thi Cambridge chuẩn hóa và lộ trình học tập tự động hóa.",
    btnBuyNow: isEn ? "Activate Premium" : "Đăng ký ngay",
    btnFree: isEn ? "Current Plan" : "Gói hiện tại",
    featuresTitle: isEn ? "Everything you need to hit your target band" : "Trang bị toàn diện cho hành trình chinh phục IELTS",
    checkoutTitle: isEn ? "Secure Checkout" : "Thanh toán học phí an toàn",
    bankInfoTitle: isEn ? "Transfer Details" : "Thông tin chuyển khoản thủ công",
    bankName: isEn ? "Bank" : "Ngân hàng thụ hưởng",
    bankAccount: isEn ? "Account No." : "Số tài khoản",
    bankHolder: isEn ? "Account Holder" : "Tên người nhận",
    transferAmount: isEn ? "Amount" : "Số tiền chuyển",
    transferContent: isEn ? "Transfer Content" : "Cú pháp chuyển khoản",
    copyCode: isEn ? "Copy" : "Sao chép",
    copied: isEn ? "Copied!" : "Đã chép!",
    activeStatusPending: isEn ? "Waiting for transaction detection..." : "Đang chờ hệ thống tự động đối soát chuyển khoản...",
    activeStatusPaid: isEn ? "Payment verified! Account upgraded successfully." : "Thanh toán thành công! Tài khoản đã được nâng cấp.",
    faqTitle: isEn ? "Frequently Asked Questions" : "Câu hỏi thường gặp",
    faqAnswers: [
      {
        q: isEn ? "How long does it take for my account to get upgraded?" : "Sau khi chuyển khoản, mất bao lâu tài khoản của tôi sẽ được nâng cấp?",
        a: isEn
          ? "Our payment system is integrated with automated reconciliations. It usually takes 10 to 30 seconds after your transaction completes."
          : "Hệ thống tự động đối soát qua mã chuyển khoản. Thông thường chỉ từ 10 - 30 giây sau khi nhận chuyển khoản, tài khoản sẽ được kích hoạt tức thì."
      },
      {
        q: isEn ? "What transfer content should I write?" : "Tôi có cần nhập đúng nội dung chuyển khoản không?",
        a: isEn
          ? "Yes, absolutely! The transfer syntax (e.g. QLC INV-XXXXXX) is strictly required for the AI system to identify your invoice automatically."
          : "Rất quan trọng. Bạn giữ nguyên cú pháp chuyển khoản (Ví dụ: QLC INV-XXXXXX) để hệ thống nhận diện hóa đơn tự động nâng cấp."
      },
      {
        q: isEn ? "Can I request assistance if there is any issue?" : "Nếu gặp sự cố thanh toán tôi có thể liên hệ hỗ trợ ở đâu?",
        a: isEn
          ? "You can contact our support team at any time. We offer 24/7 technical support."
          : "Đội ngũ kỹ thuật Quali IELTS hỗ trợ 24/7. Bạn có thể nhắn tin hỗ trợ bất cứ lúc nào."
      }
    ]
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (textStr: string, fieldName: string) => {
    navigator.clipboard.writeText(textStr);
    setCopiedField(fieldName);
    showToast(isEn ? `Copied ${fieldName} to clipboard!` : `Đã sao chép ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Get user session info
  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Student",
          role: session.user.user_metadata?.role || "GUEST",
          packageId: session.user.user_metadata?.packageId || null
        });
      }
    }
    getSession();
  }, []);

  // Fetch active packages
  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await fetch("/api/admin/payments/packages");
        if (res.ok) {
          const data = await res.json();
          const activePkgs = (data.packages || []).filter((p: any) => p.isActive);
          activePkgs.sort((a: any, b: any) => a.price - b.price);
          setPackages(activePkgs);
        }
      } catch (err) {
        console.error("Lỗi lấy gói học phí:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, []);

  // Handle Checkout Action
  const handleCheckout = async (pkg: PaymentPackage) => {
    if (!sessionUser) {
      setShowLoginPrompt(true);
      return;
    }

    setSelectedPackage(pkg);
    setCreatingInvoice(true);
    setPaymentStatus("PENDING");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast(isEn ? "Session expired. Please log in again." : "Phiên làm việc hết hạn. Vui lòng đăng nhập lại.", "error");
        return;
      }

      const res = await fetch("/api/student/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ packageId: pkg.id })
      });

      const data = await res.json();
      if (res.ok) {
        setInvoice(data.invoice);
        setCheckoutModalOpen(true);
        setStatusPolling(true);
      } else {
        showToast(data.message || (isEn ? "Failed to initiate payment." : "Lỗi khởi tạo hóa đơn thanh toán."), "error");
      }
    } catch (err) {
      showToast(isEn ? "Network connection error." : "Lỗi kết nối mạng, vui lòng thử lại.", "error");
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Poll invoice status
  useEffect(() => {
    if (!statusPolling || !invoice) return;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/student/payments/status?invoiceId=${invoice.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "PAID") {
            setPaymentStatus("PAID");
            setStatusPolling(false);
            showToast(isEn ? "Upgrade complete! Redirecting to homepage..." : "Nâng cấp tài khoản thành công! Đang chuyển hướng về trang chủ...", "success");

            // 1. Refresh Supabase session
            try {
              await supabase.auth.refreshSession();
            } catch (refErr) {
              console.warn("Could not refresh session:", refErr);
            }

            // 2. Dispatch custom event for Navbar to update badge to PREMIUM instantly
            window.dispatchEvent(new CustomEvent("user_premium_updated", { detail: { packageId: selectedPackage?.id } }));

            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              setSessionUser(prev => prev ? { ...prev, role: "STUDENT", packageId: selectedPackage?.id } : null);
            }

            setTimeout(() => {
              router.push(`/${locale}`);
            }, 3000);
          }
        }
      } catch (e) {
        console.warn("Lỗi đối soát trạng thái hóa đơn:", e);
      }
    }

    const timer = setInterval(checkStatus, 4000);
    return () => clearInterval(timer);
  }, [statusPolling, invoice, isEn, locale, router, selectedPackage?.id]);



  // Generate dynamic VietQR image URL
  const vietQrUrl = invoice
    ? `https://img.vietqr.io/image/MB-0779598943-compact2.png?amount=${invoice.amount}&addInfo=QLC%20${invoice.id}&accountName=NGUYEN%20TRAN%20KHIET%20DAN`
    : "";

  return (
    <div
      className="min-h-screen bg-[#FBF8EF] text-[#2C3614] pb-24 relative overflow-x-hidden selection:bg-[#5D6B2D] selection:text-white"
      style={{ fontFamily: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      <Navbar />

      {/* Decorative Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#EEF1E2] rounded-full blur-3xl" />
        <div className="absolute top-36 right-10 w-80 h-80 bg-[#FFF3D6] rounded-full blur-3xl" />
      </div>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-[1120px] px-6 pt-32 md:pt-36">
        {/* Toast Alert Notification */}
        {toast && (
          <div
            className={`fixed top-24 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl animate-slide-in text-xs font-black transition-all ${
              toast.type === "success"
                ? "bg-[#EEF1E2] border-[#C5CEAB] text-[#3B5C37]"
                : "bg-[#F7E7DE] border-[#D8A78C] text-[#B9694A]"
            }`}
          >
            <span className="text-base">{toast.type === "success" ? "✓" : "⚡"}</span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C5CEAB] bg-[#EEF1E2] px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#5D6B2D] shadow-sm mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            {text.heroTag}
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-[#1b3d1e] tracking-tight leading-[1.2] max-w-3xl mx-auto drop-shadow-sm">
            {text.title}
          </h1>

          <p className="mt-4 text-[#4e5c4c] font-bold max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {text.subTitle}
          </p>
        </section>

        {/* Pricing Cards Grid (Plus, Pro, Ultra) */}
        <section className="grid md:grid-cols-3 gap-7 mb-20 items-stretch">
          {loading ? (
            // Skeleton Loader matching Profile theme
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#FAF8F2] rounded-[28px] border border-[#DCE2C8] p-8 flex flex-col h-[500px] animate-pulse justify-between"
              >
                <div>
                  <div className="h-6 bg-[#EAE7DC] w-2/3 rounded-lg mb-3" />
                  <div className="h-4 bg-[#EEF1E2] w-1/2 rounded-md mb-8" />
                  <div className="h-10 bg-[#EAE7DC] w-1/3 rounded-lg mb-8" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((f) => (
                      <div key={f} className="h-4 bg-[#EEF1E2] w-full rounded-md" />
                    ))}
                  </div>
                </div>
                <div className="h-12 bg-[#EAE7DC] w-full rounded-2xl" />
              </div>
            ))
          ) : packages.length === 0 ? (
            <div className="col-span-full text-center py-16 text-[#5C6648] font-bold bg-[#FAF8F2] rounded-3xl border border-[#DCE2C8] shadow-sm">
              Không tìm thấy gói cước nào khả dụng. Vui lòng liên hệ quản trị viên.
            </div>
          ) : (
            packages.map((pkg, idx) => {
              const tierInfo = getLocalizedTierInfo(pkg, idx, isEn);

              const isPopular = idx === 1 || pkg.id === "pkg_2"; // Gói Pro là HOT/POPULAR
              const isOwned =
                isVip || (sessionUser && (sessionUser.packageId === pkg.id || (sessionUser.role === "ADMIN" && pkg.id === "pkg_3")));

              return (
                <div
                  key={pkg.id}
                  className={`bg-[#FFFFFF] rounded-[28px] border p-7 flex flex-col justify-between relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    isPopular
                      ? "border-2 border-[#5D6B2D] shadow-[0_12px_36px_rgba(93,107,45,0.12)] scale-[1.03] z-10 bg-[#FAF8F2]"
                      : "border-[#DCE2C8] hover:border-[#C5CEAB] shadow-sm"
                  }`}
                >
                  {/* Popular Badge for Pro Tier */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#5D6B2D] to-[#3B5C37] text-[#FFF8EB] text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-[0_3px_0_#3E4A1B] flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-[#FFE599]" />
                      <span>{isEn ? "MOST POPULAR" : "GÓI PHỔ BIẾN NHẤT"}</span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-[#1b3d1e] tracking-tight">{tierInfo.name}</h3>
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-[#EEF1E2] text-[#5D6B2D] border border-[#C5CEAB]">
                          {tierInfo.durationText}
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-[#5D6B2D] mt-1">
                        {tierInfo.subLabel}
                      </p>
                      <p className="text-xs font-bold text-[#5C6648] mt-2 leading-relaxed min-h-[36px] line-clamp-2">
                        {tierInfo.description}
                      </p>
                    </div>

                    {/* Price Display */}
                    <div className="mb-5 flex flex-col gap-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl md:text-4xl font-black text-[#1b3d1e] tracking-tight">
                          {pkg.price.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                        </span>
                        <span className="text-xs font-black text-[#5C6648]">
                          {isEn ? "VND" : "đ"}
                        </span>
                      </div>
                      <div className="text-[11px] font-extrabold text-[#8A9670] tracking-wide mt-0.5">
                        {isEn ? `Billed once: ${pkg.price.toLocaleString("en-US")} VND` : `Thanh toán một lần: ${pkg.price.toLocaleString("vi-VN")} đ`}
                      </div>
                    </div>

                    <div className="h-[1px] bg-[#EAE7DC] w-full mb-6" />

                    {/* Features List */}
                    <ul className="space-y-3.5 mb-8 flex-1">
                      {tierInfo.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs font-extrabold text-[#3E4A21] leading-snug">
                          <span className="w-4 h-4 rounded-full bg-[#EEF1E2] text-[#5D6B2D] flex items-center justify-center shrink-0 mt-0.5 border border-[#C5CEAB]">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div>
                    {isOwned ? (
                      <div className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-black text-[#3B5C37] bg-[#EEF1E2] border border-[#C5CEAB] rounded-2xl shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#5D6B2D]" />
                        <span>{text.btnFree}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCheckout(pkg)}
                        disabled={creatingInvoice || (sessionUser?.role === "ADMIN" && pkg.id !== "pkg_3")}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer border-none outline-none ${
                          isPopular
                            ? "bg-[#3B5C37] text-[#FFF8EB] shadow-[0_4px_0_#243C21] hover:bg-[#2C4728] hover:shadow-[0_4px_0_#1B2E15] active:translate-y-[2px] active:shadow-[0_2px_0_#1B2E15]"
                            : "bg-[#5D6B2D] text-[#FFF8EB] shadow-[0_4px_0_#3E4A1B] hover:bg-[#4E5C23] hover:shadow-[0_4px_0_#2E3714] active:translate-y-[2px] active:shadow-[0_2px_0_#2E3714]"
                        }`}
                      >
                        {creatingInvoice && selectedPackage?.id === pkg.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{isEn ? "Processing..." : "Đang xử lý..."}</span>
                          </>
                        ) : (
                          <>
                            <span>{text.btnBuyNow}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Benefits Section */}
        <section className="bg-[#FAF8F2] rounded-[32px] border border-[#DCE2C8] p-8 md:p-10 shadow-sm mb-20">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-[#8A9670]">
              {isEn ? "FULL PREPARATION TOOLSET" : "ĐẦY ĐỦ CÔNG CỤ CHINH PHỤC"}
            </span>
            <h2 className="text-2xl font-black text-[#1b3d1e] tracking-tight mt-1">
              {text.featuresTitle}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: isEn ? "Official Test Bank" : "Đề thi Cambridge chuẩn hóa",
                desc: isEn
                  ? "Access 100+ Cambridge Listening & Reading passages with exact scoring breakdown."
                  : "Ngân hàng đề thi Cambridge từ bộ 9 đến bộ 20 với âm thanh chuẩn, bài dịch và giải thích chi tiết."
              },
              {
                icon: Zap,
                title: isEn ? "Instant AI Assessment" : "Chấm AI Speaking & Writing",
                desc: isEn
                  ? "Get instant feedback on pronunciation, grammar, lexical resource, and coherence."
                  : "Thuật toán AI phản hồi và sửa lỗi phát âm, ngữ pháp, từ vựng theo đúng 4 tiêu chí IELTS trong 15 giây."
              },
              {
                icon: TrendingUp,
                title: isEn ? "Adaptive Roadmap" : "Lộ trình tự động thích ứng",
                desc: isEn
                  ? "AI diagnoses your current band score and generates personalized daily learning tasks."
                  : "Hệ thống tự động chẩn đoán điểm yếu, tạo lộ trình luyện tập hàng ngày và đồng bộ tiến độ thời gian thực."
              }
            ].map((benefit, bIdx) => (
              <div key={bIdx} className="bg-white rounded-2xl border border-[#DCE2C8] p-6 shadow-sm space-y-3">
                <div className="w-12 h-12 bg-[#EEF1E2] border border-[#C5CEAB] rounded-xl flex items-center justify-center text-[#5D6B2D]">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-[#1b3d1e]">{benefit.title}</h3>
                <p className="text-xs font-bold text-[#5C6648] leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-[#1b3d1e] tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-[#5D6B2D]" />
              <span>{text.faqTitle}</span>
            </h2>
          </div>

          <div className="space-y-4">
            {text.faqAnswers.map((faq, fIdx) => (
              <div key={fIdx} className="bg-white rounded-2xl border border-[#DCE2C8] p-6 shadow-sm transition-all hover:border-[#C5CEAB]">
                <h4 className="text-sm font-black text-[#1b3d1e] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5D6B2D]" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs font-bold text-[#5C6648] mt-3 leading-relaxed pl-4 border-l-2 border-[#EEF1E2]">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* LOGIN REQUIRED MODAL */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all animate-fade-in">
          <div className="w-full max-w-sm rounded-[28px] bg-[#FBF8EF] p-7 border-2 border-[#DCE2C8] shadow-2xl text-center space-y-5 animate-scale-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF1E2] text-[#5D6B2D] border border-[#C5CEAB]">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-[#1b3d1e]">{isEn ? "Login Required" : "Yêu cầu đăng nhập"}</h3>
              <p className="text-xs font-bold text-[#5C6648] leading-relaxed">
                {isEn
                  ? "Please log in to your Quali IELTS account to activate your Premium plan."
                  : "Vui lòng đăng nhập tài khoản Quali IELTS để tiến hành kích hoạt gói học tập Premium."}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 py-3 rounded-xl border border-[#DCE2C8] bg-white text-[#5C6648] font-black text-xs hover:bg-[#FAF8F2] transition-all cursor-pointer"
              >
                {isEn ? "Cancel" : "Hủy bỏ"}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/auth`)}
                className="flex-1 py-3 rounded-xl bg-[#5D6B2D] text-[#FFF8EB] font-black text-xs shadow-[0_3px_0_#3E4A1B] hover:bg-[#4E5C23] active:translate-y-[2px] transition-all cursor-pointer"
              >
                {isEn ? "Log in Now" : "Đăng nhập ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM CHECKOUT SECURE MODAL */}
      {checkoutModalOpen && selectedPackage && invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl rounded-[32px] bg-[#FBF8EF] border-2 border-[#DCE2C8] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in my-8 max-h-[90vh]">

            {/* Left Column: QR Code & Live Detector */}
            <div className="md:w-1/2 bg-[#F4F1E6] p-8 border-b md:border-b-0 md:border-r border-[#DCE2C8] flex flex-col items-center justify-center text-center space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF1E2] text-[#5D6B2D] text-[10px] font-black uppercase border border-[#C5CEAB] tracking-wider">
                <QrCode className="w-3.5 h-3.5" />
                VIETQR AUTO DETECT
              </div>

              {/* QR Code Container */}
              <div className="relative w-56 h-56 bg-white rounded-2xl p-3 border-2 border-[#DCE2C8] flex items-center justify-center shadow-md">
                <img
                  src={vietQrUrl}
                  alt="VietQR Scan To Pay"
                  className="w-full h-full object-contain rounded-xl"
                />

                {paymentStatus === "PAID" && (
                  <div className="absolute inset-0 bg-[#5D6B2D]/95 rounded-2xl flex flex-col items-center justify-center text-[#FFF8EB] p-4 animate-fade-in">
                    <div className="w-14 h-14 bg-[#FFF8EB] text-[#5D6B2D] rounded-full flex items-center justify-center text-2xl font-black shadow-md mb-2 animate-bounce">
                      ✓
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">{isEn ? "PAYMENT SUCCESSFUL" : "ĐÃ THANH TOÁN"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 max-w-[240px]">
                <h4 className="text-xs font-black text-[#1b3d1e]">{isEn ? "Scan VietQR Code to Pay" : "Quét mã VietQR để thanh toán"}</h4>
                <p className="text-[10.5px] font-bold text-[#5C6648] leading-relaxed">
                  {isEn
                    ? "Open your banking app or MoMo/ZaloPay. Amount & syntax will be auto-filled."
                    : "Mở app Ngân hàng hoặc Ví MoMo/ZaloPay. Số tiền và cú pháp sẽ được điền tự động."}
                </p>
              </div>


            </div>

            {/* Right Column: Transfer Details */}
            <div className="md:w-1/2 p-8 flex flex-col justify-between h-full space-y-6">

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#1b3d1e]">{text.checkoutTitle}</h3>
                  <p className="text-[11px] font-bold text-[#8A9670] mt-0.5">
                    {isEn ? "Invoice ID:" : "Mã hóa đơn:"} <span className="text-[#1b3d1e] font-black">{invoice.id}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutModalOpen(false);
                    setStatusPolling(false);
                  }}
                  className="w-7 h-7 rounded-full bg-[#EAE7DC] text-[#5C6648] hover:text-[#1b3d1e] flex items-center justify-center transition-colors border-none cursor-pointer font-black text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Manual Transfer Information Table */}
              <div className="space-y-3.5">
                {/* Bank Info */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-[#8A9670] uppercase tracking-wider">{text.bankInfoTitle}</span>
                  <div className="bg-white rounded-2xl border border-[#DCE2C8] p-3.5 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[#5C6648]">{text.bankName}:</span>
                      <span className="text-[#1b3d1e] font-black">MBBank (Ngân hàng Quân Đội)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[#5C6648]">{text.bankAccount}:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#1b3d1e] font-black">0779598943</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("0779598943", "STK")}
                          className="p-1 rounded bg-[#EEF1E2] text-[#5D6B2D] hover:bg-[#E2E8CE] transition-all cursor-pointer border-none"
                          title={text.copyCode}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[#5C6648]">{text.bankHolder}:</span>
                      <span className="text-[#1b3d1e] font-black">NGUYEN TRAN KHIET DAN</span>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-[#8A9670] uppercase tracking-wider">{text.transferAmount}</span>
                  <div className="bg-[#EEF1E2] rounded-2xl border border-[#C5CEAB] p-3.5 flex justify-between items-center">
                    <span className="text-sm font-black text-[#3B5C37]">
                      {invoice.amount.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} {isEn ? "VND" : "đ"}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(invoice.amount.toString(), "Số tiền")}
                      className="flex items-center gap-1 text-[10px] font-black text-[#3B5C37] bg-white px-2.5 py-1 rounded-lg border border-[#C5CEAB] hover:bg-[#FAF8F2] transition-all cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedField === "Số tiền" ? text.copied : text.copyCode}</span>
                    </button>
                  </div>
                </div>

                {/* Transfer Content Syntax */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-[#8A9670] uppercase tracking-wider">{text.transferContent}</span>
                  <div className="bg-[#FFF3D6] rounded-2xl border border-[#E9CE9A] p-3.5 flex justify-between items-center">
                    <span className="text-xs font-black text-[#B87A14]">
                      QLC {invoice.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`QLC ${invoice.id}`, "Cú pháp")}
                      className="flex items-center gap-1 text-[10.5px] font-black text-[#B87A14] bg-white px-2.5 py-1 rounded-lg border border-[#E9CE9A] hover:bg-[#FFFDF7] transition-all cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedField === "Cú pháp" ? text.copied : text.copyCode}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Footer */}
              <div className="pt-4 border-t border-[#DCE2C8] flex items-center gap-3">
                {paymentStatus === "PENDING" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#5D6B2D] border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-[11px] font-black text-[#5D6B2D] animate-pulse">
                      {text.activeStatusPending}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 bg-[#5D6B2D] text-[#FFF8EB] rounded-full flex items-center justify-center text-xs font-black shrink-0">
                      ✓
                    </div>
                    <span className="text-[11px] font-black text-[#3B5C37]">
                      {text.activeStatusPaid}
                    </span>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
