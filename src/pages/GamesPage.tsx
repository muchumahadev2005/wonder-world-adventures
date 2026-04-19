import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import NavBar from "@/components/NavBar";
import SceneBackground from "@/components/SceneBackground";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
import PremiumBadge from "@/components/PremiumBadge";
import StarBurst from "@/components/StarBurst";
import gamesBg from "@/assets/games-bg.jpg";
import {
  Gamepad2,
  Star,
  Lock,
  Calculator,
  Shapes,
  Puzzle,
  Brain,
  Zap,
} from "lucide-react";

const games = [
  {
    id: "math-add",
    title: "Addition Fun",
    icon: Calculator,
    color: "from-sky to-lavender",
    stars: 3,
    premium: false,
  },
  {
    id: "math-sub",
    title: "Subtraction",
    icon: Calculator,
    color: "from-mint to-sky",
    stars: 3,
    premium: false,
  },
  {
    id: "shapes",
    title: "Shape Match",
    icon: Shapes,
    color: "from-coral to-sunshine",
    stars: 5,
    premium: false,
  },
  {
    id: "patterns",
    title: "Patterns",
    icon: Puzzle,
    color: "from-bubblegum to-lavender",
    stars: 5,
    premium: true,
  },
  {
    id: "memory",
    title: "Memory Game",
    icon: Brain,
    color: "from-sunshine to-coral",
    stars: 4,
    premium: false,
  },
  {
    id: "speed-math",
    title: "Speed Math",
    icon: Zap,
    color: "from-lavender to-bubblegum",
    stars: 8,
    premium: true,
  },
];

const MathGame = ({
  onComplete,
  type,
}: {
  onComplete: (stars: number) => void;
  type: "add" | "sub";
}) => {
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState(0);
  const [a, setA] = useState(() => Math.floor(Math.random() * 10) + 1);
  const [b, setB] = useState(
    () => Math.floor(Math.random() * (type === "sub" ? 5 : 10)) + 1,
  );
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const totalQuestions = 5;

  const correct = type === "add" ? a + b : a + b; // ensure a+b for sub means (a+b) - b = a
  const displayA = type === "sub" ? a + b : a;
  const displayOp = type === "sub" ? "−" : "+";
  const displayB = b;
  const correctAnswer = type === "sub" ? a : a + b;

  const nextQuestion = useCallback(() => {
    if (question + 1 >= totalQuestions) {
      onComplete(score + (feedback === "correct" ? 1 : 0));
      return;
    }
    setQuestion((q) => q + 1);
    setA(Math.floor(Math.random() * 10) + 1);
    setB(Math.floor(Math.random() * (type === "sub" ? 5 : 10)) + 1);
    setAnswer("");
    setFeedback(null);
  }, [question, score, feedback, onComplete, type]);

  const checkAnswer = () => {
    if (parseInt(answer) === correctAnswer) {
      setFeedback("correct");
      setScore((s) => s + 1);
    } else {
      setFeedback("wrong");
    }
    setTimeout(nextQuestion, 1000);
  };

  return (
    <motion.div
      className="glass-card-strong p-5 sm:p-8 max-w-sm mx-auto text-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground font-bold">
          Question {question + 1}/{totalQuestions}
        </span>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-star fill-star" />
          <span className="font-bold">{score}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-lavender rounded-full"
          animate={{ width: `${((question + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
            <span className="glass-card px-3 sm:px-5 py-2.5 sm:py-3 text-2xl sm:text-3xl font-display font-bold">
              {displayA}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-primary">
              {displayOp}
            </span>
            <span className="glass-card px-3 sm:px-5 py-2.5 sm:py-3 text-2xl sm:text-3xl font-display font-bold">
              {displayB}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-primary">
              =
            </span>
          </div>

          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && answer && checkAnswer()}
            placeholder="?"
            className="w-20 sm:w-24 px-4 py-3 rounded-2xl border-2 border-primary/20 bg-card text-foreground text-center text-xl sm:text-2xl font-bold focus:outline-none focus:border-primary transition-colors mx-auto block"
            autoFocus
          />

          {feedback && (
            <motion.p
              className={`mt-3 font-bold text-lg ${feedback === "correct" ? "text-mint" : "text-destructive"}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {feedback === "correct"
                ? "✅ Correct!"
                : `❌ It was ${correctAnswer}`}
            </motion.p>
          )}

          {!feedback && answer && (
            <motion.button
              onClick={checkAnswer}
              className="glossy-btn mt-4 px-8 py-2 text-primary-foreground font-bold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Check!
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

const GamesPage = () => {
  const { profile, addStars, completeGame } = useChild();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showStarBurst, setShowStarBurst] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const handleGameComplete = (gameId: string, score: number) => {
    const game = games.find((g) => g.id === gameId);
    if (!game) return;
    const stars = Math.ceil((score / 5) * game.stars);
    setEarnedStars(stars);
    addStars(stars);
    completeGame(gameId);
    setShowStarBurst(true);
    setTimeout(() => {
      setShowStarBurst(false);
      setActiveGame(null);
    }, 2500);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SceneBackground image={gamesBg} alt="Magical treehouse playground village" variant="playground" />
      <NavBar />
      <AmbientSoundToggle />
      <StarBurst show={showStarBurst} count={earnedStars} />

      <div className="page-shell max-w-5xl">
        <motion.div
          className="page-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="page-heading flex items-center justify-center gap-2 sm:gap-3">
            <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" /> Games
            Zone
          </h1>
          <p className="text-muted-foreground mt-1">
            Play games and earn stars! ⭐
          </p>
        </motion.div>

        {activeGame ? (
          <div>
            <motion.button
              onClick={() => setActiveGame(null)}
              className="mb-4 text-primary font-bold text-sm hover:underline"
              whileHover={{ x: -3 }}
            >
              ← Back to Games
            </motion.button>
            {(activeGame === "math-add" || activeGame === "math-sub") && (
              <MathGame
                type={activeGame === "math-add" ? "add" : "sub"}
                onComplete={(score) => handleGameComplete(activeGame, score)}
              />
            )}
            {!["math-add", "math-sub"].includes(activeGame) && (
              <div className="glass-card-strong p-8 sm:p-12 text-center max-w-sm mx-auto">
                <p className="font-display text-xl font-bold text-muted-foreground">
                  🚧 Coming Soon!
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  This game is being built!
                </p>
              </div>
            )}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            {games.map((game) => {
              const completed = profile?.completedGames.includes(game.id);
              const locked = game.premium && !profile?.isPremium;
              return (
                <motion.button
                  key={game.id}
                  variants={{
                    hidden: { y: 30, opacity: 0 },
                    show: { y: 0, opacity: 1 },
                  }}
                  onClick={() => !locked && setActiveGame(game.id)}
                  className={`glass-card-strong p-5 sm:p-6 text-center relative group ${locked ? "opacity-70" : ""}`}
                  whileHover={locked ? {} : { scale: 1.05, y: -5 }}
                  whileTap={locked ? {} : { scale: 0.95 }}
                >
                  {game.premium && (
                    <div className="absolute top-3 right-3">
                      <PremiumBadge />
                    </div>
                  )}
                  {locked && (
                    <div className="absolute inset-0 rounded-3xl bg-card/50 backdrop-blur-sm flex items-center justify-center z-10">
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {completed && (
                    <div className="absolute top-3 left-3">
                      <span className="text-sm">✅</span>
                    </div>
                  )}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}
                  >
                    <game.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    {game.title}
                  </h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-star fill-star" />
                    <span className="text-xs text-muted-foreground font-bold">
                      {game.stars} stars
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GamesPage;
