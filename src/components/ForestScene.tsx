import { motion } from "framer-motion";
import forestBg from "@/assets/forest-bg.jpg";
import kidBoy from "@/assets/kid-running.png";
import kidGirl from "@/assets/kid-girl.png";

const ForestScene = () => {
  const fireflies = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: (i * 53) % 100,
    y: 30 + ((i * 37) % 65),
    delay: (i % 6) * 0.5,
    duration: 5 + (i % 5),
  }));

  const leaves = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: (i * 13 + 5) % 95,
    delay: i * 1.2,
    duration: 11 + (i % 4) * 2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Painted forest background */}
      <img
        src={forestBg}
        alt="Magical sunset forest with cottage"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Soft warm overlay to blend with card */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

      {/* Running kid */}
      <motion.div
        className="absolute bottom-[6%] pointer-events-none"
        initial={{ x: "-15vw" }}
        animate={{ x: ["-15vw", "115vw"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <motion.img
          src={kidRunning}
          alt=""
          className="w-28 sm:w-36 drop-shadow-2xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Floating clouds (subtle, on top of painted sky) */}
      {[
        { top: "8%", size: 100, delay: 0, duration: 60, opacity: 0.4 },
        { top: "18%", size: 70, delay: 15, duration: 75, opacity: 0.35 },
      ].map((c, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: c.top, width: c.size, height: c.size * 0.5, opacity: c.opacity }}
          initial={{ x: "-20vw" }}
          animate={{ x: "120vw" }}
          transition={{ duration: c.duration, repeat: Infinity, delay: c.delay, ease: "linear" }}
        >
          <svg viewBox="0 0 100 50" className="w-full h-full">
            <ellipse cx="25" cy="35" rx="20" ry="15" fill="rgba(255,255,255,0.95)" />
            <ellipse cx="50" cy="28" rx="25" ry="20" fill="rgba(255,255,255,1)" />
            <ellipse cx="75" cy="35" rx="22" ry="16" fill="rgba(255,255,255,0.95)" />
          </svg>
        </motion.div>
      ))}

      {/* Falling leaves */}
      {leaves.map((l) => (
        <motion.div
          key={`leaf-${l.id}`}
          className="absolute"
          style={{ left: `${l.x}%`, top: "-5%" }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, 30, -20, 10],
            rotate: [0, 180, 360],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: l.duration, repeat: Infinity, delay: l.delay, ease: "linear" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M12 2 C7 7 4 12 4 16 C4 20 8 22 12 22 C16 22 20 20 20 16 C20 12 17 7 12 2 Z"
              fill="#E8B85A"
              opacity="0.9"
            />
            <path d="M12 4 L12 20" stroke="#8B5A2B" strokeWidth="1" />
          </svg>
        </motion.div>
      ))}

      {/* Fireflies */}
      {fireflies.map((f) => (
        <motion.div
          key={`firefly-${f.id}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-yellow-100"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            boxShadow:
              "0 0 8px 2px rgba(255,236,150,0.95), 0 0 16px 4px rgba(255,200,80,0.6)",
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -25, 15, -10, 0],
            opacity: [0.2, 1, 0.4, 1, 0.2],
          }}
          transition={{ duration: f.duration, repeat: Infinity, delay: f.delay, ease: "easeInOut" }}
        />
      ))}

      {/* Soft vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.25)_100%)]" />
    </div>
  );
};

export default ForestScene;
