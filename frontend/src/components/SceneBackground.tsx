import { motion } from "framer-motion";

type Variant = "meadow" | "playground" | "library" | "treehouse" | "cottage";

interface Props {
  image: string;
  alt: string;
  variant: Variant;
}

const variants: Record<Variant, { particle: string; overlay: string; count: number }> = {
  meadow: {
    particle: "rgba(255,255,255,0.95)", // butterflies/light
    overlay: "bg-gradient-to-b from-white/10 via-transparent to-black/15",
    count: 18,
  },
  playground: {
    particle: "rgba(255,230,150,0.95)",
    overlay: "bg-gradient-to-b from-sky-200/10 via-transparent to-black/20",
    count: 14,
  },
  library: {
    particle: "rgba(255,236,150,1)", // fireflies
    overlay: "bg-gradient-to-b from-indigo-950/30 via-transparent to-black/45",
    count: 28,
  },
  treehouse: {
    particle: "rgba(255,215,140,1)",
    overlay: "bg-gradient-to-b from-amber-950/20 via-transparent to-black/40",
    count: 20,
  },
  cottage: {
    particle: "rgba(255,220,170,0.9)",
    overlay: "bg-gradient-to-b from-amber-100/10 via-transparent to-black/20",
    count: 12,
  },
};

const SceneBackground = ({ image, alt, variant }: Props) => {
  const v = variants[variant];
  const particles = Array.from({ length: v.count }, (_, i) => ({
    id: i,
    x: (i * 53) % 100,
    y: 15 + ((i * 37) % 75),
    delay: (i % 6) * 0.5,
    duration: 4 + (i % 5),
    size: variant === "library" || variant === "treehouse" ? 1.5 : 2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={image}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className={`absolute inset-0 ${v.overlay}`} />

      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size * 4,
            height: p.size * 4,
            background: v.particle,
            boxShadow: `0 0 10px 2px ${v.particle}, 0 0 20px 4px ${v.particle.replace(/[\d.]+\)$/, "0.45)")}`,
          }}
          animate={{
            x: [0, 25, -15, 10, 0],
            y: [0, -20, 12, -8, 0],
            opacity: [0.2, 1, 0.4, 1, 0.2],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.3)_100%)]" />
    </div>
  );
};

export default SceneBackground;
