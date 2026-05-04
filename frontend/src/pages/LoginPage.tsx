import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useChild } from "@/context/ChildContext";
import ForestScene from "@/components/ForestScene";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
import { Sparkles, ArrowRight, Moon, Star } from "lucide-react";

const colorOptions = [
  { name: "Red", value: "#ef4444", bg: "bg-red-400" },
  { name: "Blue", value: "#3b82f6", bg: "bg-blue-400" },
  { name: "Green", value: "#22c55e", bg: "bg-green-400" },
  { name: "Purple", value: "#a855f7", bg: "bg-purple-400" },
  { name: "Pink", value: "#ec4899", bg: "bg-pink-400" },
  { name: "Orange", value: "#f97316", bg: "bg-orange-400" },
  { name: "Yellow", value: "#eab308", bg: "bg-yellow-400" },
];

const LoginPage = () => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [mathAnswer, setMathAnswer] = useState("");
  const [color, setColor] = useState("");
  const [mathA] = useState(() => Math.floor(Math.random() * 5) + 1);
  const [mathB] = useState(() => Math.floor(Math.random() * 5) + 1);
  const [error, setError] = useState("");
  const { setProfile } = useChild();
  const navigate = useNavigate();

  const steps = [
    { title: "What's your name?", subtitle: "Tell us who you are! 🌟" },
    {
      title: "How old are you?",
      subtitle: "We'll find the best stuff for you! 🎂",
    },
    {
      title: `What is ${mathA} + ${mathB}?`,
      subtitle: "Let's see how smart you are! 🧠",
    },
    {
      title: "Pick your favorite color!",
      subtitle: "Choose the one you love most! 🎨",
    },
  ];

  const handleNext = () => {
    setError("");
    if (step === 0 && name.trim().length < 1) {
      setError("Please enter your name!");
      return;
    }
    if (step === 1 && (!age || parseInt(age) < 3 || parseInt(age) > 15)) {
      setError("Enter an age between 3 and 15!");
      return;
    }
    if (step === 2 && parseInt(mathAnswer) !== mathA + mathB) {
      setError("Oops! Try again! 🤔");
      return;
    }
    if (step === 3 && !color) {
      setError("Pick a color!");
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      setProfile({
        name: name.trim(),
        age: parseInt(age),
        favoriteColor: color,
        stars: 0,
        coins: 10,
        xp: 0,
        level: 1,
        streak: 1,
        completedGames: [],
        completedStories: [],
        completedLessons: [],
        unlockedLessons: ['fruits'],
        isPremium: false,
      });
      navigate("/");
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/15 backdrop-blur-md text-white placeholder:text-white/60 text-center text-lg font-bold focus:outline-none focus:border-amber-200 focus:bg-white/25 transition-all shadow-inner";

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Magical forest background */}
      <ForestScene />

      {/* Soft glow halo behind the card */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] max-w-[90vw] h-[520px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,210,140,0.45)_0%,rgba(180,140,220,0.22)_45%,transparent_75%)] blur-3xl pointer-events-none z-0" />

      {/* Centered glassmorphism login card */}
      <motion.div
        className="relative z-10 w-full max-w-[580px] rounded-[28px] sm:rounded-[36px] border border-white/35 backdrop-blur-2xl px-5 sm:px-8 py-7 sm:py-9"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,235,200,0.12) 100%)",
          boxShadow:
            "0 25px 70px -15px rgba(255,180,80,0.4), 0 10px 50px -10px rgba(140,100,200,0.4), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="relative w-full">

        {/* Subtle inner star pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          {Array.from({ length: 14 }).map((_, i) => (
            <Star
              key={i}
              className="absolute text-white/60"
              style={{
                width: 6 + (i % 3) * 3,
                height: 6 + (i % 3) * 3,
                left: `${(i * 41) % 95}%`,
                top: `${(i * 27) % 95}%`,
              }}
              fill="currentColor"
            />
          ))}
        </div>

        {/* Top icon */}
        <div className="relative flex justify-center mb-3">
          <motion.div
            className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_0_25px_rgba(255,210,120,0.8)]"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Moon className="w-7 h-7 text-amber-900" fill="currentColor" />
          </motion.div>
        </div>

        <div className="relative text-center mb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            Welcome Back
          </h1>
          <p className="text-white/80 text-sm mt-1 italic">
            Enter your magical world
          </p>
        </div>

        {/* Progress dots */}
        <div className="relative flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`h-2 rounded-full ${
                i <= step
                  ? "bg-gradient-to-r from-amber-300 to-amber-500 shadow-[0_0_8px_rgba(255,200,100,0.8)]"
                  : "bg-white/30"
              }`}
              animate={{ width: i === step ? 24 : 8 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div className="text-center mb-5">
              <h2 className="font-display text-lg sm:text-xl font-bold text-white drop-shadow-md">
                {steps[step].title}
              </h2>
              <p className="text-white/75 text-sm mt-1">
                {steps[step].subtitle}
              </p>
            </div>

            {step === 0 && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your awesome name..."
                className={inputClass}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                autoFocus
              />
            )}

            {step === 1 && (
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Your age..."
                min={3}
                max={15}
                className={inputClass}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                autoFocus
              />
            )}

            {step === 2 && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 text-white">
                  <span className="px-3 sm:px-4 py-2 text-xl sm:text-2xl font-display font-bold rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md">
                    {mathA}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-amber-200">+</span>
                  <span className="px-3 sm:px-4 py-2 text-xl sm:text-2xl font-display font-bold rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md">
                    {mathB}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-amber-200">=</span>
                  <span className="text-xl sm:text-2xl font-bold text-amber-200">?</span>
                </div>
                <input
                  type="number"
                  value={mathAnswer}
                  onChange={(e) => setMathAnswer(e.target.value)}
                  placeholder="?"
                  className={`${inputClass} w-24 mx-auto text-2xl`}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  autoFocus
                />
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-wrap justify-center gap-3">
                {colorOptions.map((c) => (
                  <motion.button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${c.bg} border-4 transition-all ${
                      color === c.name
                        ? "border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                        : "border-white/30"
                    }`}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p
            className="relative text-amber-200 text-center mt-3 font-bold text-sm drop-shadow"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {error}
          </motion.p>
        )}

        <div className="relative mt-6">
          {/* Sparkles around button */}
          <motion.div
            className="absolute -top-1 -left-1 text-amber-200"
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4], rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
          <motion.div
            className="absolute -top-2 right-2 text-amber-100"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.6 }}
          >
            <Sparkles className="w-3 h-3" />
          </motion.div>

          <motion.button
            onClick={handleNext}
            className="w-full px-6 py-3.5 rounded-2xl font-display text-base sm:text-lg flex items-center justify-center gap-2 text-amber-950 border border-white/50 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #FFE0A3 0%, #FFB870 50%, #E89A4A 100%)",
              boxShadow:
                "0 10px 30px -5px rgba(255,180,90,0.6), inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
            whileHover={{
              scale: 1.03,
              y: -2,
              boxShadow:
                "0 15px 40px -5px rgba(255,200,100,0.8), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
            whileTap={{ scale: 0.97 }}
          >
            {step === 3 ? (
              <>
                <Sparkles className="w-5 h-5" /> Let's Go!
              </>
            ) : (
              <>
                Next <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
