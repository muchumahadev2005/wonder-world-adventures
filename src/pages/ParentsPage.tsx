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
  Clock,
  TrendingUp,
  Shield,
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
      icon: Clock,
      label: "Session",
      value: "Active",
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
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" /> Parent
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your child's learning journey
          </p>
        </motion.div>

        {/* Child Info */}
        <motion.div
          className="relative p-6 mb-8 rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-2xl"
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
            <div>
              <h2 className="font-display text-2xl font-extrabold text-white drop-shadow-md">
                {profile?.name}
              </h2>
              <p className="text-white/80 font-bold drop-shadow-sm">
                Age: {profile?.age} • Favorite Color: {profile?.favoriteColor}
              </p>
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              className="relative p-5 text-center rounded-3xl border border-white/40 shadow-xl backdrop-blur-xl"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)",
              }}
              variants={{
                hidden: { y: 20, opacity: 0 },
                show: { y: 0, opacity: 1 },
              }}
              whileHover={{ scale: 1.03 }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-2`}
              >
                <stat.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="font-display text-2xl font-extrabold text-white drop-shadow-md">
                {stat.value}
              </p>
              <p className="text-white/80 text-xs font-bold drop-shadow-sm uppercase tracking-wide">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Activity */}
        <motion.div
          className="relative p-6 rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-display text-xl font-extrabold flex items-center gap-2 mb-4 text-white drop-shadow-md">
            <TrendingUp className="w-5 h-5 text-amber-300" /> Recent Activity
          </h3>
          {(profile?.completedGames.length || 0) +
            (profile?.completedStories.length || 0) >
          0 ? (
            <div className="space-y-3">
              {profile?.completedGames.map((g) => (
                <div
                  key={g}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-xl border border-white/20 bg-white/10 text-white"
                >
                  <Gamepad2 className="w-5 h-5 text-sky-light" />
                  <span className="font-body text-sm font-bold">
                    Completed game: <b>{g}</b>
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    ✅
                  </span>
                </div>
              ))}
              {profile?.completedStories.map((s) => (
                <div
                  key={s}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-xl border border-white/20 bg-white/10 text-white"
                >
                  <BookOpen className="w-5 h-5 text-mint-light" />
                  <span className="font-body text-sm font-bold">
                    Read story: <b>{s}</b>
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    ✅
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No activity yet. Encourage your child to play games and read
              stories! 🎮📖
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ParentsPage;