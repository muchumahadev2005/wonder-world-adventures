/**
 * SegmentedTabs — iOS-style animated segmented control.
 *
 * Capsule shape, gradient slider, glassmorphism inactive tabs.
 */

import { motion } from "framer-motion";

export type TabValue = "chat" | "interactive";

interface SegmentedTabsProps {
  activeTab: TabValue;
  onChange: (tab: TabValue) => void;
}

const tabs: { value: TabValue; label: string; icon: string }[] = [
  { value: "chat", label: "Chat", icon: "💬" },
  { value: "interactive", label: "Interactive", icon: "🎙️" },
];

const SegmentedTabs = ({ activeTab, onChange }: SegmentedTabsProps) => {
  return (
    <div
      className="relative flex w-full max-w-xs mx-auto rounded-full p-1 select-none"
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow:
          "0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className="relative flex-1 z-10 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full font-display font-bold text-sm transition-colors duration-200"
            style={{
              color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
            }}
          >
            {/* Animated active indicator behind text */}
            {isActive && (
              <motion.div
                layoutId="segmented-active-indicator"
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #FF9E6E 0%, #E86CAD 50%, #A855F7 100%)",
                  boxShadow:
                    "0 4px 15px rgba(232,108,173,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10 text-base">{tab.icon}</span>
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedTabs;
