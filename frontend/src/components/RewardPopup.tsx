import { motion, AnimatePresence } from "framer-motion";
import { Star, Zap, Coins } from "lucide-react";

interface RewardPopupProps {
  show: boolean;
  stars?: number;
  xp?: number;
  coins?: number;
  message?: string;
  onClose: () => void;
}

const RewardPopup = ({ show, stars = 0, xp = 0, coins = 0, message = "Great Job! 🎉", onClose }: RewardPopupProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          {/* Popup */}
          <motion.div
            className="relative z-10 mx-4 w-full max-w-xs rounded-[32px] border border-white/40 p-8 text-center shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(255,220,100,0.3) 0%, rgba(180,100,255,0.3) 100%)",
              backdropFilter: "blur(30px)",
              boxShadow: "0 30px 80px -10px rgba(255,180,80,0.5), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
          >
            {/* Stars burst ring */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 -ml-2 -mt-2"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 80,
                  y: Math.sin((i / 8) * Math.PI * 2) * 80,
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              >
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
              </motion.div>
            ))}

            {/* Character jump */}
            <motion.div
              className="text-6xl mb-3"
              animate={{ y: [0, -20, 0, -12, 0] }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              🦉
            </motion.div>

            <h2 className="font-display text-2xl font-extrabold text-white drop-shadow-md mb-1">
              {message}
            </h2>
            <p className="text-white/80 text-sm mb-5">You're amazing!</p>

            <div className="flex items-center justify-center gap-4 mb-6">
              {stars > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
                  <span className="font-display text-lg font-bold text-white">+{stars}</span>
                </div>
              )}
              {xp > 0 && (
                <div className="flex items-center gap-1.5">
                  <Zap className="w-5 h-5 text-purple-300 fill-purple-300" />
                  <span className="font-display text-lg font-bold text-white">+{xp} XP</span>
                </div>
              )}
              {coins > 0 && (
                <div className="flex items-center gap-1.5">
                  <Coins className="w-5 h-5 text-yellow-300" />
                  <span className="font-display text-lg font-bold text-white">+{coins}</span>
                </div>
              )}
            </div>

            <motion.button
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-display text-base font-bold text-amber-950"
              style={{
                background: "linear-gradient(135deg, #FFE0A3 0%, #FFB870 50%, #E89A4A 100%)",
                boxShadow: "0 8px 25px -5px rgba(255,170,80,0.6)",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue! 🚀
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardPopup;
