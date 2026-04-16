import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useChild } from '@/context/ChildContext';
import Scene3D from '@/components/Scene3D';
import NavBar from '@/components/NavBar';
import { Gamepad2, BookOpen, MessageCircle, Crown, Star, Trophy, Flame, Sparkles, Cloud } from 'lucide-react';

const sections = [
  {
    icon: Gamepad2,
    title: 'Games',
    desc: 'Play & Learn!',
    path: '/games',
    gradient: 'from-sky to-lavender',
  },
  {
    icon: BookOpen,
    title: 'Stories',
    desc: 'Magical Tales!',
    path: '/stories',
    gradient: 'from-mint to-sky',
  },
  {
    icon: MessageCircle,
    title: 'Chat Bot',
    desc: 'Talk to Buddy!',
    path: '/chat',
    gradient: 'from-bubblegum to-coral',
  },
  {
    icon: Crown,
    title: 'Parents',
    desc: 'Parent Zone',
    path: '/parents',
    gradient: 'from-sunshine to-coral',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { y: 40, opacity: 0, scale: 0.8 },
  show: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 200 } },
};

// Tiny sparkle dots
const SparkleParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          background: i % 3 === 0 ? 'hsl(45 100% 60%)' : i % 3 === 1 ? 'hsl(260 85% 70%)' : 'hsl(330 85% 70%)',
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1.2, 0.5],
          y: [0, -8, 0],
        }}
        transition={{
          duration: 2 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 3,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const { profile } = useChild();

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #F7F8FF 0%, #EEF3FF 50%, #F5F0FF 100%)',
      }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large purple blob behind character (right) */}
        <div
          className="absolute"
          style={{
            width: 600,
            height: 600,
            right: -80,
            top: 60,
            borderRadius: '50%',
            background: 'radial-gradient(circle, hsla(260 85% 75% / 0.2) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Soft blue blob behind left content */}
        <div
          className="absolute"
          style={{
            width: 500,
            height: 500,
            left: -100,
            top: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, hsla(200 90% 70% / 0.15) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        {/* Tiny animated stars */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'hsl(45 100% 60%)',
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <NavBar />

      <div className="pt-28 pb-16 px-6 max-w-6xl mx-auto relative z-10">
        {/* Hero Section – 2 columns */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-4 mb-16">
          {/* Left Side – 45% */}
          <motion.div
            className="w-full lg:w-[45%] text-center lg:text-left relative"
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <SparkleParticles />

            <h1 className="font-display leading-tight" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
              <span className="text-gradient-primary">Hey {profile?.name}!</span>{' '}
              <motion.span
                className="inline-block"
                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              >
                👋
              </motion.span>
            </h1>
            <p className="text-muted-foreground text-lg lg:text-xl mt-3 font-body max-w-md">
              Ready for some fun learning today?
            </p>

            {/* Progress Card */}
            <motion.div
              className="mt-8 inline-flex items-center gap-0 rounded-[30px] overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 30px rgba(124,58,237,0.08), 0 2px 8px rgba(0,0,0,0.03)',
                border: '1px solid rgba(255,255,255,0.6)',
                height: 88,
                maxWidth: 560,
                width: '100%',
              }}
              whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(124,58,237,0.12), 0 4px 12px rgba(0,0,0,0.05)' }}
              transition={{ duration: 0.2 }}
            >
              {/* Stars */}
              <motion.div className="flex-1 flex items-center justify-center gap-2 px-5" whileHover={{ scale: 1.02 }}>
                <motion.div whileHover={{ scale: 1.2, rotate: 15 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
                </motion.div>
                <div className="text-left">
                  <div className="font-bold text-lg text-foreground leading-tight">{profile?.stars || 0}</div>
                  <div className="text-xs text-muted-foreground font-medium">Stars</div>
                </div>
              </motion.div>

              <div className="w-px h-10 bg-border/60" />

              {/* Games */}
              <motion.div className="flex-1 flex items-center justify-center gap-2 px-5" whileHover={{ scale: 1.02 }}>
                <motion.div whileHover={{ scale: 1.2, rotate: -10 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <Gamepad2 className="w-6 h-6 text-primary" />
                </motion.div>
                <div className="text-left">
                  <div className="font-bold text-lg text-foreground leading-tight">{profile?.completedGames.length || 0}</div>
                  <div className="text-xs text-muted-foreground font-medium">Games</div>
                </div>
              </motion.div>

              <div className="w-px h-10 bg-border/60" />

              {/* Streak */}
              <motion.div className="flex-1 flex items-center justify-center gap-2 px-5" whileHover={{ scale: 1.02 }}>
                <motion.div whileHover={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <Flame className="w-6 h-6 text-orange-500" />
                </motion.div>
                <div className="text-left">
                  <div className="font-bold text-lg text-foreground leading-tight">3</div>
                  <div className="text-xs text-muted-foreground font-medium">Streak</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-8 justify-center lg:justify-start flex-wrap">
              <motion.button
                onClick={() => navigate('/chat')}
                className="relative overflow-hidden px-7 py-3.5 rounded-3xl font-bold text-white shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, hsl(260 85% 60%), hsl(270 80% 70%))',
                  boxShadow: '0 6px 25px rgba(124,58,237,0.35)',
                }}
                whileHover={{ scale: 1.05, y: -2, boxShadow: '0 10px 35px rgba(124,58,237,0.45)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Play with Buddy
                </span>
                {/* Glossy overlay */}
                <div className="absolute inset-0 rounded-3xl" style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                }} />
              </motion.button>

              <motion.button
                onClick={() => navigate('/games')}
                className="px-7 py-3.5 rounded-3xl font-bold text-primary"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid hsl(260 85% 85%)',
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Explore
                </span>
              </motion.button>
            </div>
          </motion.div>

          {/* Right Side – 55% — 3D Character Card */}
          <motion.div
            className="w-full lg:w-[55%] flex justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, delay: 0.2 }}
          >
            <div
              className="relative w-full max-w-[580px]"
              style={{ height: 480 }}
            >
              {/* Card background */}
              <div
                className="absolute inset-0 rounded-[40px] overflow-hidden"
                style={{
                  background: 'linear-gradient(160deg, hsla(270 80% 95% / 0.9) 0%, hsla(260 85% 90% / 0.6) 50%, hsla(200 90% 92% / 0.5) 100%)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 60px rgba(124,58,237,0.12), 0 4px 20px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(255,255,255,0.6)',
                }}
              >
                {/* Radial light behind character */}
                <div
                  className="absolute"
                  style={{
                    width: '70%',
                    height: '70%',
                    left: '15%',
                    top: '10%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, hsla(260 85% 80% / 0.3) 0%, transparent 70%)',
                  }}
                />

                {/* Decorative clouds */}
                <motion.div
                  className="absolute top-8 left-8"
                  animate={{ x: [0, 10, 0], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Cloud className="w-10 h-10 text-white/50" />
                </motion.div>
                <motion.div
                  className="absolute top-12 right-12"
                  animate={{ x: [0, -8, 0], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1, ease: 'easeInOut' }}
                >
                  <Cloud className="w-8 h-8 text-white/40" />
                </motion.div>

                {/* Decorative stars */}
                {[
                  { left: '10%', top: '25%', size: 14, delay: 0 },
                  { right: '12%', top: '20%', size: 12, delay: 0.5 },
                  { left: '18%', bottom: '20%', size: 10, delay: 1 },
                  { right: '20%', bottom: '25%', size: 16, delay: 1.5 },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: s.left, right: (s as any).right, top: s.top, bottom: (s as any).bottom }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8], rotate: [0, 180, 360] }}
                    transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
                  >
                    <Star className="fill-amber-300 text-amber-400" style={{ width: s.size, height: s.size }} />
                  </motion.div>
                ))}

                {/* Sparkle particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`sp-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: 3,
                      height: 3,
                      background: i % 2 === 0 ? 'hsl(45 100% 65%)' : 'hsl(260 85% 75%)',
                      left: `${20 + Math.random() * 60}%`,
                      top: `${15 + Math.random() * 60}%`,
                    }}
                    animate={{ opacity: [0, 1, 0], y: [0, -12, 0] }}
                    transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: i * 0.4 }}
                  />
                ))}
              </div>

              {/* 3D Scene */}
              <div className="absolute inset-0 rounded-[40px] overflow-hidden" style={{ top: 10 }}>
                <Scene3D />
              </div>

              {/* Ground shadow */}
              <div
                className="absolute bottom-12 left-1/2 -translate-x-1/2"
                style={{
                  width: '50%',
                  height: 16,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)',
                }}
              />

              {/* "Tap me" text */}
              <motion.div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-sm font-bold text-primary">✨ Tap me to play!</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-5"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {sections.map((s) => (
            <motion.button
              key={s.path}
              variants={item}
              onClick={() => navigate(s.path)}
              className="group cursor-pointer p-6 text-center rounded-3xl"
              style={{
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 20px rgba(124,58,237,0.06), 0 2px 8px rgba(0,0,0,0.03)',
                border: '1px solid rgba(255,255,255,0.6)',
              }}
              whileHover={{ scale: 1.05, y: -6, boxShadow: '0 12px 35px rgba(124,58,237,0.12)' }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                <s.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
