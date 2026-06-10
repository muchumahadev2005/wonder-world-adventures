import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import { useAuth } from "@/context/AuthContext";
import NavBar from "@/components/NavBar";
import SceneBackground from "@/components/SceneBackground";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
import PremiumBadge from "@/components/PremiumBadge";
import StarBurst from "@/components/StarBurst";
import { contentApi, ApiGame } from "@/lib/api";
import SubscribeModal from "@/components/SubscribeModal";
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

type GameItem = {
  id: string;
  title: string;
  icon: typeof Gamepad2;
  color: string;
  stars: number;
  premium: boolean;
};

const games: GameItem[] = [
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

const gameIconMap = {
  calculator: Calculator,
  shapes: Shapes,
  puzzle: Puzzle,
  brain: Brain,
  zap: Zap,
};

const normalizeApiGame = (game: ApiGame) => ({
  id: game.id || game.slug || "",
  title: game.title,
  icon: gameIconMap[(game.icon || "").toLowerCase() as keyof typeof gameIconMap] || Gamepad2,
  color: game.color || "from-sky to-lavender",
  stars: game.starsReward ?? game.stars ?? 3,
  premium: Boolean(game.isPremium ?? game.premium),
});

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
      className="relative p-6 sm:p-10 max-w-sm mx-auto text-center rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-2xl"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
        boxShadow: "0 20px 50px -10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
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
            <span className="rounded-2xl border border-white/40 bg-white/10 px-3 sm:px-5 py-2.5 sm:py-3 text-2xl sm:text-3xl font-display font-bold text-white shadow-lg backdrop-blur-md">
              {displayA}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
              {displayOp}
            </span>
            <span className="rounded-2xl border border-white/40 bg-white/10 px-3 sm:px-5 py-2.5 sm:py-3 text-2xl sm:text-3xl font-display font-bold text-white shadow-lg backdrop-blur-md">
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
  const { profile, addStars, addXP, addCoins, completeGame, setPremium } = useChild();
  const { token } = useAuth();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showStarBurst, setShowStarBurst] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const [apiGames, setApiGames] = useState<GameItem[]>(games);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    contentApi
      .listGames()
      .then(({ games }) => {
        if (mounted && games.length) setApiGames(games.map(normalizeApiGame));
      })
      .catch(() => {
        if (mounted) setApiGames(games);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleGameComplete = (gameId: string, score: number) => {
    const game = apiGames.find((g) => g.id === gameId);
    if (!game) return;
    const stars = Math.ceil((score / 5) * game.stars);
    setEarnedStars(stars);
    addStars(stars);
    addXP(stars * 10);
    addCoins(stars * 3);
    completeGame(gameId);
    contentApi.updateProgress({
      contentType: "GAME",
      contentId: gameId,
      progressPercentage: 100,
      isCompleted: true,
      score,
    }, token).catch(() => undefined);
    contentApi.claimReward({
      stars,
      coins: stars * 3,
      xp: stars * 10,
      reason: `Completed game: ${game.title}`,
      sourceType: "GAME",
      sourceId: gameId,
    }, token).catch(() => undefined);
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
      <StarBurst show={showStarBurst} count={earnedStars} />

      <SubscribeModal
        open={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        onSuccess={() => setPremium(true)}
      />

      <div className="page-shell max-w-5xl">
        <motion.div
          className="page-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="page-heading flex items-center justify-center gap-2 sm:gap-3">
            <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" /> Play with Words
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
              <div 
                className="p-8 sm:p-12 text-center max-w-sm mx-auto rounded-[32px] border border-white/40 backdrop-blur-2xl shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
                }}
              >
                <p className="font-display text-xl font-extrabold text-white drop-shadow-md">
                  🚧 Coming Soon!
                </p>
                <p className="text-white/80 text-sm mt-2 font-bold drop-shadow-sm">
                  This game is being built!
                </p>
              </div>
            )}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            {apiGames.map((game) => {
              const completed = profile?.completedGames.includes(game.id);
              const locked = game.premium && !profile?.isPremium;
              return (
                <motion.button
                  key={game.id}
                  variants={{
                    hidden: { y: 30, opacity: 0 },
                    show: { y: 0, opacity: 1 },
                  }}
                  onClick={() => {
                    if (locked) {
                      setShowSubscribeModal(true);
                    } else {
                      setActiveGame(game.id);
                    }
                  }}
                  className={`relative p-5 sm:p-6 text-center rounded-3xl border border-white/50 shadow-xl backdrop-blur-2xl transition-all overflow-hidden ${locked ? "opacity-70" : ""}`}
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)`,
                    boxShadow: `0 12px 35px -10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)`,
                  }}
                  whileHover={locked ? { scale: 1.02 } : {
                    scale: 1.05,
                    y: -5,
                    background: `linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)`,
                  }}
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
                  <h3 className="font-display text-base font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    {game.title}
                  </h3>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300 drop-shadow-sm" />
                    <span className="text-xs text-white/90 font-bold drop-shadow-sm">
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
