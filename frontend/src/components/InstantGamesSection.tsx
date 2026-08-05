import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { contentApi, GamezopGame } from "@/lib/api";
import { useChild } from "@/context/ChildContext";
import PremiumBadge from "@/components/PremiumBadge";
import {
  Gamepad2,
  Search,
  X,
  Play,
  Star,
  Users,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  Lock,
} from "lucide-react";

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Puzzle", "Adventure", "Arcade", "Sports", "Action", "Strategy"];

const CATEGORY_SOLID: Record<string, string> = {
  All:       "linear-gradient(135deg,#7c3aed,#a855f7)",
  Puzzle:    "linear-gradient(135deg,#6366f1,#818cf8)",
  Adventure: "linear-gradient(135deg,#10b981,#34d399)",
  Arcade:    "linear-gradient(135deg,#f97316,#fb923c)",
  Sports:    "linear-gradient(135deg,#ec4899,#f472b6)",
  Action:    "linear-gradient(135deg,#ef4444,#f87171)",
  Strategy:  "linear-gradient(135deg,#8b5cf6,#a78bfa)",
};

const CATEGORY_GLOW: Record<string, string> = {
  All:       "rgba(124,58,237,0.55)",
  Puzzle:    "rgba(99,102,241,0.55)",
  Adventure: "rgba(16,185,129,0.55)",
  Arcade:    "rgba(249,115,22,0.55)",
  Sports:    "rgba(236,72,153,0.55)",
  Action:    "rgba(239,68,68,0.55)",
  Strategy:  "rgba(139,92,246,0.55)",
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  Puzzle:    ["puzzle", "brain", "word", "match", "trivia", "quiz", "memory", "jigsaw", "logic"],
  Adventure: ["adventure", "rpg", "quest", "explore", "dungeon", "story", "platformer"],
  Arcade:    ["arcade", "casual", "hypercasual", "hyper casual", "runner", "clicker", "idle", "retro"],
  Sports:    ["sport", "football", "soccer", "basketball", "cricket", "tennis", "golf", "racing", "race", "driving"],
  Action:    ["action", "shoot", "war", "battle", "fight", "gun", "fps", "kill", "combat", "hero"],
  Strategy:  ["strategy", "tower defense", "tower", "defense", "tactic", "build", "manage", "simulation", "sim"],
};

const gameMatchesCategory = (game: GamezopGame, chip: string): boolean => {
  if (chip === "All") return true;
  const aliases = CATEGORY_ALIASES[chip] ?? [chip.toLowerCase()];
  const allTags = [game.category, ...(game.categories ?? [])].map((c) => c.toLowerCase());
  return allTags.some((tag) => aliases.some((alias) => tag.includes(alias)));
};

// ─── Shared glass tokens ──────────────────────────────────────────────────────
const glass = {
  background: "rgba(255,255,255,0.22)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.40)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.55)",
} as const;

const glassHover = {
  background: "rgba(255,255,255,0.32)",
  boxShadow: "0 16px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.65)",
} as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden" style={glass}>
    <div className="w-full aspect-video animate-pulse" style={{ background: "rgba(255,255,255,0.18)" }} />
    <div className="p-3 space-y-2">
      <div className="h-4 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.25)", width: "75%" }} />
      <div className="h-3 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.18)", width: "50%" }} />
      <div className="h-9 rounded-xl animate-pulse mt-2" style={{ background: "rgba(255,255,255,0.2)" }} />
    </div>
  </div>
);

// ─── Game Card ────────────────────────────────────────────────────────────────
const GameCard = ({
  game,
  onPlay,
  onRequireSubscribe,
  index,
}: {
  game: GamezopGame;
  onPlay: (game: GamezopGame) => void;
  onRequireSubscribe?: () => void;
  index: number;
}) => {
  const { profile } = useChild();
  const catGrad = CATEGORY_SOLID[game.category] ?? CATEGORY_SOLID.All;
  const catGlow = CATEGORY_GLOW[game.category] ?? CATEGORY_GLOW.All;
  const locked = Boolean(game.isPremium && !profile?.isPremium);

  const handleAction = () => {
    if (locked) {
      onRequireSubscribe?.();
    } else {
      onPlay(game);
    }
  };

  return (
    <motion.div
      variants={{ hidden: { y: 28, opacity: 0 }, show: { y: 0, opacity: 1 } }}
      custom={index}
      className={`group relative flex flex-col rounded-2xl overflow-hidden ${locked ? "opacity-85" : ""}`}
      style={glass}
      whileHover={locked ? { scale: 1.02 } : { y: -6, ...glassHover }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video overflow-hidden" style={{ background: "rgba(255,255,255,0.10)" }}>
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt={game.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${locked ? "filter blur-[1px]" : "group-hover:scale-105"}`}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gamepad2 className="w-10 h-10 text-white/40" />
          </div>
        )}

        {/* Category pill */}
        {game.category && (
          <span
            className="absolute top-2 left-2 text-xs font-extrabold px-2.5 py-0.5 rounded-full text-white shadow-lg z-10"
            style={{ background: catGrad, boxShadow: `0 2px 10px ${catGlow}` }}
          >
            {game.category}
          </span>
        )}

        {/* Premium Badge */}
        {game.isPremium && (
          <div className="absolute top-2 right-2 z-10">
            <PremiumBadge />
          </div>
        )}

        {/* Lock Overlay */}
        {locked && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-10">
            <div className="p-2.5 rounded-full bg-black/60 border border-white/20 text-amber-300 shadow-xl">
              <Lock className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        <h3
          className="font-extrabold text-sm leading-snug line-clamp-2"
          style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
        >
          {game.name}
        </h3>

        <div className="flex items-center gap-3">
          {game.rating != null && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-300" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
              <Star className="w-3 h-3 fill-amber-300" />
              {game.rating.toFixed(1)}
            </span>
          )}
          {game.playCount != null && (
            <span className="flex items-center gap-1 text-xs font-semibold text-white/70">
              <Users className="w-3 h-3" />
              {game.playCount >= 1_000_000
                ? `${(game.playCount / 1_000_000).toFixed(1)}M`
                : game.playCount >= 1_000
                ? `${(game.playCount / 1_000).toFixed(0)}K`
                : game.playCount}
            </span>
          )}
        </div>

        <motion.button
          id={`instant-game-play-${game.code}`}
          onClick={handleAction}
          className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-sm text-white"
          style={
            locked
              ? {
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  boxShadow: "0 4px 16px rgba(245,158,11,0.4)",
                }
              : {
                  background: catGrad,
                  boxShadow: `0 4px 16px ${catGlow}`,
                  textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }
          }
          whileHover={{ opacity: 0.9, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          {locked ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              Unlock Game
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              Play Now
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── Game Overlay ─────────────────────────────────────────────────────────────
const GameOverlay = ({
  game,
  onClose,
}: {
  game: GamezopGame;
  onClose: () => void;
}) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const catGrad = CATEGORY_SOLID[game.category] ?? CATEGORY_SOLID.All;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex flex-col"
        style={{ zIndex: 9999, background: "#000" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b"
          style={{
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderColor: "rgba(255,255,255,0.25)",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Gamepad2 className="w-4 h-4 flex-shrink-0 text-white/80" />
            <span className="font-extrabold text-sm truncate text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              {game.name}
            </span>
            {game.category && (
              <span
                className="hidden sm:inline text-xs font-extrabold px-2.5 py-0.5 rounded-full text-white flex-shrink-0"
                style={{ background: catGrad }}
              >
                {game.category}
              </span>
            )}
          </div>
          <motion.button
            id="instant-game-close"
            onClick={onClose}
            className="flex-shrink-0 flex items-center gap-1.5 ml-3 px-3 py-1.5 rounded-xl text-sm font-extrabold text-white"
            style={{ background: "rgba(239,68,68,0.85)", boxShadow: "0 4px 14px rgba(239,68,68,0.4)" }}
            whileHover={{ background: "rgba(220,38,38,0.95)" }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </motion.button>
        </div>

        <div className="flex-1 relative overflow-hidden bg-black">
          <iframe
            src={game.url}
            title={game.name}
            width="100%"
            height="100%"
            className="absolute inset-0 w-full h-full border-0"
            style={{ display: "block" }}
            allow="fullscreen; autoplay; camera; microphone"
            allowFullScreen
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────
const InstantGamesSection = ({
  onBack,
  onRequireSubscribe,
}: {
  onBack?: () => void;
  onRequireSubscribe?: () => void;
}) => {
  const [games, setGames] = useState<GamezopGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeGame, setActiveGame] = useState<GamezopGame | null>(null);

  const fetchGames = () => {
    setLoading(true);
    setError(null);
    contentApi
      .listGamezopGames()
      .then(({ games: fetched }) => {
        setGames(Array.isArray(fetched) ? fetched : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load Instant Games.");
        setLoading(false);
      });
  };

  useEffect(() => { fetchGames(); }, []);

  const filtered = useMemo(() => {
    let list = games;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((g) => {
        const nameStr = String(g.name || "").toLowerCase();
        const catStr = String(g.category || "").toLowerCase();
        const descStr = String(g.description || "").toLowerCase();
        const tagsStr = Array.isArray(g.categories)
          ? g.categories.map((c) => String(c).toLowerCase())
          : [];

        return (
          nameStr.includes(q) ||
          catStr.includes(q) ||
          descStr.includes(q) ||
          tagsStr.some((t) => t.includes(q))
        );
      });
    } else if (activeCategory !== "All") {
      list = list.filter((g) => gameMatchesCategory(g, activeCategory));
    }

    return list;
  }, [games, activeCategory, search]);

  return (
    <>
      {activeGame && (
        <GameOverlay game={activeGame} onClose={() => setActiveGame(null)} />
      )}

      <section
        id="instant-games-section"
        aria-label="Instant Games powered by Gamezop"
        className="flex flex-col h-[calc(100vh-85px)] overflow-hidden"
      >

        {/* ── Fixed Top Header (Back + Search + Chips) ── */}
        <div
          className="flex-shrink-0 z-40 pb-3 pt-2.5 px-4 mb-3 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.22)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.40)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.55)",
          }}
        >
          {/* Top Bar: Back Button & Title */}
          {onBack && (
            <div className="flex items-center justify-between mb-2">
              <motion.button
                onClick={onBack}
                className="flex items-center gap-1 text-white/90 hover:text-white font-bold text-xs sm:text-sm transition-colors"
                whileHover={{ x: -3 }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Game Zone
              </motion.button>
              <span className="text-xs font-extrabold text-white/80 drop-shadow-sm">🎮 Instant Games</span>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-2.5 max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-white/70" />
            <input
              id="instant-games-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search instant games…"
              className="w-full pl-10 pr-9 py-2 rounded-2xl text-sm font-semibold text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              style={{ ...glass }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat && !search.trim();
              const glow = CATEGORY_GLOW[cat];
              return (
                <motion.button
                  key={cat}
                  id={`instant-games-cat-${cat.toLowerCase()}`}
                  onClick={() => {
                    setActiveCategory(cat);
                    setSearch("");
                  }}
                  className="px-3.5 py-1 rounded-full text-xs font-extrabold transition-all"
                  style={
                    isActive
                      ? {
                          background: CATEGORY_SOLID[cat],
                          color: "#fff",
                          boxShadow: `0 4px 18px ${glow}`,
                          border: "1px solid rgba(255,255,255,0.5)",
                          textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        }
                      : {
                          ...glass,
                          color: "rgba(255,255,255,0.90)",
                          textShadow: "0 1px 4px rgba(0,0,0,0.45)",
                        }
                  }
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {cat}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Independently Scrollable Game Grid ── */}
        <div className="flex-1 overflow-y-auto pb-12 pr-1 space-y-4">

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <motion.div
              className="flex flex-col items-center gap-4 py-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="p-6 rounded-3xl" style={glass}>
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3 drop-shadow-lg" />
                <p className="font-extrabold text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{error}</p>
              </div>
              <motion.button
                id="instant-games-retry"
                onClick={fetchGames}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-extrabold text-sm text-white"
                style={{ background: CATEGORY_SOLID.All, boxShadow: `0 4px 18px ${CATEGORY_GLOW.All}` }}
                whileHover={{ opacity: 0.88 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </motion.button>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              className="flex flex-col items-center gap-3 py-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="p-8 rounded-3xl" style={glass}>
                <Gamepad2 className="w-12 h-12 text-white/50 mx-auto mb-3 drop-shadow-lg" />
                <p
                  className="font-semibold text-white/90"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                >
                  {search ? `No games found for "${search}"` : "No games in this category yet."}
                </p>
                {(search || activeCategory !== "All") && (
                  <button
                    onClick={() => { setSearch(""); setActiveCategory("All"); }}
                    className="mt-3 text-sm font-extrabold text-white/80 underline underline-offset-2 hover:text-white transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            >
              {filtered.map((game, idx) => (
                <GameCard
                  key={game.code}
                  game={game}
                  index={idx}
                  onPlay={setActiveGame}
                  onRequireSubscribe={onRequireSubscribe}
                />
              ))}
            </motion.div>
          )}

          {/* Footer */}
          {!loading && !error && filtered.length > 0 && (
            <motion.p
              className="text-center text-xs font-semibold mt-6 text-white/60"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Showing {filtered.length} of {games.length} instant games
            </motion.p>
          )}
        </div>{/* end scrollable grid */}
      </section>
    </>
  );
};

export default InstantGamesSection;
