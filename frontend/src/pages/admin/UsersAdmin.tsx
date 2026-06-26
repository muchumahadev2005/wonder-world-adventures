import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, UserCheck, UserX, Crown, Shield, X,
  Mail, Calendar, Smartphone, Globe, Star, BookOpen, Gamepad2
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi, AdminUser } from "@/lib/adminApi";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: size * 0.36, flexShrink: 0 }}>
      {name[0]?.toUpperCase() || "U"}
    </div>
  );
};

const UserDrawer = ({ user, onClose }: { user: AdminUser; onClose: () => void }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }}
    />
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
      style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 420, background: "white", zIndex: 201, boxShadow: "-20px 0 60px rgba(0,0,0,0.15)", overflowY: "auto" }}
    >
      {/* Header */}
      <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar name={user.name} size={52} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
            <Mail size={12} /> {user.email}
          </div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Status badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {user.subscriptions.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: "#fef3c7", color: "#d97706", fontSize: 12, fontWeight: 700 }}>
              <Crown size={12} /> Premium Active
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: user.isVerified ? "#d1fae5" : "#fee2e2", color: user.isVerified ? "#059669" : "#dc2626", fontSize: 12, fontWeight: 700 }}>
            <Shield size={12} /> {user.isVerified ? "Verified" : "Unverified"}
          </span>
          {user.provider.map(p => (
            <span key={p} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: "#ede9fe", color: "#6d28d9", fontSize: 12, fontWeight: 700 }}>
              {p === "google" ? <Globe size={12} /> : <Mail size={12} />} {p}
            </span>
          ))}
        </div>

        {/* Profile Info */}
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Profile</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}><Calendar size={13} /> Joined</span>
              <span style={{ fontWeight: 600 }}>{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#64748b" }}>Auth Method</span>
              <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{user.provider.join(", ")}</span>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subscription</div>
          {user.subscriptions.length > 0 ? (
            user.subscriptions.map((sub, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{sub.plan.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Expires {new Date(sub.endDate).toLocaleDateString("en-IN")}</div>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 20, background: "#d1fae5", color: "#059669", fontSize: 12, fontWeight: 700 }}>Active</span>
              </div>
            ))
          ) : (
            <div style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "12px 0" }}>No active subscription</div>
          )}
        </div>



        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</div>
          <Button style={{ justifyContent: "flex-start", gap: 8, background: "#fef3c7", color: "#d97706", border: "none" }} onClick={() => toast.success(`Premium granted to ${user.name}`)}>
            <Crown size={15} /> Grant Premium
          </Button>
          <Button style={{ justifyContent: "flex-start", gap: 8, background: "#fee2e2", color: "#dc2626", border: "none" }} onClick={() => toast.info(`${user.name} suspended`)}>
            <UserX size={15} /> Suspend User
          </Button>
          <Button style={{ justifyContent: "flex-start", gap: 8, background: "#d1fae5", color: "#059669", border: "none" }} onClick={() => toast.success(`${user.name} activated`)}>
            <UserCheck size={15} /> Activate User
          </Button>
        </div>
      </div>
    </motion.div>
  </AnimatePresence>
);

export default function UsersAdmin() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [filterSub, setFilterSub] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: () => adminApi.getUsers(token, { page, search }),
    staleTime: 30000,
  });

  const users = data?.users || [];
  const total = data?.total || 0;

  const filtered = filterSub === "all" ? users : users.filter(u =>
    filterSub === "premium" ? u.subscriptions.length > 0 : u.subscriptions.length === 0
  );

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <Users size={24} color="#6366f1" /> Users Management
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{total} total users</p>
          </div>
        </motion.div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", flex: 1, minWidth: 200 }}>
            <Search size={14} color="#94a3b8" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email..." style={{ border: "none", outline: "none", fontSize: 14, width: "100%" }} />
          </div>
          <Select value={filterSub} onValueChange={setFilterSub}>
            <SelectTrigger style={{ width: 180, background: "white" }}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="premium">Premium Only</SelectItem>
              <SelectItem value="free">Free Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["User", "Email", "Sign-up", "Joined", "Subscription", "Status", ""].map(h => (
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
                ) : filtered.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                    onClick={() => setSelectedUser(user)}
                    whileHover={{ background: "#fafafa" } as never}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={user.name} />
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{user.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {user.provider.includes("google") ? <Globe size={13} color="#4285f4" /> : <Mail size={13} color="#6366f1" />}
                        <span style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>{user.provider[0]}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>
                      {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {user.subscriptions.length > 0 ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#fef3c7", color: "#d97706", fontWeight: 700, width: "fit-content" }}>
                          <Crown size={10} /> {user.subscriptions[0].plan.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#f1f5f9", color: "#64748b", fontWeight: 600 }}>Free</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: user.isVerified ? "#d1fae5" : "#fee2e2", color: user.isVerified ? "#059669" : "#dc2626", fontWeight: 700 }}>
                        {user.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Button variant="ghost" size="sm" style={{ fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}>
                        View →
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Showing {filtered.length} of {total} users</span>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={users.length < 20}>Next</Button>
            </div>
          </div>
        </motion.div>
      </div>

      {selectedUser && <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </AdminLayout>
  );
}
