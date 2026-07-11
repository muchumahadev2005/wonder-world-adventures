import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import { useAuth } from "@/context/AuthContext";
import NavBar from "@/components/NavBar";
import SceneBackground from "@/components/SceneBackground";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
import QuizScreen, { QuizQuestion } from "@/components/QuizScreen";
import RewardPopup from "@/components/RewardPopup";
import StarBurst from "@/components/StarBurst";
import PremiumBadge from "@/components/PremiumBadge";
import { contentApi, ApiStory } from "@/lib/api";
import SubscribeModal from "@/components/SubscribeModal";
import storiesBg from "@/assets/stories-bg.jpg";
import {
  ArrowLeft, Heart, Headphones, BookOpen, Play, Pause,
  SkipBack, SkipForward, Star, Lock, ChevronRight, BookMarked
} from "lucide-react";

type StoryItem = {
  id: string;
  title: string;
  author: string;
  tags: string[];
  coverEmoji: string;
  coverGradient: string;
  duration: string;
  description: string;
  premium: boolean;
  stars: number;
  pages: string[];
  quiz: QuizQuestion[];
};

const stories: StoryItem[] = [];

const normalizeApiStory = (story: ApiStory): StoryItem => {
  const pages = Array.isArray(story.pages)
    ? story.pages.filter((page): page is string => typeof page === "string")
    : story.description
    ? [story.description]
    : ["This story is ready to read."];
  const quiz = story.quiz || story.quizzes?.[0]?.questions || [];
  return {
    id: story.id,
    title: story.title,
    author: story.author || "Wonder World",
    tags: story.tags || [],
    coverEmoji: story.coverEmoji || "\u{1F4DA}\u2728",
    coverGradient: story.coverGradient || "linear-gradient(160deg, #2E2270 0%, #5B3FA6 55%, #9D6FE0 100%)",
    duration: story.duration || "8 min",
    description: story.description || pages[0],
    premium: Boolean(story.isPremium ?? story.premium),
    stars: story.starsReward ?? story.stars ?? 2,
    pages,
    quiz: quiz as QuizQuestion[],
  };
};

type Screen = "list" | "detail" | "read" | "quiz";

const AudioPlayer = ({ duration, onFinish }: { duration: string; onFinish: () => void }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(intervalRef.current!);
            setPlaying(false);
            onFinish();
            return 100;
          }
          return p + 0.5;
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, onFinish]);

  const elapsed = Math.floor((progress / 100) * 12 * 60);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
      {/* Progress bar */}
      <div className="mb-3">
        <div
          className="w-full h-1 rounded-full mb-1 cursor-pointer"
          style={{ background: "rgba(255,255,255,0.15)" }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            setProgress(Math.max(0, Math.min(100, pct)));
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #7c5cbf, #a78bfa)", width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          <span>{mins}:{secs.toString().padStart(2, "0")}</span>
          <span>{duration}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <motion.button
          onClick={() => setProgress(0)}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <SkipBack className="w-5 h-5 text-white/70" />
        </motion.button>

        <motion.button
          onClick={() => setPlaying(p => !p)}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #7c5cbf, #a78bfa)", boxShadow: "0 8px 25px rgba(124,92,191,0.5)" }}
        >
          {playing
            ? <Pause className="w-6 h-6 text-white" />
            : <Play className="w-6 h-6 text-white ml-1" />
          }
        </motion.button>

        <motion.button
          onClick={() => { setProgress(100); setPlaying(false); onFinish(); }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <SkipForward className="w-5 h-5 text-white/70" />
        </motion.button>
      </div>
    </div>
  );
};

const StoriesPage = () => {
  const { profile, addStars, addXP, addCoins, incrementStreak, completeStory, setPremium } = useChild();
  const { token } = useAuth();
  const [screen, setScreen] = useState<Screen>("list");
  const [apiStories, setApiStories] = useState<StoryItem[]>(stories);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [tab, setTab] = useState<"audio" | "read">("audio");
  const [readPage, setReadPage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showStarBurst, setShowStarBurst] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState({ stars: 0, xp: 0, coins: 0 });
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    contentApi
      .listStories()
      .then(({ stories }) => {
        if (mounted && stories.length) setApiStories(stories.map(normalizeApiStory));
      })
      .catch(() => {
        if (mounted) setApiStories(stories);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const openStory = (story: StoryItem) => {
    if (story.premium && !profile?.isPremium) {
      setShowSubscribeModal(true);
      return;
    }
    setActiveStory(story);
    setTab("audio");
    setReadPage(0);
    setScreen("detail");
  };

  const goToQuiz = () => setScreen("quiz");

  const handleQuizComplete = (stars: number) => {
    if (!activeStory) return;
    const xp = stars * 20;
    const coins = stars * 8;
    if (!profile?.completedStories.includes(activeStory.id)) {
      addStars(activeStory.stars + stars);
      addXP(xp);
      addCoins(coins);
      incrementStreak();
      completeStory(activeStory.id);
      contentApi.updateProgress({
        contentType: "STORY",
        contentId: activeStory.id,
        progressPercentage: 100,
        isCompleted: true,
      }, token).catch(() => undefined);
      contentApi.claimReward({
        stars: activeStory.stars + stars,
        coins,
        xp,
        reason: `Completed story: ${activeStory.title}`,
        sourceType: "STORY",
        sourceId: activeStory.id,
      }, token).catch(() => undefined);
      setEarnedStars(activeStory.stars + stars);
      setRewardData({ stars: activeStory.stars + stars, xp, coins });
      setShowStarBurst(true);
      setTimeout(() => setShowStarBurst(false), 2500);
    }
    setShowReward(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SceneBackground image={storiesBg} alt="Enchanted moonlit library" variant="library" />
      <NavBar />
      <AmbientSoundToggle />
      <StarBurst show={showStarBurst} count={earnedStars} />

      <SubscribeModal
        open={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        onSuccess={() => setPremium(true)}
      />

      <RewardPopup
        show={showReward}
        stars={rewardData.stars}
        xp={rewardData.xp}
        coins={rewardData.coins}
        message="Story Complete! 📚"
        onClose={() => { setShowReward(false); setScreen("list"); setActiveStory(null); }}
      />

      {/* ── STORY LIST ── */}
      <AnimatePresence mode="wait">
        {screen === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-28">
            {/* Header */}
            <div className="px-5 pt-20 pb-4">
              <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2 drop-shadow-md">
                <BookMarked className="w-6 h-6 text-amber-300" /> Stories
              </h1>
              <p className="text-white/70 text-sm mt-1">Read, listen &amp; earn stars ⭐</p>
            </div>

            <div className="px-4 grid grid-cols-2 gap-4">
              {apiStories.map((story, i) => {
                const locked = story.premium && !profile?.isPremium;
                const completed = profile?.completedStories.includes(story.id);
                return (
                  <motion.button
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => openStory(story)}
                    className="relative rounded-3xl overflow-hidden text-left"
                    style={{ background: story.coverGradient, minHeight: 200 }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {/* Cover emoji */}
                    <div className="p-4 text-4xl">{story.coverEmoji}</div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3"
                      style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)" }}>
                      <h3 className="font-display text-sm font-bold text-white leading-tight">{story.title}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                        <span className="text-amber-300 text-xs font-bold">{story.stars}</span>
                        <span className="text-white/40 text-xs ml-1">· {story.duration}</span>
                      </div>
                    </div>

                    {/* Badges */}
                    {story.premium && <div className="absolute top-2 right-2"><PremiumBadge /></div>}
                    {completed && <div className="absolute top-2 left-2 text-sm">✅</div>}
                    {locked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-3xl">
                        <Lock className="w-8 h-8 text-white/60" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── STORY DETAIL ── */}
        {screen === "detail" && activeStory && (
          <motion.div key="detail" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="absolute inset-0 z-50 pb-28 overflow-y-auto"
            style={{ background: "linear-gradient(180deg, #0d0720 0%, #1a0f3a 50%, #0d0720 100%)" }}
          >
            {/* Cover hero */}
            <div className="relative h-72 overflow-hidden" style={{ background: activeStory.coverGradient }}>
              {/* Firefly particles */}
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-amber-200"
                  style={{ left: `${(i * 37) % 90 + 5}%`, top: `${(i * 23) % 85 + 5}%` }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
                  transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
                />
              ))}

              {/* Cover art */}
              <div className="absolute inset-0 flex items-center justify-center text-8xl">
                {activeStory.coverEmoji}
              </div>

              {/* Gradient overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(13,7,32,0.95) 0%, transparent 60%)" }} />

              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-10">
                <motion.button onClick={() => setScreen("list")} whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
                  <ArrowLeft className="w-5 h-5 text-white" />
                </motion.button>
                <motion.button onClick={() => setLiked(l => !l)} whileTap={{ scale: 0.85 }}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
                  <Heart className={`w-5 h-5 ${liked ? "text-red-400 fill-red-400" : "text-white"}`} />
                </motion.button>
              </div>

              {/* Title area */}
              <div className="absolute bottom-4 left-5 right-5">
                <h2 className="font-display text-2xl font-extrabold text-white drop-shadow-lg">{activeStory.title}</h2>
                <p className="text-white/50 text-sm">by {activeStory.author}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {activeStory.tags.map(tag => (
                    <span key={tag} className="px-3 py-0.5 rounded-full text-xs font-bold text-white/70"
                      style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pt-5 space-y-4">
              {/* Audio / Read tabs */}
              <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)" }}>
                {(["audio", "read"] as const).map(t => (
                  <motion.button key={t} onClick={() => setTab(t)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors"
                    style={tab === t
                      ? { background: "linear-gradient(135deg,#7c5cbf,#a78bfa)", color: "#fff" }
                      : { color: "rgba(255,255,255,0.4)" }}
                    whileTap={{ scale: 0.97 }}>
                    {t === "audio" ? <Headphones className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                    {t === "audio" ? "Audio" : "Read"}
                  </motion.button>
                ))}
              </div>

              {/* Audio tab */}
              {tab === "audio" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <AudioPlayer duration={activeStory.duration} onFinish={goToQuiz} />
                  <motion.button onClick={goToQuiz}
                    className="mt-4 w-full py-3.5 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#7c5cbf,#a78bfa)", boxShadow: "0 8px 25px rgba(124,92,191,0.4)" }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Star className="w-5 h-5 text-amber-300 fill-amber-300" /> Start Quiz!
                  </motion.button>
                </motion.div>
              )}

              {/* Read tab */}
              {tab === "read" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-5 space-y-4"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {/* Read progress */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg,#7c5cbf,#a78bfa)" }}
                        animate={{ width: `${((readPage + 1) / activeStory.pages.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-white/40">{readPage + 1}/{activeStory.pages.length}</span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.p key={readPage}
                      className="text-white/80 leading-relaxed text-base font-body min-h-[120px]"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      {activeStory.pages[readPage]}
                    </motion.p>
                  </AnimatePresence>

                  <div className="flex gap-3">
                    <button onClick={() => setReadPage(p => Math.max(0, p - 1))} disabled={readPage === 0}
                      className="flex-1 py-2.5 rounded-xl font-bold text-white/60 disabled:opacity-30"
                      style={{ background: "rgba(255,255,255,0.08)" }}>
                      ← Back
                    </button>
                    {readPage < activeStory.pages.length - 1 ? (
                      <motion.button onClick={() => setReadPage(p => p + 1)} whileTap={{ scale: 0.96 }}
                        className="flex-1 py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-1"
                        style={{ background: "linear-gradient(135deg,#7c5cbf,#a78bfa)" }}>
                        Next <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button onClick={goToQuiz}
                        className="flex-1 py-2.5 rounded-xl font-display font-bold text-white flex items-center justify-center gap-1"
                        style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}
                        animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                        whileTap={{ scale: 0.96 }}>
                        <Star className="w-4 h-4 fill-white" /> Take Quiz!
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* About */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-white font-bold mb-2">About this story</h3>
                <p className="text-white/60 text-sm leading-relaxed">{activeStory.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── QUIZ ── */}
        {screen === "quiz" && activeStory && (
          <motion.div key="quiz" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} 
            className="absolute inset-0 z-50 pb-28 px-4 pt-8 overflow-y-auto"
            style={{ background: "linear-gradient(180deg, #0d0720 0%, #1a0f3a 50%, #0d0720 100%)" }}
          >
            {/* Quiz intro banner */}
            <motion.div className="mb-4 p-4 rounded-2xl text-center"
              style={{ background: "linear-gradient(135deg,rgba(124,92,191,0.3),rgba(167,139,250,0.2))", border: "1px solid rgba(124,92,191,0.4)" }}>
              <div className="text-3xl mb-1">📝</div>
              <p className="text-white font-display font-bold">Quiz Time!</p>
              <p className="text-white/60 text-xs mt-0.5">Based on: <span className="text-violet-300">{activeStory.title}</span></p>
            </motion.div>
            <QuizScreen
              questions={activeStory.quiz}
              onComplete={handleQuizComplete}
              onBack={() => setScreen("detail")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoriesPage;
