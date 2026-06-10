import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Loader2, Sparkles, Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi, ADMIN_EMAIL } from "@/lib/adminApi";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@storynest.com");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth, user } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all fields");
    if (email !== ADMIN_EMAIL) return toast.error("Not an admin account");

    setLoading(true);
    try {
      const data = await adminApi.login(email, password);
      setAuth(data.user as never, data.token);
      toast.success("Welcome, Admin! 🎉");
      navigate("/admin/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter','Nunito',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');`}</style>

      {/* Background Orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", top: "-10%", left: "-10%" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)", bottom: "10%", right: "5%" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ width: "100%", maxWidth: 420, position: "relative" }}
      >
        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", padding: "44px 40px", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
              style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}
            >
              <Sparkles size={28} color="white" />
            </motion.div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "white", margin: "0 0 6px" }}>StoryNest Admin</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>Sign in to your admin dashboard</p>
          </div>

          {/* Admin badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", marginBottom: 28 }}>
            <Shield size={14} color="#818cf8" />
            <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 700 }}>Admin Access Required</span>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 8, display: "block" }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@storynest.com"
                  style={{
                    width: "100%", padding: "12px 14px 12px 40px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)", color: "white", fontSize: 14, outline: "none",
                    boxSizing: "border-box", fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 8, display: "block" }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  style={{
                    width: "100%", padding: "12px 44px 12px 40px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)", color: "white", fontSize: 14, outline: "none",
                    boxSizing: "border-box", fontFamily: "inherit",
                  }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", fontWeight: 700, fontSize: 15,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, opacity: loading ? 0.8 : 1,
                fontFamily: "inherit",
              }}
            >
              {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign In to Admin"}
            </motion.button>
          </form>

          {/* Hint */}
          <div style={{ marginTop: 24, padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: "rgba(255,255,255,0.5)" }}>Default Admin Credentials</div>
              Email: admin@storynest.com<br />
              Password: Admin@123
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
