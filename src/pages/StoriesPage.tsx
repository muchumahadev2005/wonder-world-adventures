import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import NavBar from "@/components/NavBar";
import SceneBackground from "@/components/SceneBackground";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
import PremiumBadge from "@/components/PremiumBadge";
import StarBurst from "@/components/StarBurst";
import storiesBg from "@/assets/stories-bg.jpg";
import { BookOpen, Star, Lock, ChevronRight } from "lucide-react";

const stories = [
  {
    id: "moon-rabbit",
    title: "The Moon Rabbit",
    cover: "🐰🌙",
    color: "from-lavender to-sky",
    premium: false,
    stars: 2,
    pages: [
      'Once upon a time, a little rabbit looked up at the big bright moon. "I want to visit you!" she said.',
      'So she built a rocket from carrots and leaves. "3... 2... 1... Blast off!" she shouted.',
      "When she landed on the moon, she found it was made of cheese! She nibbled happily.",
      'The moon winked at her and said, "Come visit anytime, little friend!" And she did, every night in her dreams.',
    ],
  },
  {
    id: "brave-star",
    title: "The Brave Little Star",
    cover: "⭐✨",
    color: "from-sunshine to-coral",
    premium: false,
    stars: 2,
    pages: [
      'There was a tiny star who was afraid of the dark. "But you ARE the light!" said the moon.',
      "The little star tried shining as bright as she could. Her glow lit up a whole village below.",
      'The children looked up and smiled. "Thank you, little star!" they cheered.',
      "From that night on, she was never afraid again. She knew her light made the world brighter.",
    ],
  },
  {
    id: "dragon-friend",
    title: "The Friendly Dragon",
    cover: "🐉💚",
    color: "from-mint to-sky",
    premium: true,
    stars: 3,
    pages: [
      "Everyone was scared of the green dragon, but he just wanted friends.",
      'One day, a brave girl named Lily said "Hello!" The dragon was so happy he sneezed... flowers!',
      "Together they flew over mountains and valleys, sharing stories and snacks.",
      "The village learned that being different is wonderful, and the dragon became everyone's best friend.",
    ],
  },
  {
    id: "rainbow-fish",
    title: "Rainbow Fish",
    cover: "🐠🌈",
    color: "from-bubblegum to-lavender",
    premium: true,
    stars: 3,
    pages: [
      'A beautiful fish with rainbow scales swam alone. "Why won\'t anyone play with me?"',
      'A wise octopus said, "Share your sparkle!" So the fish gave each friend a shiny scale.',
      "Soon the whole ocean glittered with shared colors. Every fish was special and unique.",
      "The rainbow fish smiled. Having friends was better than having all the sparkle to herself.",
    ],
  },
];

const StoriesPage = () => {
  const { profile, addStars, completeStory } = useChild();
  const [activeStory, setActiveStory] = useState<(typeof stories)[0] | null>(
    null,
  );
  const [page, setPage] = useState(0);
  const [showStarBurst, setShowStarBurst] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const finishStory = (story: (typeof stories)[0]) => {
    if (!profile?.completedStories.includes(story.id)) {
      addStars(story.stars);
      completeStory(story.id);
      setEarnedStars(story.stars);
      setShowStarBurst(true);
      setTimeout(() => {
        setShowStarBurst(false);
        setActiveStory(null);
        setPage(0);
      }, 2500);
    } else {
      setActiveStory(null);
      setPage(0);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SceneBackground image={storiesBg} alt="Enchanted moonlit library tree with lanterns" variant="library" />
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
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-primary" /> Story
            Time
          </h1>
          <p className="text-muted-foreground mt-1">
            Read stories and earn stars! 📚
          </p>
        </motion.div>

        {activeStory ? (
          <motion.div
            className="glass-card-strong p-5 sm:p-8 max-w-lg mx-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <button
              onClick={() => {
                setActiveStory(null);
                setPage(0);
              }}
              className="text-primary font-bold text-sm hover:underline mb-4 block"
            >
              ← Back
            </button>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-center mb-2">
              {activeStory.title}
            </h2>
            <div className="text-center text-4xl mb-4">{activeStory.cover}</div>

            <div className="w-full h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-lavender rounded-full"
                animate={{
                  width: `${((page + 1) / activeStory.pages.length) * 100}%`,
                }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={page}
                className="text-base sm:text-lg font-body text-foreground leading-relaxed text-center min-h-[120px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {activeStory.pages[page]}
              </motion.p>
            </AnimatePresence>

            <div className="flex items-center justify-between gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="glossy-btn px-4 sm:px-6 py-2 text-primary-foreground font-bold disabled:opacity-30"
              >
                ← Back
              </button>
              {page < activeStory.pages.length - 1 ? (
                <motion.button
                  onClick={() => setPage((p) => p + 1)}
                  className="glossy-btn px-4 sm:px-6 py-2 text-primary-foreground font-bold flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => finishStory(activeStory)}
                  className="glossy-btn px-4 sm:px-6 py-2 text-primary-foreground font-bold flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Star className="w-4 h-4" /> Finish!
                </motion.button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-2 lg:grid-cols-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            {stories.map((story) => {
              const locked = story.premium && !profile?.isPremium;
              const completed = profile?.completedStories.includes(story.id);
              return (
                <motion.button
                  key={story.id}
                  variants={{
                    hidden: { y: 30, opacity: 0 },
                    show: { y: 0, opacity: 1 },
                  }}
                  onClick={() => !locked && setActiveStory(story)}
                  className={`glass-card-strong p-5 sm:p-6 text-center relative snap-center flex-shrink-0 w-[78%] sm:w-auto sm:flex-shrink ${locked ? "opacity-70" : ""}`}
                  whileHover={locked ? {} : { scale: 1.05, y: -5 }}
                  whileTap={locked ? {} : { scale: 0.95 }}
                >
                  {story.premium && (
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
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${story.color} flex items-center justify-center mx-auto mb-3 shadow-lg text-2xl`}
                  >
                    {story.cover}
                  </div>
                  <h3 className="font-display text-base sm:text-sm font-bold text-foreground">
                    {story.title}
                  </h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-star fill-star" />
                    <span className="text-xs text-muted-foreground font-bold">
                      {story.stars}
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

export default StoriesPage;
