import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import ForestScene from "@/components/ForestScene";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
import { ArrowRight, Moon, Star, Mail, Lock, User, Sparkles } from "lucide-react";

const inputClass =
  "w-full pl-11 pr-4 py-3 rounded-2xl border border-white/40 bg-white/15 backdrop-blur-md text-white placeholder:text-white/60 text-base font-medium focus:outline-none focus:border-amber-200 focus:bg-white/25 transition-all shadow-inner";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = () => {
    setError("");
    if (!email.trim() || !email.includes("@")) return setError("Enter a valid email");
    // Mock OTP sending
    setStep("otp");
  };

  const handleVerifyOtp = () => {
    setError("");
    if (otp.length < 4) return setError("Enter a valid OTP");
    // Mock OTP verification
    setStep("password");
  };

  const handleSignup = () => {
    setError("");
    if (password.length < 6) return setError("Password must be 6+ characters");
    if (password !== confirm) return setError("Passwords do not match");
    // Continue to child profile setup (existing /login wizard)
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      <ForestScene />

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
              <Sparkles className="w-7 h-7 text-amber-900" fill="currentColor" />
            </motion.div>
          </div>

          <div className="text-center mb-5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              Create Account
            </h1>
            <p className="text-white/80 text-sm mt-1 italic">
              Begin your magical journey
            </p>
          </div>

          {/* Form Content */}
          <div className="space-y-3">
            {step === "email" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className={inputClass}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <Sparkles className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className={inputClass}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                />
              </motion.div>
            )}

            {step === "password" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-3"
              >
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={inputClass}
                  />
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm password"
                    className={inputClass}
                    onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                  />
                </div>
              </motion.div>
            )}
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

          {step === "email" && (
            <motion.button
              onClick={handleSendOtp}
              className="mt-5 w-full px-6 py-3.5 rounded-2xl font-display text-base sm:text-lg flex items-center justify-center gap-2 text-amber-950 border border-white/50"
              style={{
                background:
                  "linear-gradient(135deg, #FFE0A3 0%, #FFB870 50%, #E89A4A 100%)",
                boxShadow:
                  "0 10px 30px -5px rgba(255,180,90,0.6), inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Send OTP <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}

          {step === "otp" && (
            <motion.button
              onClick={handleVerifyOtp}
              className="mt-5 w-full px-6 py-3.5 rounded-2xl font-display text-base sm:text-lg flex items-center justify-center gap-2 text-amber-950 border border-white/50"
              style={{
                background:
                  "linear-gradient(135deg, #FFE0A3 0%, #FFB870 50%, #E89A4A 100%)",
                boxShadow:
                  "0 10px 30px -5px rgba(255,180,90,0.6), inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Verify OTP <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}

          {step === "password" && (
            <motion.button
              onClick={handleSignup}
              className="mt-5 w-full px-6 py-3.5 rounded-2xl font-display text-base sm:text-lg flex items-center justify-center gap-2 text-amber-950 border border-white/50"
              style={{
                background:
                  "linear-gradient(135deg, #FFE0A3 0%, #FFB870 50%, #E89A4A 100%)",
                boxShadow:
                  "0 10px 30px -5px rgba(255,180,90,0.6), inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Create Account <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}

          <p className="text-center text-white/85 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/signin" className="text-amber-200 font-bold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUpPage;
