import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import { adminApi } from "@/lib/adminApi";
import { useAuth } from "@/context/AuthContext";

export default function AnalyticsAdmin() {
  const { token } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats(token),
    enabled: !!token,
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

        {isLoading ? (
          <div className="py-20 bg-white border border-slate-100 rounded-2xl">
            <AdminLoadingState
              message="Fetching analytics data from database..."
              subMessage="Aggregating user cohorts, revenue breakdowns, and active metrics."
              minHeight="260px"
            />
          </div>
        ) : (
          /* Charts Grid */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            {/* Monthly Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", gridColumn: "1 / -1" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <TrendingUp size={16} color="#6366f1" />
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Monthly Revenue Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={stats?.revenueTrend || []}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* User Growth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Users size={16} color="#8b5cf6" />
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>User Growth</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="users" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
