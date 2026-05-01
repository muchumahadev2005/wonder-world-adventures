import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import NavBar from "@/components/NavBar";
import SceneBackground from "@/components/SceneBackground";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
import QuizScreen, { QuizQuestion } from "@/components/QuizScreen";
import RewardPopup from "@/components/RewardPopup";
import VoiceInteraction from "@/components/VoiceInteraction";
import storiesBg from "@/assets/stories-bg.jpg";
import { Star, Lock, ChevronRight, Mic, Volume2, CheckCircle } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  emoji: string;
  color: string;
  words: { word: string; emoji: string; desc: string }[];
  quiz: QuizQuestion[];
  nextId?: string;
}

const lessons: Lesson[] = [
  {
    id: "fruits",
    title: "Fruits",
    emoji: "🍎",
    color: "from-red-400 to-orange-400",
    nextId: "animals",
    words: [
      { word: "Apple", emoji: "🍎", desc: "A red or green crunchy fruit" },
      { word: "Banana", emoji: "🍌", desc: "A yellow curved fruit" },
      { word: "Mango", emoji: "🥭", desc: "Sweet tropical orange fruit" },
      { word: "Grapes", emoji: "🍇", desc: "Small purple or green clusters" },
    ],
    quiz: [
      { type: "mcq", question: "Which fruit is yellow and curved?", emoji: "🤔", options: ["Apple", "Banana", "Mango", "Grapes"], answer: "Banana" },
      { type: "mcq", question: "What color is an apple?", emoji: "🍎", options: ["Blue", "Green", "Yellow", "Purple"], answer: "Green", hint: "It can also be red!" },
      { type: "fill", question: "Complete the word: Man___", emoji: "🥭", answer: "Mango", hint: "It's a tropical fruit" },
      { type: "mcq", question: "Which comes in clusters?", emoji: "🍇", options: ["Apple", "Banana", "Mango", "Grapes"], answer: "Grapes" },
    ],
  },
  {
    id: "animals",
    title: "Animals",
    emoji: "🦁",
    color: "from-amber-400 to-yellow-500",
    nextId: "numbers",
    words: [
      { word: "Lion", emoji: "🦁", desc: "King of the jungle" },
      { word: "Elephant", emoji: "🐘", desc: "The biggest land animal" },
      { word: "Rabbit", emoji: "🐰", desc: "A cute bunny with long ears" },
      { word: "Dolphin", emoji: "🐬", desc: "Smart ocean swimmer" },
    ],
    quiz: [
      { type: "mcq", question: "Which is the biggest land animal?", emoji: "🤔", options: ["Lion", "Elephant", "Rabbit", "Dolphin"], answer: "Elephant" },
      { type: "fill", question: "Type the animal with long ears:", emoji: "🐰", answer: "Rabbit" },
      { type: "mcq", question: "Which animal swims in the ocean?", emoji: "🌊", options: ["Lion", "Elephant", "Rabbit", "Dolphin"], answer: "Dolphin" },
      { type: "mcq", question: "Who is the King of the Jungle?", emoji: "🦁", options: ["Lion", "Elephant", "Dolphin", "Rabbit"], answer: "Lion" },
    ],
  },
  {
    id: "numbers",
    title: "Numbers 1-10",
    emoji: "🔢",
    color: "from-blue-400 to-cyan-400",
    nextId: "abc",
    words: [
      { word: "One", emoji: "1️⃣", desc: "The first number" },
      { word: "Three", emoji: "3️⃣", desc: "After two, before four" },
      { word: "Seven", emoji: "7️⃣", desc: "Lucky number seven!" },
      { word: "Ten", emoji: "🔟", desc: "The last single digit number" },
    ],
    quiz: [
      { type: "mcq", question: "Which number comes after 9?", emoji: "🔢", options: ["Eight", "Eleven", "Ten", "Six"], answer: "Ten" },
      { type: "fill", question: "Write the number after six:", emoji: "7️⃣", answer: "Seven" },
      { type: "mcq", question: "What is 3 + 4?", emoji: "➕", options: ["Six", "Eight", "Seven", "Five"], answer: "Seven" },
      { type: "mcq", question: "Which is the first number?", emoji: "1️⃣", options: ["Two", "One", "Three", "Zero"], answer: "One" },
    ],
  },
  {
    id: "abc",
    title: "ABC Letters",
    emoji: "🔤",
    color: "from-purple-400 to-pink-400",
    words: [
      { word: "Apple starts with A", emoji: "🍎", desc: "A is the first letter" },
      { word: "Ball starts with B", emoji: "⚽", desc: "B is the second letter" },
      { word: "Cat starts with C", emoji: "🐱", desc: "C is the third letter" },
      { word: "Dog starts with D", emoji: "🐶", desc: "D is the fourth letter" },
    ],
    quiz: [
      { type: "mcq", question: "Which letter does 'Apple' start with?", emoji: "🍎", options: ["B", "C", "A", "D"], answer: "A" },
      { type: "fill", question: "Dog starts with the letter:", emoji: "🐶", answer: "D" },
      { type: "mcq", question: "Which letter does 'Cat' start with?", emoji: "🐱", options: ["A", "B", "C", "D"], answer: "C" },
      { type: "mcq", question: "Ball starts with which letter?", emoji: "⚽", options: ["B", "A", "C", "D"], answer: "B" },
    ],
  },
];

type Screen = "list" | "topic" | "quiz";

const LearnPage = () => {
  const { profile, addStars, addXP, addCoins, incrementStreak, completeLesson } = useChild();
  const [screen, setScreen] = useState<Screen>("list");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [showVoice, setShowVoice] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState({ stars: 0, xp: 0, coins: 0 });

  const isUnlocked = (id: string) =>
    id === "fruits" || (profile?.unlockedLessons ?? []).includes(id);

  const isCompleted = (id: string) =>
    (profile?.completedLessons ?? []).includes(id);

  const openLesson = (lesson: Lesson) => {
    if (!isUnlocked(lesson.id)) return;
    setActiveLesson(lesson);
    setWordIndex(0);
    setScreen("topic");
  };

  const handleQuizComplete = (stars: number) => {
    if (!activeLesson) return;
    const xpGained = stars * 15;
    const coinsGained = stars * 5;
    addStars(stars);
    addXP(xpGained);
    addCoins(coinsGained);
    incrementStreak();
    completeLesson(activeLesson.id, activeLesson.nextId);
    setRewardData({ stars, xp: xpGained, coins: coinsGained });
    setShowReward(true);
    setScreen("list");
    setActiveLesson(null);
  };

  const currentWord = activeLesson?.words[wordIndex];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SceneBackground image={storiesBg} alt="Enchanted learning library" variant="library" />
      <NavBar />
      <AmbientSoundToggle />

      <RewardPopup
        show={showReward}
        stars={rewardData.stars}
        xp={rewardData.xp}
        coins={rewardData.coins}
        message="Lesson Complete! 🎓"
        onClose={() => setShowReward(false)}
      />

      <AnimatePresence>
        {showVoice && currentWord && (
          <VoiceInteraction word={currentWord.word.split(" ")[0]} onClose={() => setShowVoice(false)} />
        )}
      </AnimatePresence>

      <div className="page-shell max-w-2xl">
        <motion.div
          className="page-header"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="page-heading flex items-center justify-center gap-2 sm:gap-3">
            🎓 Learn
          </h1>
          <p className="text-muted-foreground mt-1">Master lessons and level up! 🚀</p>
        </motion.div>

        {/* XP Level bar */}
        {profile && (
          <motion.div
            className="mb-6 p-4 rounded-2xl border border-white/30 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.1)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-sm">Level {profile.level}</span>
              <span className="text-white/70 text-xs">{profile.xp} / {profile.level * 100} XP</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                animate={{ width: `${Math.min(100, (profile.xp % 100))}%` }}
                transition={{ type: "spring", stiffness: 80 }}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-white/70">
              <span>⭐ {profile.stars} stars</span>
              <span>🪙 {profile.coins} coins</span>
              <span>🔥 {profile.streak} day streak</span>
            </div>
          </motion.div>
        )}

        {/* SCREEN: LESSON LIST */}
        {screen === "list" && (
          <motion.div
            className="space-y-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            {lessons.map((lesson, i) => {
              const unlocked = isUnlocked(lesson.id);
              const completed = isCompleted(lesson.id);
              return (
                <motion.button
                  key={lesson.id}
                  variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                  onClick={() => openLesson(lesson)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                    unlocked ? "border-white/40 hover:border-white/60" : "border-white/20 opacity-60 cursor-not-allowed"
                  }`}
                  style={{
                    background: unlocked
                      ? "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 100%)"
                      : "rgba(0,0,0,0.2)",
                    backdropFilter: "blur(16px)",
                  }}
                  whileHover={unlocked ? { scale: 1.02, x: 4 } : {}}
                  whileTap={unlocked ? { scale: 0.98 } : {}}
                >
                  {/* Connector line */}
                  {i < lessons.length - 1 && (
                    <div className="absolute left-8 -bottom-3 w-0.5 h-3 bg-white/20 hidden" />
                  )}

                  {/* Emoji badge */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br ${lesson.color} shadow-lg ${!unlocked ? "grayscale" : ""}`}
                  >
                    {!unlocked ? <Lock className="w-6 h-6 text-white" /> : lesson.emoji}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-display text-base font-extrabold text-white drop-shadow-md">
                      {lesson.title}
                    </h3>
                    <p className="text-white/60 text-xs mt-0.5">
                      {lesson.words.length} words • {lesson.quiz.length} quiz questions
                    </p>
                    {completed && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400 text-xs font-bold">Completed!</span>
                      </div>
                    )}
                    {!unlocked && (
                      <p className="text-white/40 text-xs mt-0.5">Complete previous lesson to unlock</p>
                    )}
                  </div>

                  {unlocked && (
                    <ChevronRight className="w-5 h-5 text-white/60 flex-shrink-0" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* SCREEN: TOPIC (word learning) */}
        {screen === "topic" && activeLesson && (
          <motion.div
            className="max-w-sm mx-auto"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => setScreen("list")}
              className="text-primary font-bold text-sm hover:underline mb-4 block"
            >
              ← Back to Lessons
            </button>

            <div
              className="p-6 sm:p-8 rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-2xl text-center"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)" }}
            >
              {/* Progress */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                    animate={{ width: `${((wordIndex + 1) / activeLesson.words.length) * 100}%` }}
                  />
                </div>
                <span className="text-white/70 text-xs font-bold">{wordIndex + 1}/{activeLesson.words.length}</span>
              </div>

              <h2 className="font-display text-xl font-extrabold text-white drop-shadow-md mb-4">
                {activeLesson.title}
              </h2>

              <AnimatePresence mode="wait">
                <motion.div
                  key={wordIndex}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                >
                  <div className="text-7xl mb-3">{currentWord?.emoji}</div>
                  <h3 className="font-display text-2xl font-extrabold text-white drop-shadow-lg mb-1">
                    {currentWord?.word}
                  </h3>
                  <p className="text-white/70 text-sm">{currentWord?.desc}</p>
                </motion.div>
              </AnimatePresence>

              {/* Voice button */}
              <div className="flex items-center justify-center gap-3 mt-6 mb-6">
                <motion.button
                  onClick={() => setShowVoice(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-white border border-white/30"
                  style={{ background: "linear-gradient(135deg, rgba(130,60,220,0.7), rgba(200,80,180,0.7))" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mic className="w-4 h-4" /> Repeat after me
                </motion.button>
                <motion.button
                  onClick={() => setShowVoice(true)}
                  className="p-2.5 rounded-2xl border border-white/30 bg-white/10 text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Volume2 className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 justify-between">
                <button
                  onClick={() => setWordIndex(i => Math.max(0, i - 1))}
                  disabled={wordIndex === 0}
                  className="px-5 py-2.5 rounded-2xl font-bold text-white border border-white/30 bg-white/10 disabled:opacity-30"
                >
                  ← Back
                </button>

                {wordIndex < activeLesson.words.length - 1 ? (
                  <motion.button
                    onClick={() => setWordIndex(i => i + 1)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl font-display font-bold text-amber-950"
                    style={{ background: "linear-gradient(135deg, #FFE0A3 0%, #E89A4A 100%)" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => setScreen("quiz")}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl font-display font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, rgba(80,200,80,0.7), rgba(40,160,100,0.7))",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" /> Take Quiz!
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* SCREEN: QUIZ */}
        {screen === "quiz" && activeLesson && (
          <QuizScreen
            questions={activeLesson.quiz}
            onComplete={handleQuizComplete}
            onBack={() => setScreen("topic")}
          />
        )}
      </div>
    </div>
  );
};

export default LearnPage;
