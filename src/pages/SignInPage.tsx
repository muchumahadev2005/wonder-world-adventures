import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import ForestScene from "@/components/ForestScene";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
import { Sparkles, ArrowRight, Moon, Star, Mail, Lock } from "lucide-react";

const inputClass =
  "w-full pl-11 pr-4 py-3 rounded-2xl border border-white/40 bg-white/15 backdrop-blur-md text-white placeholder:text-white/60 text-base font-medium focus:outline-none focus:border-amber-200 focus:bg-white/25 transition-all shadow-inner";

const SignInPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");
    if (!email.trim()) return setError("Please enter your email or username");
    if (password.length < 4) return setError("Password is too short");
    // Mock login → goes to profile setup which then enters home
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      <ForestScene />
      <AmbientSoundToggle />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] max-w-[90vw] h-[520px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,210,140,0.45)_0%,rgba(180,140,220,0.22)_45%,transparent_75%)] blur-3xl pointer-events-none z-0" />

      <motion.div
        className="relative z-10 w-full max-w-[480px] rounded-[28px] sm:rounded-[36px] border border-white/35 backdrop-blur-2xl px-5 sm:px-8 py-7 sm:py-9"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,235,200,0.12) 100%)",
          boxShadow:
            "0 25px 70px -15px rgba(255,180,80,0.4), 0 10px 50px -10px rgba(140,100,200,0.4), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden rounded-[28px] sm:rounded-[36px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <Star
              key={i}
              className="absolute text-white/60"
              style={{
                width: 6 + (i % 3) * 3,
                height: 6 + (i % 3) * 3,
                left: `${(i * 41) % 95}%`,
                top: `${(i * 27) % 95}%`,
              }}
              fill="currentColor"
            />
          ))}
        </div>

        <div className="relative">
          <div className="flex justify-center mb-3">
            <motion.div
              className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_0_25px_rgba(255,210,120,0.8)]"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Moon className="w-7 h-7 text-amber-900" fill="currentColor" />
            </motion.div>
          </div>

          <div className="text-center mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              Welcome Back
            </h1>
            <p className="text-white/80 text-sm mt-1 italic">
              Sign in to your magical world
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or username"
                className={inputClass}
              />
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={inputClass}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <button className="text-white/80 hover:text-amber-200 text-sm font-medium transition">
              Forgot Password?
            </button>
          </div>

          {error && (
            <motion.p
              className="text-amber-200 text-center mt-3 font-bold text-sm drop-shadow"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            onClick={handleLogin}
            className="mt-5 w-full px-6 py-3.5 rounded-2xl font-display text-base sm:text-lg flex items-center justify-center gap-2 text-amber-950 border border-white/50 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #FFE0A3 0%, #FFB870 50%, #E89A4A 100%)",
              boxShadow:
                "0 10px 30px -5px rgba(255,180,90,0.6), inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Login <ArrowRight className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/30" />
            <span className="text-white/70 text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/30" />
          </div>

          <motion.button
            onClick={handleLogin}
            className="w-full px-6 py-3 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 text-amber-950 bg-white/85 border border-white/60 hover:bg-white transition"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          <p className="text-center text-white/85 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-amber-200 font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignInPage;
