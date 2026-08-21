import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface AdminLoadingStateProps {
  message?: string;
  subMessage?: string;
  minHeight?: number | string;
}

export default function AdminLoadingState({
  message = "Loading data from database...",
  subMessage = "Please wait a moment while we fetch the latest records.",
  minHeight = "400px",
}: AdminLoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        minHeight,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 64,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        {/* Pulsing halo */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
            filter: "blur(8px)",
          }}
        />
        {/* Spinning icon */}
        <Loader2
          size={36}
          style={{
            color: "hsl(var(--primary))",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>

      <h3
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: "hsl(var(--foreground))",
          margin: 0,
          fontFamily: "'Baloo 2', cursive",
        }}
      >
        {message}
      </h3>

      {subMessage && (
        <p
          style={{
            fontSize: 13,
            color: "hsl(var(--muted-foreground))",
            marginTop: 6,
            maxWidth: 340,
            lineHeight: 1.4,
          }}
        >
          {subMessage}
        </p>
      )}
    </motion.div>
  );
}
