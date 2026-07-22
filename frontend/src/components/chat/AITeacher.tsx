/**
 * AITeacher — Displays the AI Teacher illustration with
 * simple lip-sync / speaking animation when TTS is playing.
 *
 * Props:
 *  - isSpeaking  → triggers mouth/head animation
 *  - isListening → subtle "attentive" lean
 *  - isThinking  → gentle pulse
 *
 * Architecture: swap the <img> for a <RiveComponent> later
 * without changing the parent component at all.
 */

import { motion } from "framer-motion";
import teacherImg from "@/assets/teacher/ai-teacher.png";

interface AITeacherProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
}

const AITeacher = ({ isSpeaking, isListening, isThinking }: AITeacherProps) => {
  // Choose animation variant based on current state
  const getAnimation = () => {
    if (isSpeaking) {
      return {
        // Gentle bobbing while talking
        y: [0, -4, 0, -2, 0],
        scale: [1, 1.01, 1, 1.005, 1],
        rotate: [0, -0.5, 0, 0.5, 0],
      };
    }
    if (isListening) {
      return {
        // Slight lean forward — attentive
        scale: [1, 1.02, 1],
        rotate: [0, -1, 0],
      };
    }
    if (isThinking) {
      return {
        // Gentle thinking sway
        rotate: [0, 1, -1, 0],
        scale: [1, 1.01, 1],
      };
    }
    // Idle — subtle breathing
    return {
      y: [0, -3, 0],
      scale: [1, 1.005, 1],
    };
  };

  const getDuration = () => {
    if (isSpeaking) return 0.6;
    if (isListening) return 2;
    if (isThinking) return 1.5;
    return 3;
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Soft halo behind teacher */}
      <div
        className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,180,100,0.2) 0%, rgba(168,85,247,0.1) 50%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Speaking sound waves */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={`wave-${i}`}
              className="absolute rounded-full border border-blue-400/20"
              style={{ width: 160 + i * 30, height: 160 + i * 30 }}
              animate={{
                scale: [1, 1.15],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Teacher illustration */}
      <motion.div
        className="relative z-10"
        animate={getAnimation()}
        transition={{
          duration: getDuration(),
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <img
          src={teacherImg}
          alt="AI Teacher"
          className="w-40 h-40 sm:w-52 sm:h-52 object-contain drop-shadow-xl pointer-events-none select-none"
          style={{ mixBlendMode: "multiply" }}
          draggable={false}
        />

        {/* Mouth overlay for simple lip-sync while speaking */}
        {isSpeaking && (
          <motion.div
            className="absolute bottom-[38%] left-1/2 -translate-x-1/2 w-4 h-2 rounded-full bg-[#4A2800]/60"
            animate={{
              scaleY: [0.3, 1.2, 0.5, 1, 0.3],
              scaleX: [1, 0.8, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 0.35,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default AITeacher;
