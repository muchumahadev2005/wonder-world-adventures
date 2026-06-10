import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { useAuth } from "@/context/AuthContext";

const MOCK_MONTHLY = [
  { month: "Jan", revenue: 12450, users: 45, subs: 18 },
  { month: "Feb", revenue: 18900, users: 62, subs: 24 },
  { month: "Mar", revenue: 15200, users: 53, subs: 20 },
  { month: "Apr", revenue: 23400, users: 78, subs: 31 },
  { month: "May", revenue: 29100, users: 94, subs: 38 },
  { month: "Jun", revenue: 34500, users: 112, subs: 45 },
];

export default function AnalyticsAdmin() {
  const { token } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats(token),
    staleTime: 60000,
  });

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1300 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <BarChart3 size={24} color="#6366f1" /> Analytics
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Platform performance overview</p>
        </motion.div>

        {/* Charts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Monthly Revenue */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <TrendingUp size={16} color="#6366f1" />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Monthly Revenue Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={MOCK_MONTHLY}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* User Growth */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Users size={16} color="#8b5cf6" />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>User Growth</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MOCK_MONTHLY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="users" radius={[6, 6, 0, 0]}>
                  {MOCK_MONTHLY.map((_, i) => (
                    <rect key={i} fill={`hsl(${260 + i * 10},70%,${60 + i * 3}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Subscription Growth */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <DollarSign size={16} color="#10b981" />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Subscription Growth</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MOCK_MONTHLY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="subs" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", strokeWidth: 0, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* KPI Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { label: "Conversion Rate", value: "25.4%", sub: "Free → Premium", color: "#6366f1", bg: "#ede9fe" },
            { label: "Avg. Revenue/User", value: "₹126", sub: "Per paying user", color: "#10b981", bg: "#d1fae5" },
            { label: "Churn Rate", value: "3.2%", sub: "Monthly churn", color: "#ef4444", bg: "#fee2e2" },
            { label: "LTV", value: "₹1,490", sub: "Lifetime value", color: "#f59e0b", bg: "#fef3c7" },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{kpi.sub}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
