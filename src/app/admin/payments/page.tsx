"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Unlock,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  CreditCard,
  TrendingUp,
  FileText,
  ArrowRightLeft,
  Calendar,
  Zap,
  CheckSquare,
  Coins,
  Check,
  Play,
  Layers,
  Sparkles
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

interface PaymentInvoice {
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

interface SepayTransaction {
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

export default function PaymentManagementPage() {
  const [activeTab, setActiveTab] = useState<"sepay" | "invoices" | "packages">("sepay");
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; subMessage?: string } | null>(null);

  // Data States
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [invoices, setInvoices] = useState<PaymentInvoice[]>([]);
  const [sepayTransactions, setSepayTransactions] = useState<SepayTransaction[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Loading States for actions
  const [actionLoading, setActionLoading] = useState(false);

  // Modals States
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [pkgModalMode, setPkgModalMode] = useState<"add" | "edit">("add");
  const [selectedPkg, setSelectedPkg] = useState<PaymentPackage | null>(null);
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<SepayTransaction | null>(null);

  // Form Fields - Package
  const [pkgName, setPkgName] = useState("");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgDuration, setPkgDuration] = useState("3");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgFeatures, setPkgFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState("");
  const [pkgIsActive, setPkgIsActive] = useState(true);

  // Form Fields - Invoice
  const [invUserEmail, setInvUserEmail] = useState("");
  const [invUserName, setInvUserName] = useState("");
  const [invPkgId, setInvPkgId] = useState("");
  const [invAmount, setInvAmount] = useState("");

  // Form Fields - Simulate Webhook
  const [simAmount, setSimAmount] = useState("");
  const [simContent, setSimContent] = useState("");
  const [simSenderAcc, setSimSenderAcc] = useState("0987654321");
  const [simSenderBank, setSimSenderBank] = useState("Vietcombank");

  // Form Fields - Match Manual
  const [matchInvoiceId, setMatchInvoiceId] = useState("");

  // ShowToast helper
  const showToast = useCallback((message: string, type: "success" | "error" = "success", subMessage?: string) => {
    setToast({ message, type, subMessage });
    setTimeout(() => {
      setToast(null);
    }, 5500);
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch packages
      const pkgRes = await fetch("/api/admin/payments/packages");
      const pkgData = await pkgRes.json();
      if (pkgRes.ok) setPackages(pkgData.packages || []);

      // Fetch invoices
      const invRes = await fetch("/api/admin/payments/invoices?limit=100");
      const invData = await invRes.json();
      if (invRes.ok) setInvoices(invData.invoices || []);

      // Fetch sepay
      const txRes = await fetch("/api/admin/payments/sepay");
      const txData = await txRes.json();
      if (txRes.ok) setSepayTransactions(txData.transactions || []);
    } catch (error) {
      console.error(error);
      showToast("Không thể kết nối máy chủ để tải dữ liệu.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute KPI values
  const totalRevenue = invoices
    .filter(i => i.status === "PAID")
    .reduce((sum, item) => sum + item.amount, 0);

  const pendingInvoicesCount = invoices.filter(i => i.status === "PENDING").length;
  const paidInvoicesCount = invoices.filter(i => i.status === "PAID").length;
  const unmatchedTxCount = sepayTransactions.filter(t => t.status === "UNMATCHED" || t.status === "PENDING").length;

  // Package Actions
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setPkgFeatures([...pkgFeatures, newFeatureText.trim()]);
    setNewFeatureText("");
  };

  const handleRemoveFeature = (index: number) => {
    setPkgFeatures(pkgFeatures.filter((_, i) => i !== index));
  };

  const openAddPkgModal = () => {
    setPkgModalMode("add");
    setSelectedPkg(null);
    setPkgName("");
    setPkgPrice("");
    setPkgDuration("3");
    setPkgDescription("");
    setPkgFeatures([]);
    setPkgIsActive(true);
    setShowPkgModal(true);
  };

  const openEditPkgModal = (pkg: PaymentPackage) => {
    setPkgModalMode("edit");
    setSelectedPkg(pkg);
    setPkgName(pkg.name);
    setPkgPrice(pkg.price.toString());
    setPkgDuration(pkg.durationMonths.toString());
    setPkgDescription(pkg.description);
    setPkgFeatures(pkg.features);
    setPkgIsActive(pkg.isActive);
    setShowPkgModal(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName || !pkgPrice) {
      showToast("Vui lòng nhập tên gói và giá tiền.", "error");
      return;
    }

    setActionLoading(true);
    try {
      const url = pkgModalMode === "add" 
        ? "/api/admin/payments/packages" 
        : `/api/admin/payments/packages/${selectedPkg?.id}`;
      
      const method = pkgModalMode === "add" ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pkgName,
          price: Number(pkgPrice),
          durationMonths: Number(pkgDuration),
          description: pkgDescription,
          features: pkgFeatures,
          isActive: pkgIsActive
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast(
          pkgModalMode === "add" 
            ? "Đã tạo gói thanh toán thành công!" 
            : "Đã cập nhật gói thanh toán thành công!"
        );
        setShowPkgModal(false);
        fetchData();
      } else {
        showToast(data.message || "Lỗi lưu gói thanh toán.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối mạng.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePackage = async (pkg: PaymentPackage) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa gói thanh toán '${pkg.name}' không?`)) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/packages/${pkg.id}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (response.ok) {
        showToast(`Đã xóa gói '${pkg.name}' thành công!`);
        fetchData();
      } else {
        showToast(data.message || "Lỗi xóa gói cước.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối mạng.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePkgActive = async (pkg: PaymentPackage) => {
    try {
      const response = await fetch(`/api/admin/payments/packages/${pkg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pkg,
          isActive: !pkg.isActive
        })
      });

      if (response.ok) {
        showToast(`Đã ${!pkg.isActive ? "kích hoạt" : "tắt kích hoạt"} gói cước thành công!`);
        fetchData();
      } else {
        showToast("Lỗi đổi trạng thái gói cước.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối.", "error");
    }
  };

  // Invoice Actions
  const handlePkgChangeForInvoice = (pkgId: string) => {
    setInvPkgId(pkgId);
    const selected = packages.find(p => p.id === pkgId);
    if (selected) {
      setInvAmount(selected.price.toString());
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invUserEmail || !invUserName || !invPkgId || !invAmount) {
      showToast("Vui lòng điền đầy đủ thông tin hóa đơn.", "error");
      return;
    }

    const pkg = packages.find(p => p.id === invPkgId);
    if (!pkg) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/payments/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: invUserEmail,
          userName: invUserName,
          packageId: invPkgId,
          packageName: pkg.name,
          amount: Number(invAmount)
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast(`Tạo thành công hóa đơn ${data.invoice.id} cho ${invUserName}!`);
        setShowInvoiceModal(false);
        // Clear Form
        setInvUserEmail("");
        setInvUserName("");
        setInvPkgId("");
        setInvAmount("");
        fetchData();
      } else {
        showToast(data.message || "Lỗi tạo hóa đơn.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối mạng.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveInvoiceDirectly = async (invoice: PaymentInvoice) => {
    if (!confirm(`Xác nhận duyệt thanh toán thủ công cho hóa đơn ${invoice.id} (${invoice.packageName}) của ${invoice.userName}?`)) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          paymentMethod: "MANUAL_BANK"
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast(
          "Duyệt hóa đơn thành công!",
          "success",
          data.upgradeMessage
        );
        fetchData();
      } else {
        showToast(data.message || "Lỗi duyệt hóa đơn.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối mạng.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInvoice = async (invoice: PaymentInvoice) => {
    if (!confirm(`Hủy bỏ hóa đơn ${invoice.id}?`)) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED"
        })
      });

      if (response.ok) {
        showToast(`Đã hủy hóa đơn ${invoice.id} thành công!`);
        fetchData();
      } else {
        showToast("Lỗi hủy hóa đơn.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Sepay Webhook Simulation
  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simAmount || !simContent) {
      showToast("Vui lòng nhập số tiền và nội dung chuyển khoản.", "error");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/payments/sepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(simAmount),
          transferContent: simContent,
          senderAccount: simSenderAcc,
          senderBank: simSenderBank
        })
      });

      const data = await response.json();
      if (response.ok) {
        if (data.autoMatched) {
          showToast(
            "Mô phỏng thành công: Khớp tự động hoàn tất!",
            "success",
            `Hóa đơn ${data.matchedInvoice.id} đã thanh toán. ${data.upgradeMessage}`
          );
        } else {
          showToast(
            "Mô phỏng thành công: Không khớp tự động.",
            "success",
            "Giao dịch đã được lưu và chuyển sang trạng thái chờ đối soát thủ công."
          );
        }
        setShowSimulateModal(false);
        setSimAmount("");
        setSimContent("");
        fetchData();
      } else {
        showToast(data.message || "Lỗi mô phỏng cổng thanh toán.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Sepay Manual Matching
  const openMatchModal = (tx: SepayTransaction) => {
    setSelectedTx(tx);
    setMatchInvoiceId("");
    setShowMatchModal(true);
  };

  const handleMatchManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !matchInvoiceId) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/payments/sepay", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: selectedTx.id,
          invoiceId: matchInvoiceId
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast(
          "Đối soát & duyệt thành công!",
          "success",
          `Giao dịch được liên kết thành công với hóa đơn ${matchInvoiceId}. ${data.upgradeMessage}`
        );
        setShowMatchModal(false);
        setSelectedTx(null);
        setMatchInvoiceId("");
        fetchData();
      } else {
        showToast(data.message || "Lỗi đối soát.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering Logic
  const getFilteredInvoices = () => {
    return invoices.filter(inv => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        inv.id.toLowerCase().includes(query) ||
        inv.userEmail.toLowerCase().includes(query) ||
        inv.userName.toLowerCase().includes(query) ||
        inv.packageName.toLowerCase().includes(query);
      
      const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredTransactions = () => {
    return sepayTransactions.filter(tx => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        tx.id.toLowerCase().includes(query) ||
        tx.transferContent.toLowerCase().includes(query) ||
        tx.senderAccount.toLowerCase().includes(query) ||
        tx.senderBank.toLowerCase().includes(query) ||
        tx.bankTransactionId.toLowerCase().includes(query);
      
      const matchesStatus = statusFilter === "ALL" || tx.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  return (
    <div className="space-y-8 relative pb-16">
      {/* Toast Notification Custom */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-1 bg-white px-5 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border-l-4 border-l-[#3B5C37] border border-slate-100 animate-slide-in max-w-md">
          <div className="flex items-center gap-3">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
            )}
            <span className="text-sm font-bold text-slate-800 leading-tight">{toast.message}</span>
          </div>
          {toast.subMessage && (
            <p className="text-[11px] text-slate-400 font-semibold pl-9 mt-0.5 leading-relaxed">{toast.subMessage}</p>
          )}
        </div>
      )}

      {/* KPI Row */}
      <section className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        {/* KPI: Doanh thu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-[#e8ede6] flex items-center justify-center text-[#3B5C37] flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Tổng doanh thu</div>
            <div className="text-2xl font-black text-[#0d153a] mt-0.5">
              {totalRevenue.toLocaleString("vi-VN")} <span className="text-xs font-bold text-slate-500">đ</span>
            </div>
          </div>
        </div>

        {/* KPI: Hóa đơn đã thu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Hóa đơn đã thu</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{paidInvoicesCount}</div>
          </div>
        </div>

        {/* KPI: Hóa đơn chờ duyệt */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Hóa đơn chờ duyệt</div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{pendingInvoicesCount}</div>
          </div>
        </div>

        {/* KPI: Giao dịch cần đối khớp */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 flex-shrink-0">
            <ArrowRightLeft className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Cần đối soát</div>
            <div className="text-2xl font-black text-rose-500 mt-0.5">{unmatchedTxCount}</div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1 bg-white p-1.5 rounded-2xl border max-w-md">
        <button
          onClick={() => {
            setActiveTab("sepay");
            setSearchQuery("");
            setStatusFilter("ALL");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "sepay"
              ? "bg-[#0d153a] text-white shadow-sm"
              : "text-slate-500 hover:text-[#0d153a] hover:bg-slate-50"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Giao dịch Sepay</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("invoices");
            setSearchQuery("");
            setStatusFilter("ALL");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "invoices"
              ? "bg-[#0d153a] text-white shadow-sm"
              : "text-slate-500 hover:text-[#0d153a] hover:bg-slate-50"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Hóa đơn</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("packages");
            setSearchQuery("");
            setStatusFilter("ALL");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "packages"
              ? "bg-[#0d153a] text-white shadow-sm"
              : "text-slate-500 hover:text-[#0d153a] hover:bg-slate-50"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Gói cước học tập</span>
        </button>
      </div>

      {/* TABLE/GRID CONTENT AREA */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        
        {/* Action Header Panel */}
        <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-50/50">
          <h2 className="text-base font-black text-[#0d153a] flex items-center gap-2">
            <span>
              {activeTab === "sepay" && "Lịch sử giao dịch Sepay"}
              {activeTab === "invoices" && "Danh sách Hóa đơn & Đăng ký"}
              {activeTab === "packages" && "Gói cước học tập IELTS"}
            </span>
            {isLoading && <Loader2 className="w-4 h-4 text-[#3B5C37] animate-spin" />}
          </h2>

          {/* Tab specific controls */}
          <div className="flex flex-wrap items-center gap-3">
            {activeTab !== "packages" && (
              <>
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-60 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={activeTab === "sepay" ? "Tìm mã GD, nội dung, bank..." : "Tìm mã hóa đơn, email, học viên..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] focus:ring-1 focus:ring-[#3B5C37] transition-all text-slate-700 font-medium"
                  />
                </div>

                {/* Filter Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-600 font-bold"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  {activeTab === "sepay" ? (
                    <>
                      <option value="MATCHED">Khớp thành công</option>
                      <option value="UNMATCHED">Chưa khớp (Duyệt tay)</option>
                      <option value="PENDING">Chờ xử lý</option>
                    </>
                  ) : (
                    <>
                      <option value="PENDING">Chờ thanh toán</option>
                      <option value="PAID">Đã thanh toán</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </>
                  )}
                </select>
              </>
            )}

            {/* Refresh button */}
            <button
              onClick={() => {
                fetchData();
                showToast("Đã tải lại dữ liệu mới nhất.");
              }}
              className="p-2 text-slate-500 hover:text-[#3B5C37] hover:bg-slate-100 rounded-xl transition-all"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Action Buttons */}
            {activeTab === "sepay" && (
              <button
                onClick={() => setShowSimulateModal(true)}
                className="bg-emerald-600 hover:bg-[#2f4a2b]merald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Giả lập GD Sepay</span>
              </button>
            )}

            {activeTab === "invoices" && (
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="bg-[#3B5C37] hover:bg-[#2f4a2b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo Hóa đơn tay</span>
              </button>
            )}

            {activeTab === "packages" && (
              <button
                onClick={openAddPkgModal}
                className="bg-[#3B5C37] hover:bg-[#2f4a2b] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm gói mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content: Sepay Transactions */}
        {activeTab === "sepay" && (
          <div className="overflow-x-auto">
            {getFilteredTransactions().length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <AlertCircle className="w-10 h-10 text-slate-300" />
                <p className="text-xs font-bold">Không tìm thấy giao dịch nào phù hợp.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Mã GD Hệ thống</th>
                    <th className="px-6 py-4">Ngày GD</th>
                    <th className="px-6 py-4">Số tiền chuyển</th>
                    <th className="px-6 py-4">Nội dung chuyển khoản</th>
                    <th className="px-6 py-4">Người gửi & Ngân hàng</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Đối soát</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                  {getFilteredTransactions().map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-500 whitespace-nowrap">
                        {tx.id}
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          <span>
                            {new Date(tx.transactionDate).toLocaleString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-[#0d153a] whitespace-nowrap">
                        {tx.amount.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 max-w-xs truncate" title={tx.transferContent}>
                        {tx.transferContent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-bold text-slate-700">{tx.senderAccount}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{tx.senderBank} - {tx.bankTransactionId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {tx.status === "MATCHED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <Check className="w-3 h-3" />
                            <span>Đã khớp</span>
                          </span>
                        )}
                        {tx.status === "UNMATCHED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 border border-rose-200 text-rose-700">
                            <AlertCircle className="w-3 h-3 animate-pulse" />
                            <span>Chưa khớp</span>
                          </span>
                        )}
                        {tx.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 border border-amber-200 text-amber-700">
                            <span>Chờ xử lý</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {tx.status === "MATCHED" ? (
                          <span className="text-[11px] text-emerald-600 font-bold block">
                            Hóa đơn: {tx.matchedInvoiceId}
                          </span>
                        ) : (
                          <button
                            onClick={() => openMatchModal(tx)}
                            disabled={actionLoading}
                            className="bg-[#0d153a] hover:bg-[#2f4a2b] hover:text-white border border-[#0d153a]/25 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5 ml-auto"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Duyệt tay</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab Content: Invoices */}
        {activeTab === "invoices" && (
          <div className="overflow-x-auto">
            {getFilteredInvoices().length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <AlertCircle className="w-10 h-10 text-slate-300" />
                <p className="text-xs font-bold">Không tìm thấy hóa đơn nào phù hợp.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Mã Hóa Đơn</th>
                    <th className="px-6 py-4">Học Viên Đăng Ký</th>
                    <th className="px-6 py-4">Gói Cước Mua</th>
                    <th className="px-6 py-4">Số Tiền Hóa Đơn</th>
                    <th className="px-6 py-4">Thời Gian Tạo</th>
                    <th className="px-6 py-4 text-center">Trạng Thái</th>
                    <th className="px-6 py-4 text-right">Duyệt Đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                  {getFilteredInvoices().map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {inv.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-extrabold text-[#0d153a]">{inv.userName}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{inv.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-600">
                        {inv.packageName}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-[#0d153a] whitespace-nowrap">
                        {inv.amount.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          <span>
                            {new Date(inv.createdAt).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {inv.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span>Đã thu tiền ({inv.paymentMethod})</span>
                          </span>
                        ) : inv.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-600">
                            <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                            <span>Đang chờ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-100 text-slate-500">
                            <span>Đã hủy</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {inv.status === "PENDING" ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveInvoiceDirectly(inv)}
                              disabled={actionLoading}
                              className="bg-emerald-600 hover:bg-[#2f4a2b]merald-700 text-white p-1.5 rounded-lg transition-all"
                              title="Duyệt thanh toán"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCancelInvoice(inv)}
                              disabled={actionLoading}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 p-1.5 rounded-lg transition-all"
                              title="Hủy hóa đơn"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : inv.status === "PAID" && inv.paidAt ? (
                          <span className="text-[10px] text-slate-400 font-bold block">
                            {new Date(inv.paidAt).toLocaleDateString("vi-VN")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold block">Hủy bỏ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab Content: Packages */}
        {activeTab === "packages" && (
          <div className="p-6">
            {packages.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <AlertCircle className="w-10 h-10 text-slate-300" />
                <p className="text-xs font-bold">Không tìm thấy gói học tập nào.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-md relative ${
                      !pkg.isActive ? "border-slate-200 opacity-60" : "border-slate-200/80"
                    }`}
                  >
                    {!pkg.isActive && (
                      <span className="absolute top-3 right-3 bg-slate-100 border border-slate-300 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Đang tắt
                      </span>
                    )}
                    
                    {/* Package Head */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="text-base font-extrabold text-[#0d153a]">{pkg.name}</h3>
                      <div className="mt-3 flex items-baseline">
                        <span className="text-2xl font-black text-[#3B5C37]">
                          {pkg.price.toLocaleString("vi-VN")} đ
                        </span>
                        <span className="text-slate-400 text-xs font-bold ml-1.5">
                          / {pkg.durationMonths} Tháng
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed mt-2.5 font-semibold">
                        {pkg.description}
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="p-6 flex-1 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tính năng đi kèm:</div>
                      <ul className="space-y-2">
                        {pkg.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600 font-semibold leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions Panel */}
                    <div className="p-6 pt-0 flex gap-2 border-t border-slate-50 bg-slate-50/20 mt-4">
                      {/* Active/Inactive Toggle Button */}
                      <button
                        onClick={() => handleTogglePkgActive(pkg)}
                        className={`flex-1 py-2 text-center rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          pkg.isActive 
                            ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100" 
                            : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-[#2f4a2b]merald-100"
                        }`}
                      >
                        {pkg.isActive ? "Tắt kích hoạt" : "Kích hoạt"}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => openEditPkgModal(pkg)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors"
                        title="Sửa gói cước"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeletePackage(pkg)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-colors"
                        title="Xóa gói cước"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* MODAL 1: ADD/EDIT PACKAGE */}
      {showPkgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-[#0d153a] text-base">
                {pkgModalMode === "add" ? "Thêm gói cước học tập mới" : "Chỉnh sửa gói cước"}
              </h3>
              <button
                onClick={() => setShowPkgModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSavePackage} className="p-6 space-y-4">
              {/* Package Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Tên gói cước</label>
                <input
                  type="text"
                  required
                  placeholder="IELTS VIP 3 Tháng..."
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Giá tiền (VNĐ)</label>
                  <input
                    type="number"
                    required
                    placeholder="299000"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Thời gian (Tháng)</label>
                  <select
                    value={pkgDuration}
                    onChange={(e) => setPkgDuration(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700 bg-white font-semibold"
                  >
                    <option value="1">1 Tháng</option>
                    <option value="3">3 Tháng</option>
                    <option value="6">6 Tháng</option>
                    <option value="12">12 Tháng</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Mô tả tóm tắt</label>
                <textarea
                  placeholder="Nhập mô tả ngắn gọn về đối tượng mục tiêu..."
                  value={pkgDescription}
                  onChange={(e) => setPkgDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700 resize-none"
                />
              </div>

              {/* Features Builder */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Xây dựng tính năng đi kèm ({pkgFeatures.length})
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập tính năng (VD: AI chấm chữa)..."
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="bg-[#0d153a] hover:bg-[#2f4a2b] text-white px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    Thêm
                  </button>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl max-h-32 overflow-y-auto space-y-1.5 border border-slate-100">
                  {pkgFeatures.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic font-bold">Chưa tạo tính năng nào.</span>
                  ) : (
                    pkgFeatures.map((feat, index) => (
                      <div key={index} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 text-[11px] text-slate-600 font-semibold">
                        <span className="truncate max-w-[280px]">{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="text-rose-500 hover:text-rose-700 p-0.5 rounded-md hover:bg-slate-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pkg_active"
                  checked={pkgIsActive}
                  onChange={(e) => setPkgIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#3B5C37] border-slate-300 rounded focus:ring-[#3B5C37]"
                />
                <label htmlFor="pkg_active" className="text-xs font-bold text-slate-600 cursor-pointer">
                  Mở bán gói cước này ngay (Kích hoạt)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPkgModal(false)}
                  className="flex-1 py-2.5 text-center border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-[#3B5C37] hover:bg-[#2f4a2b] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Lưu gói cước</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE INVOICE MANUALLY */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-[#0d153a] text-base">Tạo hóa đơn đăng ký thủ công</h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              {/* User Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Email Học viên</label>
                <input
                  type="email"
                  required
                  placeholder="student@gmail.com..."
                  value={invUserEmail}
                  onChange={(e) => setInvUserEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                />
              </div>

              {/* User Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A..."
                  value={invUserName}
                  onChange={(e) => setInvUserName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                />
              </div>

              {/* Package Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Chọn gói cước mua</label>
                <select
                  required
                  value={invPkgId}
                  onChange={(e) => handlePkgChangeForInvoice(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700 bg-white font-semibold"
                >
                  <option value="">-- Chọn Gói --</option>
                  {packages.filter(p => p.isActive).map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.price.toLocaleString("vi-VN")} đ)
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Số tiền thanh toán (VNĐ)</label>
                <input
                  type="number"
                  required
                  placeholder="299000"
                  value={invAmount}
                  onChange={(e) => setInvAmount(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700 font-extrabold"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="flex-1 py-2.5 text-center border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-[#3B5C37] hover:bg-[#2f4a2b] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Tạo hóa đơn</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: WEBHOOK SIMULATOR */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-[#0d153a] text-base flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600" />
                <span>Giả lập giao dịch cổng Sepay Webhook</span>
              </h3>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateWebhook} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[11px] leading-relaxed font-semibold">
                🔔 Mô phỏng gửi dữ liệu từ ngân hàng về hệ thống cổng thanh toán Sepay. Hãy thử viết nội dung chuyển khoản có chứa mã hóa đơn (VD: <span className="font-mono bg-emerald-100 px-1 rounded text-emerald-800">INV-2849D2</span>) để xem hệ thống **Tự động đối khớp** & nâng cấp tài khoản STUDENT ngay lập tức!
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Số tiền chuyển khoản</label>
                <input
                  type="number"
                  required
                  placeholder="599000"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700 font-extrabold"
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nội dung chuyển khoản (Lưu ý mã INV-XXXXXX)</label>
                <input
                  type="text"
                  required
                  placeholder="Thanh toan khoa hoc IELTS code INV-2849D2..."
                  value={simContent}
                  onChange={(e) => setSimContent(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700 font-bold"
                />
              </div>

              {/* Sender Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Số tài khoản gửi</label>
                  <input
                    type="text"
                    value={simSenderAcc}
                    onChange={(e) => setSimSenderAcc(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Ngân hàng gửi</label>
                  <input
                    type="text"
                    value={simSenderBank}
                    onChange={(e) => setSimSenderBank(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="flex-1 py-2.5 text-center border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-[#2f4a2b]merald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Gửi giao dịch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: MANUAL MATCHING DIALOG */}
      {showMatchModal && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-[#0d153a] text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3B5C37]" />
                <span>Đối soát & Duyệt giao dịch thủ công</span>
              </h3>
              <button
                onClick={() => {
                  setShowMatchModal(false);
                  setSelectedTx(null);
                }}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMatchManual} className="p-6 space-y-4">
              <div className="bg-[#e8ede6]/50 p-4 border border-orange-100 rounded-xl space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Thông tin giao dịch Sepay:</div>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-600 font-semibold">
                  <div>Mã GD Sepay:</div>
                  <div className="font-mono text-slate-800">{selectedTx.id}</div>
                  <div>Số tiền chuyển:</div>
                  <div className="font-extrabold text-[#0d153a]">{selectedTx.amount.toLocaleString("vi-VN")} đ</div>
                  <div>Nội dung CK:</div>
                  <div className="italic text-slate-800 font-bold">"{selectedTx.transferContent}"</div>
                  <div>Người gửi:</div>
                  <div className="text-slate-700">{selectedTx.senderAccount} ({selectedTx.senderBank})</div>
                </div>
              </div>

              {/* Pending Invoices Dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Liên kết với Hóa đơn đang chờ (PENDING)
                </label>
                <select
                  required
                  value={matchInvoiceId}
                  onChange={(e) => setMatchInvoiceId(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B5C37] text-slate-700 bg-white font-extrabold"
                >
                  <option value="">-- Chọn Hóa Đơn Khớp --</option>
                  {invoices
                    .filter(i => i.status === "PENDING")
                    .map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.id} - {inv.userName} ({inv.userEmail}) - {inv.packageName} ({inv.amount.toLocaleString("vi-VN")} đ)
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-1">
                  💡 Sau khi liên kết, Hóa đơn được duyệt thành `PAID`, giao dịch đổi thành `MATCHED`. Hệ thống tự động nâng cấp vai trò của Học viên có email này lên **STUDENT** trong Supabase Auth và lưu nhật ký.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowMatchModal(false);
                    setSelectedTx(null);
                  }}
                  className="flex-1 py-2.5 text-center border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !matchInvoiceId}
                  className="flex-1 py-2.5 bg-[#0d153a] hover:bg-[#2f4a2b] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40 disabled:hover:bg-[#0d153a] cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Phê duyệt khớp</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
