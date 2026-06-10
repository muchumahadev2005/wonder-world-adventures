import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Search, Download, X, CheckCircle, XCircle, Clock,
  ExternalLink, Filter,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi, AdminPayment } from "@/lib/adminApi";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATUS_CFG = {
  SUCCESS: { label: "Success", bg: "#d1fae5", text: "#059669", icon: CheckCircle },
  FAILED: { label: "Failed", bg: "#fee2e2", text: "#dc2626", icon: XCircle },
  PENDING: { label: "Pending", bg: "#fef3c7", text: "#d97706", icon: Clock },
};

const METHOD_EMOJI: Record<string, string> = {
  card: "💳", upi: "📱", netbanking: "🏦", wallet: "👛",
};

const PaymentDetailModal = ({ payment, onClose }: { payment: AdminPayment; onClose: () => void }) => {
  const cfg = STATUS_CFG[payment.status as keyof typeof STATUS_CFG] || STATUS_CFG.PENDING;
  const StatusIcon = cfg.icon;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 480, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.2)" }}
        >
          {/* Top banner */}
          <div style={{ background: payment.status === "SUCCESS" ? "linear-gradient(135deg,#10b981,#059669)" : payment.status === "FAILED" ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#f59e0b,#d97706)", padding: "28px 28px 24px", color: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Payment</div>
                <div style={{ fontSize: 36, fontWeight: 900 }}>₹{payment.amount}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  <StatusIcon size={12} /> {cfg.label}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* User */}
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>Customer</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{payment.user.name}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{payment.user.email}</div>
            </div>

            {/* IDs */}
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>Payment IDs</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>RAZORPAY ORDER ID</div>
                  <div style={{ fontFamily: "monospace", fontSize: 13, color: "#0f172a", wordBreak: "break-all" }}>{payment.razorpayOrderId}</div>
                </div>
                {payment.razorpayPaymentId && (
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>RAZORPAY PAYMENT ID</div>
                    <div style={{ fontFamily: "monospace", fontSize: 13, color: "#0f172a", wordBreak: "break-all" }}>{payment.razorpayPaymentId}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>DATE & TIME</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                  {new Date(payment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {new Date(payment.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>PLAN</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{payment.subscription?.plan?.name || "—"}</div>
              </div>
            </div>

            <Button variant="outline" onClick={onClose} style={{ width: "100%" }}>Close</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const exportCSV = (payments: AdminPayment[]) => {
  const headers = ["ID", "User", "Email", "Amount", "Status", "Razorpay Order", "Razorpay Payment", "Date"];
  const rows = payments.map(p => [
    p.id, p.user.name, p.user.email, p.amount, p.status,
    p.razorpayOrderId, p.razorpayPaymentId || "", new Date(p.createdAt).toLocaleDateString("en-IN"),
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `payments_${Date.now()}.csv`;
  a.click();
  toast.success("CSV exported!");
};

export default function PaymentsAdmin() {
  const { token } = useAuth();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminPayment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", filterStatus],
    queryFn: () => adminApi.getPayments(token, { status: filterStatus === "all" ? "" : filterStatus }),
    staleTime: 30000,
  });

  const payments = data?.payments || [];
  const total = data?.total || 0;

  const filtered = payments.filter(p =>
    p.user.name.toLowerCase().includes(search.toLowerCase()) ||
    p.user.email.toLowerCase().includes(search.toLowerCase()) ||
    p.razorpayOrderId.toLowerCase().includes(search.toLowerCase())
  );

  const successTotal = payments.filter(p => p.status === "SUCCESS").reduce((a, p) => a + p.amount, 0);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <DollarSign size={24} color="#6366f1" /> Payments
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{total} total transactions</p>
          </div>
          <Button onClick={() => exportCSV(filtered)} style={{ gap: 6, background: "#0f172a", color: "white" }}>
            <Download size={15} /> Export CSV
          </Button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Collected", value: `₹${successTotal.toLocaleString("en-IN")}`, color: "#10b981", bg: "#d1fae5" },
            { label: "Successful", value: payments.filter(p => p.status === "SUCCESS").length, color: "#10b981", bg: "#d1fae5" },
            { label: "Pending", value: payments.filter(p => p.status === "PENDING").length, color: "#d97706", bg: "#fef3c7" },
            { label: "Failed", value: payments.filter(p => p.status === "FAILED").length, color: "#dc2626", bg: "#fee2e2" },
          ].map(card => (
            <motion.div key={card.label} whileHover={{ y: -2 }} style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{card.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", flex: 1, minWidth: 200 }}>
            <Search size={14} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user or order ID..." style={{ border: "none", outline: "none", fontSize: 14, width: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "SUCCESS", "PENDING", "FAILED"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700,
                background: filterStatus === s ? (s === "all" ? "#1e293b" : s === "SUCCESS" ? "#059669" : s === "PENDING" ? "#d97706" : "#dc2626") : "white",
                color: filterStatus === s ? "white" : "#64748b",
                border: filterStatus === s ? "none" : "1px solid #e2e8f0",
                transition: "all 0.2s",
              } as React.CSSProperties}>
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Payment ID", "User", "Amount", "Plan", "Status", "Date", ""].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: "14px 16px" }}>
                      <div style={{ height: 18, background: "#f1f5f9", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
                    </td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>No payments found</td></tr>
                ) : filtered.map((pay, i) => {
                  const cfg = STATUS_CFG[pay.status as keyof typeof STATUS_CFG] || STATUS_CFG.PENDING;
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.tr
                      key={pay.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      whileHover={{ background: "#fafafa" } as never}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#0f172a", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6, display: "inline-block" }}>
                          {pay.razorpayOrderId.slice(-12)}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{pay.user.name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{pay.user.email}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 800, fontSize: 15, color: "#0f172a" }}>₹{pay.amount}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{pay.subscription?.plan?.name || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 700 }}>
                          <StatusIcon size={10} /> {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                        {new Date(pay.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                        <div style={{ fontSize: 10, color: "#cbd5e1" }}>
                          {new Date(pay.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Button variant="ghost" size="sm" style={{ gap: 4, fontSize: 12 }} onClick={() => setSelected(pay)}>
                          <ExternalLink size={12} /> View
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {selected && <PaymentDetailModal payment={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}
