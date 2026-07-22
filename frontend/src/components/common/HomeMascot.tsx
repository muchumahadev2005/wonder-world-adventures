/**
 * HomeMascot.tsx
 *
 * Rive mascot with sleep → hi → sleep behaviour.
 *
 * The .riv file "State Machine 1" has:
 *   • sleeping9  – default looping idle state
 *   • hello / wakeup – plays when "Trigger 1" fires, then returns to sleep
 *
 * The artboard is FULLY TRANSPARENT so no background tricks are needed.
 * The glassmorphism look comes purely from the parent card in HomePage.
 */

import {
  useCallback,
  useImperativeHandle,
  forwardRef,
  useRef,
  useEffect,
} from "react";
import {
  useRive,
  useStateMachineInput,
  StateMachineInputType,
  Layout,
  Fit,
  Alignment,
} from "@rive-app/react-canvas";
import mascotRivUrl from "@/assets/rive/owl-mascot.riv?url";

const SM_NAME      = "State Machine 1";
const TRIGGER_NAME = "Trigger 1";

// ── Public handle ─────────────────────────────────────────────────────────────
export interface HomeMascotHandle {
  play: () => void;
}

interface HomeMascotProps {
  onTap?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
const HomeMascot = forwardRef<HomeMascotHandle, HomeMascotProps>(
  ({ onTap }, ref) => {
    const isFiringRef = useRef(false); // debounce rapid taps

    const { rive, RiveComponent } = useRive({
      src           : mascotRivUrl,
      autoplay      : true,
      stateMachines : SM_NAME,
      layout        : new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    });

    // Hook into "Trigger 1" — fires the hello/wakeup transition
    const trigger = useStateMachineInput(rive, SM_NAME, TRIGGER_NAME, StateMachineInputType.Trigger);

    // Log available names on load (for debugging)
    useEffect(() => {
      if (!rive) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = rive as any;
      console.log("[HomeMascot] stateMachineNames:", r.stateMachineNames);
      console.log("[HomeMascot] animationNames   :", r.animationNames);
      try {
        console.log("[HomeMascot] inputs:", r.stateMachineInputs(SM_NAME)?.map((i: {name:string}) => i.name));
      } catch { /* ignore */ }
    }, [rive]);

    // ── Wake-up: fire the trigger ─────────────────────────────────────────────
    const wakeUp = useCallback(() => {
      if (isFiringRef.current) return; // already animating
      if (!trigger) return;

      isFiringRef.current = true;
      trigger.fire();

      // Re-arm after 3 seconds (enough time for hello anim + return to sleep)
      setTimeout(() => { isFiringRef.current = false; }, 3000);
    }, [trigger]);

    const handleTap = useCallback(() => {
      onTap?.();
      wakeUp();
    }, [onTap, wakeUp]);

    // Expose play() so parent "Tap me to play" button works
    useImperativeHandle(ref, () => ({ play: wakeUp }), [wakeUp]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
      <div
        className="w-full h-full cursor-pointer select-none"
        onClick={handleTap}
        role="button"
        aria-label="Tap to wake up the mascot"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleTap();
        }}
      >
        {/* Canvas fills the glass card from HomePage — artboard is transparent */}
        <RiveComponent
          style={{
            position : "absolute",
            inset    : 0,
            width    : "100%",
            height   : "100%",
            display  : "block",
          }}
        />
      </div>
    );
  }
);

HomeMascot.displayName = "HomeMascot";
export default HomeMascot;
