/**
 * VoiceRepeatCharacter — Rive owl mascot for Voice Repeat mode.
 *
 * Uses the existing owl-mascot.riv with its single state machine:
 *   • State Machine: "State Machine 1"
 *   • Trigger: "Trigger 1" (plays hello/wakeup → returns to sleeping)
 *   • Default: sleeping9 idle loop
 *
 * Since the .riv does NOT expose dedicated listening/talking inputs,
 * visual state feedback is handled with safe framer-motion overlays
 * (same approach as AITeacher.tsx). The Rive trigger is fired on
 * state transitions to wake the owl.
 *
 * Props:
 *   isSpeaking  — character is repeating the child's speech
 *   isListening — microphone is active
 */

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  useRive,
  useStateMachineInput,
  StateMachineInputType,
  Layout,
  Fit,
  Alignment,
} from "@rive-app/react-canvas";
import mascotRivUrl from "@/assets/rive/owl-mascot.riv?url";

const SM_NAME = "State Machine 1";
const TRIGGER_NAME = "Trigger 1";

interface VoiceRepeatCharacterProps {
  isSpeaking: boolean;
  isListening: boolean;
}

const VoiceRepeatCharacter = ({
  isSpeaking,
  isListening,
}: VoiceRepeatCharacterProps) => {
  const isFiringRef = useRef(false);

  const { rive, RiveComponent } = useRive({
    src: mascotRivUrl,
    autoplay: true,
    stateMachines: SM_NAME,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  // Hook into the existing trigger
  const trigger = useStateMachineInput(
    rive,
    SM_NAME,
    TRIGGER_NAME,
    StateMachineInputType.Trigger
  );

  // Fire trigger on state transitions to wake the owl
  const fireTrigger = useCallback(() => {
    if (isFiringRef.current || !trigger) return;
    isFiringRef.current = true;
    trigger.fire();
    setTimeout(() => {
      isFiringRef.current = false;
    }, 3000);
  }, [trigger]);

  // Wake owl when listening or speaking starts
  useEffect(() => {
    if (isListening || isSpeaking) {
      fireTrigger();
    }
  }, [isListening, isSpeaking, fireTrigger]);

  // ── Determine overlay animation ─────────────────────────────────
  const getAnimation = () => {
    if (isSpeaking) {
      return {
        y: [0, -4, 0, -2, 0],
        scale: [1, 1.01, 1, 1.005, 1],
        rotate: [0, -0.5, 0, 0.5, 0],
      };
    }
    if (isListening) {
      return {
        scale: [1, 1.02, 1],
        rotate: [0, -1, 0],
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
    return 3;
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Soft ambient halo */}
      <div
        className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(255,180,100,0.1) 50%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Speaking sound waves */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={`speak-wave-${i}`}
              className="absolute rounded-full border border-purple-400/25"
              style={{ width: 140 + i * 28, height: 140 + i * 28 }}
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

      {/* Listening pulse rings */}
      {isListening && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[1, 2].map((i) => (
            <motion.div
              key={`listen-ring-${i}`}
              className="absolute rounded-full border-2 border-pink-400/30"
              style={{ width: 130 + i * 25, height: 130 + i * 25 }}
              animate={{
                scale: [1, 1.3],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Rive character with motion overlay */}
      <motion.div
        className="relative z-10 w-40 h-40 sm:w-52 sm:h-52"
        animate={getAnimation()}
        transition={{
          duration: getDuration(),
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <RiveComponent
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />

        {/* Mouth overlay for simple lip-sync while speaking */}
        {isSpeaking && (
          <motion.div
            className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-4 h-2.5 rounded-full bg-[#4A2800]/50"
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

export default VoiceRepeatCharacter;
