import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, CreditCard, BookOpen, GraduationCap, DollarSign, TrendingUp, Activity, UserCheck,
  ArrowUpRight, ArrowDownRight, Zap,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { adminApi, AdminStats } from "@/lib/adminApi";

const StatCard = ({
  label, value, sub, icon: Icon, color, trend, trendUp,
}: {
  label: string; value: string | number; sub?: string; icon: React.ElementType;
  color: string; trend?: string; trendUp?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, boxShadow: "0 12px 30px rgba(0,0,0,0.06)" }}
    style={{
      background: "hsl(var(--card))",
      borderRadius: "1.25rem",
      padding: "20px 24px",
      border: "1px solid hsl(var(--border))",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={20} color="white" />
      </div>
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: trendUp ? "#10b981" : "#ef4444" }}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.1, fontFamily: "'Baloo 2', cursive" }}>{value}</div>
      <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", opacity: 0.8, marginTop: 2 }}>{sub}</div>}
    </div>
  </motion.div>
);

const formatCurrency = (v: number) => `₹${v.toLocaleString("en-IN")}`;

const activityIcons: Record<string, { emoji: string; bg: string }> = {
  new_user: { emoji: "👤", bg: "rgba(186, 230, 253, 0.4)" },
  payment: { emoji: "💳", bg: "rgba(187, 247, 208, 0.4)" },
  subscription: { emoji: "⭐", bg: "rgba(254, 240, 138, 0.4)" },
};

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats(token),
    staleTime: 60000,
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "hsl(var(--foreground))", margin: 0 }}>Dashboard Overview</h1>
          <p style={{ color: "hsl(var(--muted-foreground))", marginTop: 4, fontSize: 14 }}>
            Welcome back! Here's what's happening with StoryNest today.
          </p>
        </motion.div>

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: 130, background: "rgba(0,0,0,0.05)", borderRadius: 16, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden" animate="show"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}
            >
              <motion.div variants={cardVariants}>
                <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="linear-gradient(135deg, hsl(200, 90%, 60%), hsl(200, 90%, 75%))" trend="+12%" trendUp />
              </motion.div>
              <motion.div variants={cardVariants}>
                <StatCard label="Premium Users" value={stats?.premiumUsers ?? 0} sub="Active subscriptions" icon={UserCheck} color="linear-gradient(135deg, hsl(45, 100%, 50%), hsl(45, 100%, 70%))" trend="+8%" trendUp />
              </motion.div>
              <motion.div variants={cardVariants}>
                <StatCard label="Active Subscriptions" value={stats?.activeSubscriptions ?? 0} icon={CreditCard} color="linear-gradient(135deg, hsl(270, 80%, 70%), hsl(270, 80%, 85%))" trend="+5%" trendUp />
              </motion.div>
              <motion.div variants={cardVariants}>
                <StatCard label="Stories" value={stats?.totalStories ?? 0} icon={BookOpen} color="linear-gradient(135deg, hsl(330, 85%, 65%), hsl(330, 85%, 80%))" />
              </motion.div>
              <motion.div variants={cardVariants}>
                <StatCard label="Lessons" value={stats?.totalLessons ?? 0} icon={GraduationCap} color="linear-gradient(135deg, hsl(160, 70%, 55%), hsl(160, 70%, 75%))" />
              </motion.div>
              <motion.div variants={cardVariants}>
                <StatCard label="Total Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={DollarSign} color="linear-gradient(135deg, hsl(45, 100%, 50%), hsl(15, 90%, 65%))" trend="+24%" trendUp />
              </motion.div>
              <motion.div variants={cardVariants}>
                <StatCard label="Monthly Revenue" value={formatCurrency(stats?.monthlyRevenue ?? 0)} sub="Last 30 days" icon={TrendingUp} color="linear-gradient(135deg, hsl(260, 85%, 60%), hsl(270, 80%, 75%))" trend="+18%" trendUp />
              </motion.div>
              <motion.div variants={cardVariants}>
                <StatCard label="Payments Today" value={stats?.paymentsToday ?? 0} icon={Zap} color="linear-gradient(135deg, hsl(15, 90%, 65%), hsl(330, 85%, 65%))" />
              </motion.div>
            </motion.div>

            {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
              {/* Revenue Trend */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ background: "hsl(var(--card))", borderRadius: 20, padding: 24, border: "1px solid hsl(var(--border))" }}
              >
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "hsl(var(--foreground))" }}>Revenue Trend</h3>
                  <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", margin: "4px 0 0" }}>Last 7 days</p>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats?.revenueTrend}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(260, 85%, 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(260, 85%, 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                    <Tooltip formatter={(v: number) => [`₹${v}`, "Revenue"]} contentStyle={{ borderRadius: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(260, 85%, 60%)" strokeWidth={2.5} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* User Growth */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ background: "hsl(var(--card))", borderRadius: 20, padding: 24, border: "1px solid hsl(var(--border))" }}
              >
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "hsl(var(--foreground))" }}>User Growth</h3>
                  <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", margin: "4px 0 0" }}>New signups per day</p>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats?.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", fontSize: 12 }} />
                    <Bar dataKey="users" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(270, 80%, 70%)" />
                        <stop offset="100%" stopColor="hsl(260, 85%, 60%)" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: "hsl(var(--card))", borderRadius: 20, padding: 24, border: "1px solid hsl(var(--border))" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Activity size={18} color="hsl(var(--primary))" />
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "hsl(var(--foreground))" }}>Recent Activity</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(stats?.activity ?? []).map((item, i) => {
                  const meta = activityIcons[item.type] || { emoji: "📌", bg: "rgba(0,0,0,0.05)" };
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "rgba(0,0,0,0.01)" }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {meta.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))" }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{item.detail}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", opacity: 0.8 }}>{timeAgo(item.at)}</div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
