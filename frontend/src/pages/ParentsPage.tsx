import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import { useAuth } from "@/context/AuthContext";
import { contentApi } from "@/lib/api";
import NavBar from "@/components/NavBar";
import SceneBackground from "@/components/SceneBackground";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
import SubscribeModal from "@/components/SubscribeModal";
import { useNavigate } from "react-router-dom";
import parentsBg from "@/assets/parents-bg.jpg";
import {
  Crown,
  Star,
  Gamepad2,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Shield,
  Zap,
  Flame,
  Trophy,
  LogOut,
  Sparkles,
} from "lucide-react";

const ParentsPage = () => {
  const { profile, logout: clearProfile, setPremium } = useChild();
  const { logout, token } = useAuth();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState<Record<string, number> | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    contentApi
      .parentDashboard(token)
      .then(({ dashboard }) => {
        if (mounted) setDashboardStats(dashboard.stats || null);
      })
      .catch(() => {
        if (mounted) setDashboardStats(null);
      });
    return () => {
      mounted = false;
    };
  }, [token]);

  const handleLogout = () => {
    clearProfile();
    logout();
    navigate("/login");
  };

  const stats = [
    {
      icon: Star,
      label: "Total Stars",
      value: dashboardStats?.stars ?? profile?.stars ?? 0,
      color: "from-sunshine to-coral",
    },
    {
      icon: Zap,
      label: "Total XP",
      value: dashboardStats?.xp ?? profile?.xp ?? 0,
      color: "from-purple-400 to-pink-400",
    },
    {
      icon: Flame,
      label: "Day Streak",
      value: dashboardStats?.streak ?? profile?.streak ?? 0,
      color: "from-orange-400 to-red-400",
    },
    {
      icon: Trophy,
      label: "Level",
      value: dashboardStats?.level ?? profile?.level ?? 1,
      color: "from-amber-400 to-yellow-500",
    },
    {
      icon: Gamepad2,
      label: "Games Played",
      value: dashboardStats?.gamesCompleted ?? profile?.completedGames.length ?? 0,
      color: "from-sky to-lavender",
    },
    {
      icon: BookOpen,
      label: "Stories Read",
      value: dashboardStats?.storiesCompleted ?? profile?.completedStories.length ?? 0,
      color: "from-mint to-sky",
    },
    {
      icon: GraduationCap,
      label: "Lessons Done",
      value: dashboardStats?.lessonsCompleted ?? profile?.completedLessons.length ?? 0,
      color: "from-green-400 to-teal-400",
    },
    {
      icon: Crown,
      label: "Coins",
      value: dashboardStats?.coins ?? profile?.coins ?? 0,
      color: "from-bubblegum to-lavender",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SceneBackground image={parentsBg} alt="Cozy forest cottage interior with fireplace" variant="cottage" />
      <NavBar />

      <div className="page-shell max-w-5xl">
        <motion.div
          className="page-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="page-heading flex items-center justify-center gap-2 sm:gap-3">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" /> Parent Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Monitor your child's learning journey</p>
        </motion.div>

        {/* Child Info */}
        <motion.div
          className="relative p-6 mb-6 rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center text-2xl font-display font-bold text-primary-foreground">
              {profile?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-extrabold text-white drop-shadow-md">
                {profile?.name}
              </h2>
              <p className="text-white/80 font-bold drop-shadow-sm">
                Age Group: {profile?.ageGroup} • Fav Color: {profile?.favoriteColor} • Fav Character: {profile?.favoriteCharacter}
              </p>
              {/* XP level bar */}
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/70 text-xs">Level {profile?.level}</span>
                  <span className="text-white/50 text-xs">{profile?.xp} XP</span>
                </div>
                <div className="w-full max-w-xs h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                    animate={{ width: `${Math.min(100, (profile?.xp ?? 0) % 100)}%` }}
                    transition={{ type: "spring", stiffness: 80 }}
                  />
                </div>
              </div>
            </div>
            <div className="sm:ml-auto">
              {profile?.isPremium ? (
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-premium to-sunshine text-primary-foreground">
                  👑 Premium
                </span>
              ) : (
                <motion.button
                  onClick={() => setShowSubscribeModal(true)}
                  className="px-3 py-1 rounded-full text-sm font-bold bg-muted text-muted-foreground hover:bg-amber-400/20 hover:text-amber-300 border border-white/20 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Free Plan · Upgrade ↗
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Premium Upgrade Banner (free users only) ── */}
        {!profile?.isPremium && (
          <motion.div
            className="relative overflow-hidden mb-6 p-5 rounded-[28px] border border-amber-400/40 shadow-2xl cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(120,60,10,0.55) 0%, rgba(80,30,5,0.7) 100%)",
              boxShadow: "0 0 40px -10px rgba(245,158,11,0.4)",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setShowSubscribeModal(true)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Animated shimmer */}
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.6) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPositionX: ["200%", "-200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative flex items-center gap-4">
              {/* Icon */}
              <motion.div
                className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Crown className="w-7 h-7 text-amber-900" fill="currentColor" />
              </motion.div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-display text-base sm:text-lg font-extrabold text-amber-200 drop-shadow">
                  Unlock StoryNest Premium 👑
                </p>
                <p className="text-amber-300/70 text-xs sm:text-sm font-medium mt-0.5">
                  All stories, lessons &amp; games — unlimited access for your child
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["All Stories", "All Lessons", "All Games", "Priority Support"].map((f) => (
                    <span key={f} className="flex items-center gap-1 text-[11px] text-amber-200/80 bg-amber-400/15 border border-amber-400/20 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-2.5 h-2.5" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <motion.div
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-amber-900 font-display font-extrabold text-sm shadow-lg"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
              >
                Upgrade
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              className="relative p-4 text-center rounded-3xl border border-white/40 shadow-xl backdrop-blur-xl"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)" }}
              variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}
              whileHover={{ scale: 1.04, y: -3 }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <p className="font-display text-xl font-extrabold text-white drop-shadow-md">{stat.value}</p>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wide">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Activity */}
        <motion.div
          className="relative p-6 rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-2xl"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-display text-xl font-extrabold flex items-center gap-2 mb-4 text-white drop-shadow-md">
            <TrendingUp className="w-5 h-5 text-amber-300" /> Recent Activity
          </h3>
          {(profile?.completedGames.length || 0) + (profile?.completedStories.length || 0) + (profile?.completedLessons.length || 0) > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {profile?.completedLessons.map((l) => (
                <div key={l} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-xl border border-white/20 bg-white/10 text-white">
                  <GraduationCap className="w-5 h-5 text-green-400" />
                  <span className="font-body text-sm font-bold">Completed lesson: <b>{l}</b></span>
                  <span className="ml-auto text-xs text-muted-foreground">✅</span>
                </div>
              ))}
              {profile?.completedGames.map((g) => (
                <div key={g} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-xl border border-white/20 bg-white/10 text-white">
                  <Gamepad2 className="w-5 h-5 text-sky-light" />
                  <span className="font-body text-sm font-bold">Played game: <b>{g}</b></span>
                  <span className="ml-auto text-xs text-muted-foreground">✅</span>
                </div>
              ))}
              {profile?.completedStories.map((s) => (
                <div key={s} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-xl border border-white/20 bg-white/10 text-white">
                  <BookOpen className="w-5 h-5 text-mint-light" />
                  <span className="font-body text-sm font-bold">Read story: <b>{s}</b></span>
                  <span className="ml-auto text-xs text-muted-foreground">✅</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No activity yet. Encourage your child to play games and read stories! 🎮📖
            </p>
          )}
        </motion.div>

        {/* Logout Button */}
        <div className="flex justify-center mt-2 mb-2">
          <motion.button
            onClick={handleLogout}
            className="w-full max-w-[320px] flex justify-center items-center gap-3 px-8 py-4 rounded-[28px] bg-gradient-to-r from-red-500 to-rose-500 text-white font-display text-xl font-bold shadow-[0_15px_30px_-10px_rgba(239,68,68,0.5)] border border-white/20 transition-all"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <LogOut className="w-6 h-6" />
            Logout
          </motion.button>
        </div>
      </div>

      {/* Subscribe Modal */}
      <SubscribeModal
        open={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        onSuccess={() => setPremium(true)}
      />
    </div>
  );
};

export default ParentsPage;
