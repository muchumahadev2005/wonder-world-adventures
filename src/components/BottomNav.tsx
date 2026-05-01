import { motion } from "framer-motion";
import { House, Gamepad2, BookText, MessagesSquare, UsersRound } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const items = [
  { icon: House, label: "Home", path: "/" },
  { icon: Gamepad2, label: "Words", path: "/games" },
  { icon: BookText, label: "Learn", path: "/stories" },
  { icon: MessagesSquare, label: "Chat", path: "/chat" },
  { icon: UsersRound, label: "Parents", path: "/parents" },
];

const activeBg = "linear-gradient(135deg, hsl(35 95% 60%) 0%, hsl(280 70% 65%) 100%)";

/** Floating rounded bottom nav — mobile only. Hidden on md+. */
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.nav
      className="fixed bottom-3 left-0 right-0 z-50 md:hidden flex justify-center px-3"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.1 }}
    >
      <div
        className="flex w-full max-w-[440px] items-center justify-between gap-1 px-2 py-2 rounded-[28px]"
        style={{
          paddingBottom: "max(8px, env(safe-area-inset-bottom))",
          background:
            "linear-gradient(135deg, rgba(255,245,225,0.75) 0%, rgba(255,225,210,0.55) 50%, rgba(220,200,255,0.65) 100%)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow:
            "0 14px 40px rgba(120,70,30,0.25), 0 4px 14px rgba(160,100,200,0.22), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] py-2 px-1 min-h-[54px]"
              style={isActive ? { color: "white" } : { color: "hsl(30 35% 22%)" }}
              whileTap={{ scale: 0.9 }}
              animate={isActive ? { y: -2 } : { y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 rounded-[20px]"
                  style={{
                    background: activeBg,
                    boxShadow:
                      "0 8px 22px rgba(255,150,60,0.55), 0 2px 8px rgba(160,80,200,0.45)",
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon
                className="relative z-10 h-[20px] w-[20px]"
                strokeWidth={2.4}
              />
              <span className="relative z-10 text-[10px] font-bold tracking-tight leading-none">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
