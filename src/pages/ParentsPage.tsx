import { motion } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import NavBar from "@/components/NavBar";
import SceneBackground from "@/components/SceneBackground";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
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
} from "lucide-react";

const ParentsPage = () => {
  const { profile } = useChild();

  const stats = [
    {
      icon: Star,
      label: "Total Stars",
      value: profile?.stars || 0,
      color: "from-sunshine to-coral",
    },
    {
      icon: Zap,
      label: "Total XP",
      value: profile?.xp || 0,
      color: "from-purple-400 to-pink-400",
    },
    {
      icon: Flame,
      label: "Day Streak",
      value: profile?.streak || 0,
      color: "from-orange-400 to-red-400",
    },
    {
      icon: Trophy,
      label: "Level",
      value: profile?.level || 1,
      color: "from-amber-400 to-yellow-500",
    },
    {
      icon: Gamepad2,
      label: "Games Played",
      value: profile?.completedGames.length || 0,
      color: "from-sky to-lavender",
    },
    {
      icon: BookOpen,
      label: "Stories Read",
      value: profile?.completedStories.length || 0,
      color: "from-mint to-sky",
    },
    {
      icon: GraduationCap,
      label: "Lessons Done",
      value: profile?.completedLessons.length || 0,
      color: "from-green-400 to-teal-400",
    },
    {
      icon: Crown,
      label: "Coins",
      value: profile?.coins || 0,
      color: "from-bubblegum to-lavender",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SceneBackground image={parentsBg} alt="Cozy forest cottage interior with fireplace" variant="cottage" />
      <NavBar />
      <AmbientSoundToggle />

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
                Age: {profile?.age} • Fav Color: {profile?.favoriteColor}
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
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  profile?.isPremium
                    ? "bg-gradient-to-r from-premium to-sunshine text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {profile?.isPremium ? "👑 Premium" : "Free Plan"}
              </span>
            </div>
          </div>
        </motion.div>

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
      </div>
    </div>
  );
};

export default ParentsPage;