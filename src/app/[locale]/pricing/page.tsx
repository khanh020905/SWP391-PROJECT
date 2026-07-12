"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  CreditCard,
  RefreshCw,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  Mail,
  AlertCircle
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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "CANCELLED">("PENDING");
  const [statusPolling, setStatusPolling] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(false);

  // Localization resources
  const text = {
    title: isEn ? "Choose Your Quali IELTS Path" : "Chọn lộ trình học tập Quali IELTS",
    subTitle: isEn 
      ? "Unlock full access to AI Speaking evaluations, IELTS test banks, and interactive study roadmaps tailored for your target score." 
      : "Kích hoạt toàn bộ tính năng chấm chữa AI Speaking nâng cao, ngân hàng đề thi IELTS chuẩn Cambridge và lộ trình học tập thông minh.",
    cycleMonthly: isEn ? "Monthly billing" : "Thanh toán theo tháng",
    cycleYearly: isEn ? "Yearly billing" : "Thanh toán theo năm",
    saveBadge: isEn ? "Save 20%" : "Tiết kiệm 20%",
    btnBuyNow: isEn ? "Get Started Now" : "Kích hoạt Premium",
    btnFree: isEn ? "Current Plan" : "Kế hoạch hiện tại",
    featuresTitle: isEn ? "Everything you need to hit your target band" : "Trang bị toàn diện để bứt phá band điểm",
    checkoutTitle: isEn ? "Secure Checkout" : "Thanh toán học phí an toàn",
    checkoutDesc: isEn 
      ? "Scan the QR code below using any bank app or e-wallet to complete your payment instantly." 
      : "Sử dụng ứng dụng ngân hàng hoặc ví điện tử quét mã VietQR dưới đây để kích hoạt tài khoản tự động.",
    bankInfoTitle: isEn ? "Manual Transfer Information" : "Thông tin chuyển khoản thủ công",
    bankName: isEn ? "Beneficiary Bank" : "Ngân hàng thụ hưởng",
    bankAccount: isEn ? "Account Number" : "Số tài khoản",
    bankHolder: isEn ? "Beneficiary Holder" : "Tên người nhận",
    transferAmount: isEn ? "Transfer Amount" : "Số tiền chuyển",
    transferContent: isEn ? "Transfer Content" : "Cú pháp chuyển khoản",
    activeStatusPending: isEn ? "Waiting for payment detection..." : "Đang chờ hệ thống ghi nhận chuyển khoản...",
    activeStatusPaid: isEn ? "Payment successful! Account upgraded." : "Thanh toán thành công! Tài khoản đã được nâng cấp.",
    faqTitle: isEn ? "Frequently Asked Questions" : "Câu hỏi thường gặp",
    faqAnswers: [
      {
        q: isEn ? "How long does it take for my account to get upgraded?" : "Sau khi chuyển khoản, mất bao lâu tài khoản của tôi sẽ được nâng cấp?",
        a: isEn 
          ? "Our payment system is integrated with automated reconciliations. It usually takes 10 to 30 seconds after your transaction completes." 
          : "Hệ thống liên kết với cổng đối soát giao dịch tự động. Thông thường chỉ mất từ 10 - 30 giây sau khi bạn chuyển khoản thành công, tài khoản sẽ được nâng cấp lên STUDENT."
      },
      {
        q: isEn ? "What transfer content should I write?" : "Tôi có cần viết đúng cú pháp chuyển khoản không?",
        a: isEn 
          ? "Yes. The transfer syntax must strictly match the code shown in the QR. It is used to identify your invoice automatically."
          : "Rất quan trọng. Cú pháp chuyển khoản phải khớp chính xác mã hiển thị trên màn hình (Ví dụ: QLC INV-XXXXXX). Hệ thống dùng mã này để nhận diện hóa đơn và nâng cấp tự động."
      },
      {
        q: isEn ? "Can I get a refund if I change my mind?" : "Chính sách hoàn tiền của Quali IELTS như thế nào?",
        a: isEn 
          ? "We offer a 7-day money-back guarantee if you are not satisfied with our AI evaluation feedback. Contact support for assistance."
          : "Chúng tôi cam kết hoàn học phí 100% trong vòng 7 ngày đầu tiên nếu bạn không hài lòng với kết quả chấm sửa AI hoặc ngân hàng đề thi."
      }
    ]
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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
          // Filter only active packages
          const activePkgs = (data.packages || []).filter((p: any) => p.isActive);
          // Sort by price ascending
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
            
            // Force refresh session state role to STUDENT
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              setSessionUser(prev => prev ? { ...prev, role: "STUDENT", packageId: selectedPackage?.id } : null);
            }

            // Redirect to homepage after 3 seconds
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

    return () => {
      clearInterval(timer);
    };
  }, [statusPolling, invoice, isEn, locale, router, selectedPackage?.id]);

  // Handle Simulated payment for demo and test presentation
  const handleSimulatePayment = async () => {
    if (!invoice) return;
    setSimulationLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Simulate a webhook call from Sepay
      const res = await fetch("/api/admin/payments/sepay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: invoice.amount,
          transferContent: `QLC ${invoice.id}`,
          senderAccount: "0987654321",
          senderBank: "Vietcombank"
        })
      });

      if (res.ok) {
        showToast(isEn ? "Matched payment successfully (Simulation)" : "Giả lập chuyển khoản thành công!");
      } else {
        showToast("Lỗi giả lập thanh toán.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối.", "error");
    } finally {
      setSimulationLoading(false);
    }
  };

  // Generate dynamic VietQR image URL
  const vietQrUrl = invoice
    ? `https://img.vietqr.io/image/MB-0779598943-compact2.png?amount=${invoice.amount}&addInfo=QLC%20${invoice.id}&accountName=NGUYEN%20TRAN%20KHIET%20DAN`
    : "";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f1738] font-sans pb-20">
      <Navbar />

      {/* Main Container */}
      <main className="mx-auto max-w-[1080px] px-6 pt-32">
        {/* Toast Alert */}
        {toast && (
          <div className={`fixed top-24 right-6 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-2xl border shadow-lg animate-slide-in text-xs font-bold ${
            toast.type === "success" 
              ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
              : "bg-rose-50 border-rose-100 text-rose-700"
          }`}>
            <span className="text-base">{toast.type === "success" ? "✓" : "⚡"}</span>
            <span>{toast.message}</span>
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center mb-16">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#c7d1b8] bg-[#ebefe0]/80 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#3B5C37] mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Quali IELTS Premium Plans
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1b3d1e] tracking-tight leading-tight max-w-2xl mx-auto">
            {text.title}
          </h1>
          <p className="mt-5 text-[#4e5c4c] font-medium max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            {text.subTitle}
          </p>

        </section>

        {/* Pricing Cards Grid */}
        <section className="grid md:grid-cols-3 gap-8 mb-20 items-stretch">
          {loading ? (
            // Loading Skeletons
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[32px] border border-slate-200 p-8 flex flex-col h-[480px] animate-pulse">
                <div className="h-6 bg-slate-100 w-2/3 rounded-lg mb-4" />
                <div className="h-4 bg-slate-50 w-1/2 rounded-md mb-8" />
                <div className="h-10 bg-slate-100 w-1/3 rounded-lg mb-8" />
                <div className="space-y-3 flex-1">
                  {[1, 2, 3, 4].map(f => (
                    <div key={f} className="h-4 bg-slate-50 w-full rounded-md" />
                  ))}
                </div>
                <div className="h-12 bg-slate-100 w-full rounded-2xl" />
              </div>
            ))
          ) : packages.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 font-medium bg-white rounded-3xl border shadow-sm">
              Không tìm thấy gói cước nào khả dụng. Vui lòng liên hệ quản trị viên.
            </div>
          ) : (
            packages.map((pkg, idx) => {
              // Calculate dynamic price based on monthly/yearly cycle
              const displayPriceMonthly = Math.round(pkg.price / pkg.durationMonths);

              const isPopular = idx === 1; // Middle package is popular
              const userLevel = sessionUser ? (sessionUser.role === "ADMIN" ? 3 : getPackageLevel(sessionUser.packageId)) : 0;
              const pkgLevel = getPackageLevel(pkg.id);
              
              return (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-[32px] border p-8 flex flex-col justify-between relative shadow-[0_4px_24px_rgba(20,28,60,0.02)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    isPopular 
                      ? "border-[#3B5C37] shadow-[0_16px_40px_rgba(59,92,55,0.06)] scale-105 z-10" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute top-0 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-gradient-to-r from-[#3B5C37] to-[#B38F4D] text-white text-[9px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-sm">
                      POPULAR PLAN
                    </span>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-xl font-black text-[#0f1738]">{pkg.name}</h3>
                      <p className="text-xs font-semibold text-slate-400 mt-2 leading-relaxed h-12 overflow-hidden line-clamp-2">
                        {pkg.description}
                      </p>
                    </div>

                    {/* Price display */}
                    <div className="mb-4 flex flex-col gap-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-[#0f1738] tracking-tight">
                          {displayPriceMonthly.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {isEn ? "VND" : "đ"}/{isEn ? "mo" : "tháng"}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 tracking-wide mt-1">
                        {isEn ? `Billed once: ${pkg.price.toLocaleString("en-US")} VND` : `Thanh toán một lần: ${pkg.price.toLocaleString("vi-VN")} đ`}
                      </div>
                    </div>
                    <div className="h-[1px] bg-slate-100 w-full mb-6" /> {/* Border separator */}

                    {/* Features list */}
                    <ul className="space-y-4 mb-8 flex-1">
                      {pkg.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs font-bold text-slate-600 leading-normal">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div>
                    {isVip || (sessionUser && userLevel >= pkgLevel) ? (
                      <div className="w-full flex items-center justify-center p-3 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        ✓ {sessionUser && (pkg.id === sessionUser.packageId || (sessionUser.role === "ADMIN" && pkg.id === "pkg_3")) ? text.btnFree : (isEn ? "Owned" : "Đã sở hữu")}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCheckout(pkg)}
                        disabled={creatingInvoice || (sessionUser?.role === "ADMIN" && pkg.id !== "pkg_3")}
                        className={`w-full flex items-center justify-center gap-1.5 py-4 rounded-2xl text-xs font-black transition-all cursor-pointer border-none outline-none hover:scale-[1.02] active:scale-98 shadow-sm ${
                          isPopular 
                            ? "bg-[#3B5C37] text-white hover:bg-[#2c4728] shadow-[#3B5C37]/15" 
                            : "bg-[#0d153a] text-white hover:bg-[#070b24] shadow-slate-200"
                        }`}
                      >
                        {creatingInvoice && selectedPackage?.id === pkg.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Đang tạo hóa đơn...</span>
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

        {/* Benefits list section */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm mb-20">
          <h2 className="text-xl font-black text-[#1b3d1e] tracking-tight mb-8 text-center">
            {text.featuresTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: isEn ? "Official Content" : "Đề thi chuẩn hóa",
                desc: isEn 
                  ? "Standard Cambridge practice test bank with complete audio context and exact matching answers." 
                  : "Ngân hàng đề thi Cambridge chuẩn hóa với ngữ cảnh âm thanh đầy đủ và đáp án đối soát chi tiết."
              },
              {
                icon: Zap,
                title: isEn ? "Instant AI Assessment" : "Đánh giá AI tức thì",
                desc: isEn 
                  ? "AI algorithm processes your recordings and writing within 15 seconds to pinpoint score goals." 
                  : "Thuật toán AI chấm bài tự động trong vòng 15 giây, phân tích phát âm và ngữ pháp theo tiêu chuẩn IELTS."
              },
              {
                icon: RefreshCw,
                title: isEn ? "Synced Multi-device" : "Đồng bộ tiến trình",
                desc: isEn 
                  ? "Learn anywhere, anytime. Progress points are fully synced to roadmaps on both desktop and mobile." 
                  : "Học tập mọi lúc mọi nơi. Tiến độ học và từ vựng của bạn được đồng bộ 100% trên điện thoại và máy tính."
              }
            ].map((benefit, bIdx) => (
              <div key={bIdx} className="text-center md:text-left space-y-3">
                <div className="w-12 h-12 bg-[#edf3e8] rounded-xl flex items-center justify-center text-[#3B5C37] mx-auto md:mx-0">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-[#0f1738]">{benefit.title}</h3>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-[#1b3d1e] tracking-tight text-center mb-10 flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#3B5C37]" />
            {text.faqTitle}
          </h2>
          <div className="space-y-6">
            {text.faqAnswers.map((faq, fIdx) => (
              <div key={fIdx} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h4 className="text-sm font-black text-[#0f1738]">{faq.q}</h4>
                <p className="text-xs font-semibold text-slate-500 mt-2.5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* LOGIN REQUIRED MODAL */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all animate-fade-in">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-8 border border-slate-100 shadow-2xl text-center space-y-6 animate-scale-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf3e8] text-[#3B5C37] border border-[#ebefe0]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-[#0f1738]">Yêu cầu đăng nhập</h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Vui lòng đăng nhập tài khoản Quali IELTS của bạn để thực hiện đăng ký nâng cấp gói học tập Premium.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/auth`)}
                className="flex-1 py-3.5 rounded-xl bg-[#3B5C37] text-white font-bold text-xs hover:bg-[#2c4728] active:scale-95 transition-all cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM CHECKOUT SECURE MODAL */}
      {checkoutModalOpen && selectedPackage && invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl rounded-[32px] bg-white border border-slate-100 shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in my-8 max-h-[90vh]">
            
            {/* Left Column: QR Code scanning */}
            <div className="md:w-1/2 bg-[#f8fafc] p-8 border-b md:border-b-0 md:border-r border-slate-200/80 flex flex-col items-center justify-center text-center space-y-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase border border-emerald-100 tracking-wider">
                <QrCode className="w-3.5 h-3.5" />
                VIETQR AUTO DETECT
              </span>

              {/* QR Image */}
              <div className="relative w-52 h-52 bg-white rounded-3xl p-3 border border-slate-200 flex items-center justify-center shadow-sm">
                <img
                  src={vietQrUrl}
                  alt="VietQR Scan To Pay"
                  className="w-full h-full object-contain rounded-2xl"
                />
                
                {paymentStatus === "PAID" && (
                  <div className="absolute inset-0 bg-emerald-500/90 rounded-3xl flex flex-col items-center justify-center text-white p-4 animate-fade-in">
                    <div className="w-14 h-14 bg-white text-emerald-500 rounded-full flex items-center justify-center text-2xl font-black shadow-md mb-2 animate-bounce">
                      ✓
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">PAYMENT APPROVED</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 max-w-[240px]">
                <h4 className="text-xs font-black text-slate-700 leading-normal">Quét mã để kích hoạt</h4>
                <p className="text-[10px] font-semibold text-slate-450 leading-relaxed">
                  Mở ứng dụng ngân hàng và chọn Quét mã QR. Số tiền và cú pháp sẽ được tự động điền.
                </p>
              </div>

              {/* Simulation Testing Tool */}
              <div className="pt-2 w-full max-w-[240px] border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={simulationLoading || paymentStatus === "PAID"}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#c7d1b8] bg-[#ebefe0]/50 hover:bg-[#ebefe0] text-[#3B5C37] text-[10px] font-bold cursor-pointer disabled:opacity-55 active:scale-98 transition-all"
                >
                  <RefreshCw className={`w-3 h-3 ${simulationLoading ? "animate-spin" : ""}`} />
                  Giả lập thanh toán (Test)
                </button>
              </div>
            </div>

            {/* Right Column: Transfer information details */}
            <div className="md:w-1/2 p-8 flex flex-col justify-between h-full space-y-6">
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#0f1738]">{text.checkoutTitle}</h3>
                  <p className="text-[10.5px] font-semibold text-slate-400 mt-1 leading-relaxed">
                    Hóa đơn: <strong className="text-slate-650 font-black">{invoice.id}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCheckoutModalOpen(false);
                    setStatusPolling(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent outline-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Bank Details Table */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{text.bankInfoTitle}</span>
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">{text.bankName}:</span>
                      <span className="text-slate-700">MBBank (Ngân hàng Quân Đội)</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">{text.bankAccount}:</span>
                      <span className="text-slate-700 select-all">0779598943</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">{text.bankHolder}:</span>
                      <span className="text-slate-700">NGUYEN TRAN KHIET DAN</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{text.transferAmount}</span>
                  <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100/60 p-4 flex justify-between items-center">
                    <span className="text-xs font-black text-emerald-800">
                      {invoice.amount.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} đ
                    </span>
                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded uppercase">
                      Chính xác
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{text.transferContent}</span>
                  <div className="bg-amber-50/50 rounded-2xl border border-amber-100/60 p-4 flex justify-between items-center">
                    <span className="text-xs font-black text-amber-800 select-all">
                      QLC {invoice.id}
                    </span>
                    <span className="text-[9px] font-black text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded uppercase">
                      Không đổi
                    </span>
                  </div>
                </div>
              </div>

              {/* Status display footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                {paymentStatus === "PENDING" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#3B5C37] border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-[11px] font-bold text-[#3B5C37] animate-pulse">
                      {text.activeStatusPending}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">
                      ✓
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-600">
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
