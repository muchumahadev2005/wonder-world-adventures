import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Search, Crown, TrendingUp, Users, DollarSign,
  CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, X,
  Calendar, User, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi, AdminSubscription } from "@/lib/adminApi";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUS_CONFIG = {
  ACTIVE: { label: "Active", bg: "#d1fae5", text: "#059669", icon: CheckCircle },
  EXPIRED: { label: "Expired", bg: "#f1f5f9", text: "#64748b", icon: Clock },
  CANCELLED: { label: "Cancelled", bg: "#fee2e2", text: "#dc2626", icon: XCircle },
  PENDING: { label: "Pending", bg: "#fef3c7", text: "#d97706", icon: AlertTriangle },
};

const PIE_COLORS = ["#10b981", "#94a3b8", "#ef4444", "#f59e0b"];

const DetailModal = ({ sub, onClose, onAction }: {
  sub: AdminSubscription;
  onClose: () => void;
  onAction: (id: string, status: string) => void;
}) => {
  const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.PENDING;
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
          style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 560, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.2)" }}
        >
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,#1e293b,#334155)", padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 4 }}>Subscription Details</div>
              <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>{sub.user.name}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{sub.user.email}</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Plan + Status */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Plan</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  <Crown size={15} color="#d97706" /> {sub.plan.name}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>₹{sub.plan.price}/period</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Status</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusIcon size={15} color={cfg.text} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: cfg.text }}>{cfg.label}</span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={10} /> Start Date
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{new Date(sub.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={10} /> End Date
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{new Date(sub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
            </div>

            {/* Payment Info */}
            {sub.payments.length > 0 && (
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>Payment History</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sub.payments.map(p => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>
                          {p.razorpayPaymentId || p.razorpayOrderId}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.razorpayOrderId}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>₹{p.amount}</div>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: p.status === "SUCCESS" ? "#d1fae5" : "#fee2e2", color: p.status === "SUCCESS" ? "#059669" : "#dc2626", fontWeight: 700 }}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {sub.status !== "ACTIVE" && (
                <Button style={{ background: "#d1fae5", color: "#059669", border: "none", gap: 6 }} onClick={() => onAction(sub.id, "ACTIVE")}>
                  <CheckCircle size={14} /> Activate
                </Button>
              )}
              {sub.status === "ACTIVE" && (
                <Button style={{ background: "#fee2e2", color: "#dc2626", border: "none", gap: 6 }} onClick={() => onAction(sub.id, "CANCELLED")}>
                  <XCircle size={14} /> Cancel
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function SubscriptionsAdmin() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminSubscription | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", filterStatus],
    queryFn: () => adminApi.getSubscriptions(token, { status: filterStatus === "all" ? "" : filterStatus }),
    staleTime: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateSubscriptionStatus(id, status, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Subscription updated!");
      setSelected(null);
    },
    onError: () => toast.error("Update failed — using mock data"),
  });

  const subs = data?.subscriptions || [];
  const total = data?.total || 0;

  const filtered = subs.filter(s =>
    s.user.name.toLowerCase().includes(search.toLowerCase()) ||
    s.user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Analytics
  const statusCounts = {
    ACTIVE: subs.filter(s => s.status === "ACTIVE").length,
    EXPIRED: subs.filter(s => s.status === "EXPIRED").length,
    CANCELLED: subs.filter(s => s.status === "CANCELLED").length,
    PENDING: subs.filter(s => s.status === "PENDING").length,
  };
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const totalRevenue = subs.filter(s => s.status === "ACTIVE").reduce((acc, s) => acc + s.plan.price, 0);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1300 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <CreditCard size={24} color="#6366f1" /> Subscriptions Management
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{total} total subscriptions</p>
        </motion.div>

        {/* Analytics Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr) 280px", gap: 16, marginBottom: 28 }}
        >
          {[
            { label: "Active", value: statusCounts.ACTIVE, color: "#10b981", bg: "#d1fae5", icon: CheckCircle },
            { label: "Expired", value: statusCounts.EXPIRED, color: "#64748b", bg: "#f1f5f9", icon: Clock },
            { label: "Cancelled", value: statusCounts.CANCELLED, color: "#ef4444", bg: "#fee2e2", icon: XCircle },
            { label: "MRR", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "#6366f1", bg: "#ede9fe", icon: DollarSign },
          ].map(card => (
            <motion.div key={card.label} whileHover={{ y: -2 }} style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <card.icon size={18} color={card.color} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, color: "#0f172a" }}>{card.value}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{card.label}</div>
              </div>
            </motion.div>
          ))}

          {/* Pie Chart */}
          <div style={{ background: "white", borderRadius: 14, padding: "12px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
            <PieChart width={80} height={80}>
              <Pie data={pieData} cx={35} cy={35} innerRadius={22} outerRadius={37} dataKey="value" strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
            </PieChart>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {pieData.map((d, i) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }} />
                  <span style={{ color: "#64748b" }}>{d.name}</span>
                  <span style={{ fontWeight: 700, color: "#0f172a", marginLeft: "auto" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", flex: 1, minWidth: 200 }}>
            <Search size={14} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user name or email..." style={{ border: "none", outline: "none", fontSize: 14, width: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["all", "ACTIVE", "EXPIRED", "CANCELLED", "PENDING"] as const).map(s => {
              const cfg = s === "all" ? { bg: "#ede9fe", text: "#6d28d9" } : STATUS_CONFIG[s];
              return (
                <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, background: filterStatus === s ? cfg.bg : "white", color: filterStatus === s ? cfg.text : "#64748b", border: filterStatus === s ? `1.5px solid ${cfg.text}` : "1px solid #e2e8f0", transition: "all 0.2s" } as React.CSSProperties}>
                  {s === "all" ? "All" : STATUS_CONFIG[s].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["User", "Plan", "Amount", "Status", "Start Date", "End Date", "Payment ID", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} style={{ padding: "14px 16px" }}>
                      <div style={{ height: 18, background: "#f1f5f9", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
                    </td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No subscriptions found</td></tr>
                ) : filtered.map((sub, i) => {
                  const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      whileHover={{ background: "#fafafa" } as never}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{sub.user.name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{sub.user.email}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 600, fontSize: 13 }}>
                          <Crown size={13} color="#d97706" /> {sub.plan.name}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                        ₹{sub.plan.price}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 700 }}>
                          <StatusIcon size={10} /> {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                        {new Date(sub.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                        {new Date(sub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>
                          {sub.payments[0]?.razorpayPaymentId?.slice(0, 14) || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(sub)} style={{ fontSize: 12, gap: 4 }}>
                          Details <ChevronDown size={12} />
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

      {selected && (
        <DetailModal
          sub={selected}
          onClose={() => setSelected(null)}
          onAction={(id, status) => updateMutation.mutate({ id, status })}
        />
      )}
    </AdminLayout>
  );
}
