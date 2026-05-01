import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import NavBar from "@/components/NavBar";
import SceneBackground from "@/components/SceneBackground";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
import QuizScreen, { QuizQuestion } from "@/components/QuizScreen";
import RewardPopup from "@/components/RewardPopup";
import StarBurst from "@/components/StarBurst";
import PremiumBadge from "@/components/PremiumBadge";
import storiesBg from "@/assets/stories-bg.jpg";
import {
  ArrowLeft, Heart, Headphones, BookOpen, Play, Pause,
  SkipBack, SkipForward, Star, Lock, ChevronRight, BookMarked
} from "lucide-react";

const stories = [
  {
    id: "enchanted-forest",
    title: "The Enchanted Forest",
    author: "Luna Starlight",
    tags: ["Fantasy", "Fiction", "Mystery"],
    coverEmoji: "🦊🐰🍄",
    coverGradient: "linear-gradient(160deg, #1a1040 0%, #2d1b6e 40%, #3d2080 70%, #1a0f3a 100%)",
    duration: "12 min",
    description: "A magical tale of a fox and rabbit who discover a secret world hidden beneath the mushrooms of an enchanted forest.",
    premium: false,
    stars: 3,
    pages: [
      "Deep in the enchanted forest, where fireflies danced like tiny stars, a clever fox named Finn and a timid rabbit named Rosa became the most unlikely of friends.",
      "One evening, Rosa tripped over a glowing mushroom. To their amazement, a tiny door appeared beneath it! \"Shall we go in?\" whispered Finn, his tail swishing with curiosity.",
      "Inside was a secret world — tiny houses made of acorns, rivers of moonlight, and music that made flowers bloom. The little folk who lived there had never seen visitors before!",
      "\"Please don't tell anyone about us,\" begged the tiny elder. \"This is our safe home.\" Finn and Rosa promised — and from that day on, they were the forest's secret-keepers forever.",
    ],
    quiz: [
      { type: "mcq" as const, question: "What did Rosa trip over?", emoji: "🍄", options: ["A rock", "A glowing mushroom", "A fallen tree", "A flower"], answer: "A glowing mushroom" },
      { type: "mcq" as const, question: "What were the tiny houses made of?", emoji: "🏠", options: ["Wood", "Straw", "Acorns", "Leaves"], answer: "Acorns" },
      { type: "fill" as const, question: "The fox's name was ____", emoji: "🦊", answer: "Finn", hint: "Starts with F!" },
      { type: "mcq" as const, question: "What did Finn and Rosa promise?", emoji: "🤝", options: ["To tell everyone", "To come back daily", "To keep the secret", "To move in"], answer: "To keep the secret" },
    ] as QuizQuestion[],
  },
  {
    id: "moon-rabbit",
    title: "The Moon Rabbit",
    author: "Star Writers",
    tags: ["Adventure", "Space", "Fun"],
    coverEmoji: "🐰🌙🚀",
    coverGradient: "linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    duration: "8 min",
    description: "A brave little rabbit who dreams of visiting the moon builds a rocket from carrots and leaves!",
    premium: false,
    stars: 2,
    pages: [
      'Once upon a time, a little rabbit looked up at the big bright moon. "I want to visit you!" she said.',
      'So she built a rocket from carrots and leaves. "3... 2... 1... Blast off!" she shouted.',
      "When she landed on the moon, she found it was made of cheese! She nibbled happily.",
      'The moon winked at her and said, "Come visit anytime, little friend!" And she did, every night in her dreams.',
    ],
    quiz: [
      { type: "mcq" as const, question: "What did the rabbit want to visit?", emoji: "🐰", options: ["The Sun", "The Moon", "The Sea", "The Forest"], answer: "The Moon" },
      { type: "mcq" as const, question: "What was the rocket made of?", emoji: "🚀", options: ["Metal", "Carrots and leaves", "Wood", "Paper"], answer: "Carrots and leaves" },
      { type: "fill" as const, question: "The moon was made of ______", emoji: "🌙", answer: "cheese", hint: "It's a dairy food!" },
      { type: "mcq" as const, question: "How did the story end?", emoji: "🌟", options: ["Sadly", "Angrily", "Happily", "Quietly"], answer: "Happily" },
    ] as QuizQuestion[],
  },
  {
    id: "brave-star",
    title: "The Brave Little Star",
    author: "Sky Tales",
    tags: ["Inspiration", "Courage", "Night"],
    coverEmoji: "⭐🌌✨",
    coverGradient: "linear-gradient(160deg, #1a0533 0%, #4a1560 50%, #ff6b35 100%)",
    duration: "7 min",
    description: "A tiny star afraid of the dark discovers that she herself is the light the world needs.",
    premium: false,
    stars: 2,
    pages: [
      'There was a tiny star who was afraid of the dark. "But you ARE the light!" said the moon.',
      "The little star tried shining as bright as she could. Her glow lit up a whole village below.",
      'The children looked up and smiled. "Thank you, little star!" they cheered.',
      "From that night on, she was never afraid again. She knew her light made the world brighter.",
    ],
    quiz: [
      { type: "mcq" as const, question: "What was the star afraid of?", emoji: "⭐", options: ["Heights", "The Dark", "Water", "Fire"], answer: "The Dark" },
      { type: "mcq" as const, question: "Who said 'You ARE the light!'?", emoji: "🌙", options: ["The Sun", "The Moon", "The Children", "The Star"], answer: "The Moon" },
      { type: "fill" as const, question: "The star's glow lit up a ____", emoji: "✨", answer: "village", hint: "A small town" },
      { type: "mcq" as const, question: "How did the star feel at the end?", emoji: "🌟", options: ["Afraid", "Sad", "Brave", "Angry"], answer: "Brave" },
    ] as QuizQuestion[],
  },
  {
    id: "dragon-friend",
    title: "The Friendly Dragon",
    author: "Magic Pen Co.",
    tags: ["Friendship", "Fantasy", "Kindness"],
    coverEmoji: "🐉💚🌸",
    coverGradient: "linear-gradient(160deg, #0d2818 0%, #1a5c35 50%, #2d9e5f 100%)",
    duration: "10 min",
    description: "Everyone fears the green dragon — until a brave girl discovers he just wants a friend.",
    premium: true,
    stars: 3,
    pages: [
      "Everyone was scared of the green dragon, but he just wanted friends.",
      'One day, a brave girl named Lily said "Hello!" The dragon was so happy he sneezed... flowers!',
      "Together they flew over mountains and valleys, sharing stories and snacks.",
      "The village learned that being different is wonderful, and the dragon became everyone's best friend.",
    ],
    quiz: [
      { type: "mcq" as const, question: "What color was the dragon?", emoji: "🐉", options: ["Red", "Blue", "Green", "Purple"], answer: "Green" },
      { type: "fill" as const, question: "The brave girl's name was ____", emoji: "👧", answer: "Lily" },
      { type: "mcq" as const, question: "What did the dragon sneeze?", emoji: "🌸", options: ["Fire", "Water", "Flowers", "Stars"], answer: "Flowers" },
      { type: "mcq" as const, question: "What did the village learn?", emoji: "💡", options: ["Fear dragons", "Being different is wonderful", "Dragons are scary", "Never say hello"], answer: "Being different is wonderful" },
    ] as QuizQuestion[],
  },
  {
    id: "rainbow-fish",
    title: "Rainbow Fish",
    author: "Ocean Stories",
    tags: ["Sharing", "Ocean", "Friendship"],
    coverEmoji: "🐠🌈🐙",
    coverGradient: "linear-gradient(160deg,#003366,#0077b6,#00b4d8)",
    duration: "9 min",
    description: "A beautiful fish with rainbow scales learns that sharing makes you richer.",
    premium: false, stars: 3,
    pages: [
      "A beautiful fish with rainbow scales swam alone. \"Why won't anyone play with me?\"",
      "A wise octopus said, \"Share your sparkle!\" So the fish gave each friend a shiny scale.",
      "Soon the whole ocean glittered with shared colors. Every fish was special and unique.",
      "The rainbow fish smiled — having friends was better than having all the sparkle to herself.",
    ],
    quiz: [
      { type: "mcq" as const, question: "Why was the fish alone?", emoji: "🐠", options: ["Too fast","Too shy","Nobody played with her","She was sick"], answer: "Nobody played with her" },
      { type: "fill" as const, question: "Who gave advice? A wise ____", emoji: "🐙", answer: "octopus" },
      { type: "mcq" as const, question: "What did the fish share?", emoji: "✨", options: ["Food","Games","Shiny scales","Music"], answer: "Shiny scales" },
      { type: "mcq" as const, question: "What was better than sparkle?", emoji: "🌟", options: ["Swimming alone","Having friends","Eating","Being biggest"], answer: "Having friends" },
    ] as QuizQuestion[],
  },
  {
    id: "little-cloud",
    title: "The Little Cloud",
    author: "Weather Tales",
    tags: ["Nature", "Rain", "Kindness"],
    coverEmoji: "☁️🌧️🌈",
    coverGradient: "linear-gradient(160deg,#2c3e50,#3498db,#85c1e9)",
    duration: "6 min",
    description: "A tiny cloud who couldn't rain discovers even small things can bring big joy.",
    premium: false, stars: 2,
    pages: [
      "There was a tiny cloud who couldn't make rain. All the other clouds laughed at him.",
      "One hot summer day, the flowers were thirsty and wilting in the sun.",
      "The tiny cloud tried SO hard — and suddenly, drip... drop... it rained! Just a little, but enough.",
      "The flowers bloomed and butterflies danced. \"Thank you, little cloud!\" they cheered. He was never sad again.",
    ],
    quiz: [
      { type: "mcq" as const, question: "What could the cloud not do?", emoji: "☁️", options: ["Float","Make rain","Move","Shine"], answer: "Make rain" },
      { type: "mcq" as const, question: "Who was thirsty in summer?", emoji: "🌸", options: ["Animals","Children","Flowers","Trees"], answer: "Flowers" },
      { type: "fill" as const, question: "Drip... drop... it ____!", emoji: "🌧️", answer: "rained", hint: "Water from sky!" },
      { type: "mcq" as const, question: "Who danced when it rained?", emoji: "🦋", options: ["Birds","Butterflies","Bees","Frogs"], answer: "Butterflies" },
    ] as QuizQuestion[],
  },
  {
    id: "magic-paintbrush",
    title: "The Magic Paintbrush",
    author: "Art House Books",
    tags: ["Magic", "Art", "Wishes"],
    coverEmoji: "🎨🖌️✨",
    coverGradient: "linear-gradient(160deg,#4a0080,#9b59b6,#f39c12)",
    duration: "11 min",
    description: "A poor girl finds a magic paintbrush — whatever she paints comes to life!",
    premium: true, stars: 4,
    pages: [
      "A poor girl named Maya found a golden paintbrush in the forest. It glittered like starlight.",
      "She painted a fish — and it jumped right off the paper into the river! The paintbrush was magic!",
      "Maya painted food for hungry families, homes for those without shelter, and flowers for sad people.",
      "She never used the brush for herself — only for others. And that made her the happiest girl in the world.",
    ],
    quiz: [
      { type: "fill" as const, question: "The girl's name was ____", emoji: "👧", answer: "Maya", hint: "Starts with M!" },
      { type: "mcq" as const, question: "What was magic about the brush?", emoji: "🖌️", options: ["It glowed","Painted fast","Paintings came to life","Never ran out"], answer: "Paintings came to life" },
      { type: "mcq" as const, question: "What did Maya paint first?", emoji: "🐟", options: ["A bird","A fish","A cat","A flower"], answer: "A fish" },
      { type: "mcq" as const, question: "Did Maya use the brush for herself?", emoji: "💭", options: ["Yes always","Sometimes","No never","Only once"], answer: "No never" },
    ] as QuizQuestion[],
  },
  {
    id: "sleepy-elephant",
    title: "The Sleepy Elephant",
    author: "Jungle Reads",
    tags: ["Animals", "Bedtime", "Funny"],
    coverEmoji: "🐘🌙💤",
    coverGradient: "linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)",
    duration: "6 min",
    description: "Ellie the elephant can't sleep — so the whole jungle tries to help!",
    premium: false, stars: 2,
    pages: [
      "Ellie the elephant couldn't sleep. She tossed, turned, and wiggled her big ears.",
      "The monkeys sang lullabies. The birds chirped softly. The lions roared... that wasn't helpful!",
      "Finally, a tiny mouse whispered: \"Count the stars, Ellie.\" So she did — one, two, three...",
      "By star number seven, Ellie was fast asleep, snoring loudly. And the whole jungle finally slept too!",
    ],
    quiz: [
      { type: "mcq" as const, question: "Who couldn't sleep?", emoji: "🐘", options: ["The lion","The monkey","Ellie the elephant","The mouse"], answer: "Ellie the elephant" },
      { type: "mcq" as const, question: "Who sang lullabies?", emoji: "🎵", options: ["Birds","Monkeys","Lions","Frogs"], answer: "Monkeys" },
      { type: "fill" as const, question: "Count the ____", emoji: "⭐", answer: "stars", hint: "In the sky!" },
      { type: "mcq" as const, question: "By what number did Ellie sleep?", emoji: "💤", options: ["Three","Five","Seven","Ten"], answer: "Seven" },
    ] as QuizQuestion[],
  },
];

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
  const { profile, addStars, addXP, addCoins, incrementStreak, completeStory } = useChild();
  const [screen, setScreen] = useState<Screen>("list");
  const [activeStory, setActiveStory] = useState<typeof stories[0] | null>(null);
  const [tab, setTab] = useState<"audio" | "read">("audio");
  const [readPage, setReadPage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showStarBurst, setShowStarBurst] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState({ stars: 0, xp: 0, coins: 0 });

  const openStory = (story: typeof stories[0]) => {
    if (story.premium && !profile?.isPremium) return;
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
              {stories.map((story, i) => {
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
