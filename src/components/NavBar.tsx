import { AnimatePresence, motion } from "framer-motion";
import {
  House,
  Gamepad2,
  BookText,
  MessagesSquare,
  UsersRound,
  CircleUserRound,
  Sparkles,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useChild } from "@/context/ChildContext";

const navItems = [
  { icon: House, label: "Home", path: "/" },
  { icon: Gamepad2, label: "Games", path: "/games" },
  { icon: BookText, label: "Stories", path: "/stories" },
  { icon: MessagesSquare, label: "Chat", path: "/chat" },
  { icon: UsersRound, label: "Parents", path: "/parents" },
];

// Magical glass navbar — warm cream tint, glowing active pill, sparkles
const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useChild();

  if (!profile) return null;

  const glassStyle = {
    background:
      "linear-gradient(135deg, rgba(255,245,225,0.55) 0%, rgba(255,225,210,0.35) 50%, rgba(220,200,255,0.45) 100%)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    borderRadius: 28,
    boxShadow:
      "0 12px 40px rgba(120,70,30,0.18), 0 2px 10px rgba(160,100,200,0.18), inset 0 1px 0 rgba(255,255,255,0.55)",
    border: "1px solid rgba(255,255,255,0.45)",
  } as const;

  const activeBg =
    "linear-gradient(135deg, hsl(35 95% 60%) 0%, hsl(280 70% 65%) 100%)";

  const renderActiveSparkles = (idPrefix: string) => (
    <>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={`${idPrefix}-${i}`}
          className="pointer-events-none absolute"
          style={{
            top: i === 0 ? -4 : i === 1 ? "50%" : "100%",
            left: i === 0 ? "20%" : i === 1 ? -4 : "70%",
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.4, 1.1, 0.4],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2 + i * 0.4,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          <Sparkles className="h-3 w-3 text-amber-200" />
        </motion.span>
      ))}
    </>
  );

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-2 sm:px-3 md:px-4"
      style={{ marginTop: 12 }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
    >
      <div
        className="w-[96%] max-w-[1240px] px-3 py-3 md:w-[92%] md:px-4 lg:px-6"
        style={glassStyle}
      >
        {/* MOBILE */}
        <div className="md:hidden">
          <div className="flex items-center justify-between gap-2">
            <motion.div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(35 95% 60%), hsl(280 70% 65%))",
                  boxShadow: "0 4px 14px rgba(255,170,80,0.45)",
                }}
              >
                <span className="text-sm font-bold text-white">K</span>
              </div>
              <span className="font-display text-xl font-bold text-white drop-shadow-[0_2px_6px_rgba(120,60,20,0.4)]">
                KidsPal
              </span>
            </motion.div>

            <div className="flex items-center gap-2">
              <motion.div
                className="flex h-10 items-center gap-1.5 rounded-full px-3"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(45 100% 88%), hsl(35 95% 80%))",
                  border: "1px solid hsl(45 100% 70%)",
                  boxShadow: "0 4px 14px rgba(255,180,80,0.35)",
                }}
                whileHover={{ scale: 1.04 }}
              >
                <Sparkles className="h-4 w-4 text-amber-700" strokeWidth={2.3} />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={profile.stars}
                    className="text-base font-bold text-amber-800"
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {profile.stars}
                  </motion.span>
                </AnimatePresence>
              </motion.div>

              <motion.button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,240,220,0.9), rgba(220,200,255,0.85))",
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                title="Logout"
              >
                <CircleUserRound
                  className="h-5 w-5 text-amber-900/80"
                  strokeWidth={2.2}
                />
              </motion.button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="group relative flex h-11 min-w-[102px] items-center justify-center gap-2 rounded-2xl px-3 py-2"
                  style={
                    isActive
                      ? {
                          color: "white",
                        }
                      : {
                          color: "hsl(30 30% 25%)",
                          backgroundColor: "rgba(255,255,255,0.35)",
                        }
                  }
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isActive && (
                    <>
                      <motion.div
                        layoutId="nav-active-pill-mobile"
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: activeBg,
                          boxShadow:
                            "0 6px 20px rgba(255,150,60,0.5), 0 2px 8px rgba(160,80,200,0.4)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                      {renderActiveSparkles(`m-${item.path}`)}
                    </>
                  )}
                  <span
                    className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-amber-100/70 text-amber-800"
                    }`}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={2.3} />
                  </span>
                  <span className="relative z-10 text-sm font-semibold">
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden h-[82px] items-center gap-2 md:grid md:grid-cols-[minmax(165px,auto),1fr,minmax(165px,auto)] md:gap-4">
          <motion.div
            className="flex items-center gap-2 cursor-pointer select-none pr-1"
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg, hsl(35 95% 60%), hsl(280 70% 65%))",
                boxShadow: "0 6px 20px rgba(255,170,80,0.5)",
              }}
            >
              <span className="text-white font-bold text-base">K</span>
            </div>
            <span className="font-display text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(120,60,20,0.45)]">
              KidsPal
            </span>
          </motion.div>

          <div className="flex items-center justify-center gap-1 px-1 lg:gap-1.5 sm:px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="group relative flex h-12 items-center gap-2.5 rounded-2xl px-3 py-2.5 transition-all duration-200 lg:px-4"
                  style={
                    isActive
                      ? { color: "white" }
                      : { color: "hsl(30 35% 22%)" }
                  }
                  whileHover={
                    !isActive
                      ? {
                          y: -3,
                          backgroundColor: "rgba(255,240,220,0.55)",
                        }
                      : { y: -2 }
                  }
                  whileTap={{ scale: 0.95 }}
                >
                  {isActive && (
                    <>
                      <motion.div
                        layoutId="nav-active-pill-desktop"
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: activeBg,
                          boxShadow:
                            "0 8px 25px rgba(255,150,60,0.5), 0 2px 10px rgba(160,80,200,0.45)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                      {renderActiveSparkles(`d-${item.path}`)}
                    </>
                  )}
                  <span
                    className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-amber-100/80 text-amber-800 group-hover:bg-amber-200 group-hover:text-amber-900"
                    }`}
                  >
                    <item.icon
                      className="h-[17px] w-[17px]"
                      strokeWidth={2.3}
                    />
                  </span>
                  <span className="relative z-10 hidden text-base font-semibold tracking-tight lg:block">
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="flex min-w-[165px] items-center justify-end gap-2.5">
            <motion.div
              className="flex h-12 items-center gap-2 rounded-full px-3 sm:px-4"
              style={{
                background:
                  "linear-gradient(135deg, hsl(45 100% 88%), hsl(35 95% 78%))",
                border: "1px solid hsl(45 100% 68%)",
                boxShadow: "0 6px 20px rgba(255,180,80,0.4)",
              }}
              whileHover={{ scale: 1.06, y: -2 }}
            >
              <Sparkles className="h-5 w-5 text-amber-700" strokeWidth={2.3} />
              <AnimatePresence mode="wait">
                <motion.span
                  key={profile.stars}
                  className="text-xl font-bold text-amber-800"
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 6, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {profile.stars}
                  <span className="hidden lg:inline"> Stars</span>
                </motion.span>
              </AnimatePresence>
            </motion.div>

            <motion.button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/70"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,240,220,0.9), rgba(220,200,255,0.85))",
                boxShadow: "0 4px 14px rgba(160,100,200,0.3)",
              }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              title="Logout"
            >
              <CircleUserRound
                className="h-6 w-6 text-amber-900/80"
                strokeWidth={2.2}
              />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default NavBar;
