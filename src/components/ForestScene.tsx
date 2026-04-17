import { motion } from "framer-motion";

const ForestScene = () => {
  // Deterministic particle positions
  const fireflies = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: (i * 53) % 100,
    y: (i * 37) % 100,
    delay: (i % 5) * 0.6,
    duration: 6 + (i % 4),
  }));

  const leaves = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: (i * 13 + 5) % 95,
    delay: i * 1.5,
    duration: 12 + (i % 3) * 2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient: dawn forest */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#FFD9A8_0%,#F4B98A_18%,#C8DBA0_45%,#7FA86A_75%,#3F6B47_100%)]" />

      {/* Soft sun glow */}
      <div className="absolute top-[8%] right-[15%] w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(255,236,179,0.9)_0%,rgba(255,200,120,0.4)_40%,transparent_70%)] blur-2xl" />

      {/* Distant tree silhouettes layer */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        style={{ height: "65%" }}
      >
        {/* Far hills */}
        <path
          d="M0,250 Q200,180 400,220 T800,200 T1200,230 L1200,400 L0,400 Z"
          fill="#6B8E5A"
          opacity="0.55"
        />
        {/* Mid forest line */}
        <path
          d="M0,290 L40,250 L60,290 L100,240 L130,290 L170,230 L210,290 L260,250 L300,290 L340,235 L390,290 L440,250 L490,290 L540,230 L600,290 L660,250 L720,290 L780,235 L840,290 L900,250 L960,290 L1020,235 L1080,290 L1140,250 L1200,290 L1200,400 L0,400 Z"
          fill="#3F6B47"
        />
        {/* Closer dark trees */}
        <g fill="#2C5234">
          {[60, 180, 320, 470, 640, 820, 980, 1130].map((x, i) => (
            <g key={i} transform={`translate(${x},${300 + (i % 2) * 10})`}>
              <polygon points="0,-90 -28,-30 -16,-30 -36,20 -20,20 -42,70 42,70 20,20 36,20 16,-30 28,-30" />
            </g>
          ))}
        </g>
        {/* Ground */}
        <path d="M0,360 Q600,340 1200,360 L1200,400 L0,400 Z" fill="#1F3D26" />
      </svg>

      {/* Cottage */}
      <div className="absolute bottom-[18%] left-[8%] w-40 sm:w-52">
        <svg viewBox="0 0 200 180" className="w-full drop-shadow-xl">
          {/* Roof */}
          <polygon points="20,90 100,30 180,90" fill="#7A3E2A" />
          <polygon points="20,90 100,30 180,90" fill="url(#roofShine)" opacity="0.3" />
          {/* Body */}
          <rect x="35" y="90" width="130" height="75" fill="#D9A56B" />
          {/* Door */}
          <rect x="85" y="120" width="30" height="45" rx="4" fill="#5A2E1A" />
          <circle cx="108" cy="143" r="2" fill="#FFD27A" />
          {/* Window */}
          <rect x="45" y="105" width="25" height="25" fill="#FFE9A8" stroke="#5A2E1A" strokeWidth="2" />
          <rect x="130" y="105" width="25" height="25" fill="#FFE9A8" stroke="#5A2E1A" strokeWidth="2" />
          {/* Chimney */}
          <rect x="140" y="50" width="15" height="35" fill="#5A2E1A" />
          <defs>
            <linearGradient id="roofShine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        {/* Smoke */}
        <motion.div
          className="absolute top-0 left-[70%] w-3 h-3 rounded-full bg-white/50 blur-sm"
          animate={{ y: [-10, -60], opacity: [0.6, 0], scale: [1, 2.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
        />
      </div>

      {/* Floating clouds */}
      {[
        { top: "12%", size: 90, delay: 0, duration: 40 },
        { top: "20%", size: 60, delay: 5, duration: 50 },
        { top: "28%", size: 110, delay: 12, duration: 55 },
      ].map((c, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: c.top, width: c.size, height: c.size * 0.5 }}
          initial={{ x: "-20vw" }}
          animate={{ x: "120vw" }}
          transition={{ duration: c.duration, repeat: Infinity, delay: c.delay, ease: "linear" }}
        >
          <svg viewBox="0 0 100 50" className="w-full h-full">
            <ellipse cx="25" cy="35" rx="20" ry="15" fill="rgba(255,255,255,0.85)" />
            <ellipse cx="50" cy="28" rx="25" ry="20" fill="rgba(255,255,255,0.9)" />
            <ellipse cx="75" cy="35" rx="22" ry="16" fill="rgba(255,255,255,0.85)" />
          </svg>
        </motion.div>
      ))}

      {/* Children playing with ball */}
      <div className="absolute bottom-[14%] right-[12%] w-32 sm:w-40">
        <svg viewBox="0 0 200 120" className="w-full">
          {/* Child 1 (left) - waving arm */}
          <g transform="translate(30,30)">
            <circle cx="0" cy="0" r="10" fill="#FFD8B8" />
            <rect x="-2" y="-12" width="4" height="6" fill="#5A3A22" />
            {/* Body */}
            <rect x="-7" y="10" width="14" height="22" rx="3" fill="#E0533C" />
            {/* Legs */}
            <rect x="-6" y="32" width="4" height="14" fill="#3A5FA8" />
            <rect x="2" y="32" width="4" height="14" fill="#3A5FA8" />
            {/* Static arm */}
            <rect x="-12" y="12" width="4" height="14" fill="#FFD8B8" />
            {/* Waving arm */}
            <motion.g
              style={{ originX: "8px", originY: "12px" }}
              animate={{ rotate: [-15, 25, -15] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <rect x="6" y="10" width="4" height="14" fill="#FFD8B8" />
            </motion.g>
          </g>

          {/* Child 2 (right) */}
          <g transform="translate(160,30)">
            <circle cx="0" cy="0" r="10" fill="#F2C29A" />
            <path d="M-10,-4 Q0,-16 10,-4 L10,2 L-10,2 Z" fill="#3A2418" />
            <rect x="-7" y="10" width="14" height="22" rx="3" fill="#5BA873" />
            <rect x="-6" y="32" width="4" height="14" fill="#5A3A22" />
            <rect x="2" y="32" width="4" height="14" fill="#5A3A22" />
            <motion.g
              style={{ originX: "-8px", originY: "12px" }}
              animate={{ rotate: [20, -10, 20] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <rect x="-10" y="10" width="4" height="14" fill="#F2C29A" />
            </motion.g>
            <rect x="6" y="12" width="4" height="14" fill="#F2C29A" />
          </g>

          {/* Bouncing ball */}
          <motion.g
            animate={{
              x: [0, 130, 0],
              y: [0, -40, 0, -40, 0],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", times: [0, 0.25, 0.5, 0.75, 1] }}
          >
            <circle cx="50" cy="80" r="8" fill="#FF5A5F" />
            <path d="M42,80 Q50,72 58,80" stroke="#fff" strokeWidth="1.5" fill="none" />
            <circle cx="47" cy="77" r="2" fill="rgba(255,255,255,0.6)" />
          </motion.g>
        </svg>
      </div>

      {/* Floating leaves */}
      {leaves.map((l) => (
        <motion.div
          key={`leaf-${l.id}`}
          className="absolute text-lg"
          style={{ left: `${l.x}%`, top: "-5%" }}
          initial={{ y: -20, rotate: 0, opacity: 0 }}
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
              fill="#9CCB6B"
              opacity="0.85"
            />
            <path d="M12 4 L12 20" stroke="#5C8A3E" strokeWidth="1" />
          </svg>
        </motion.div>
      ))}

      {/* Fireflies */}
      {fireflies.map((f) => (
        <motion.div
          key={`firefly-${f.id}`}
          className="absolute w-2 h-2 rounded-full bg-yellow-200"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            boxShadow: "0 0 8px 2px rgba(255,236,150,0.9), 0 0 16px 4px rgba(255,200,80,0.5)",
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -20, 20, -10, 0],
            opacity: [0.2, 1, 0.4, 1, 0.2],
          }}
          transition={{ duration: f.duration, repeat: Infinity, delay: f.delay, ease: "easeInOut" }}
        />
      ))}

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)]" />
    </div>
  );
};

export default ForestScene;
