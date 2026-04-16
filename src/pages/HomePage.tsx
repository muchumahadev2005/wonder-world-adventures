import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useChild } from '@/context/ChildContext';
import Scene3D from '@/components/Scene3D';
import FloatingBubbles from '@/components/FloatingBubbles';
import NavBar from '@/components/NavBar';
import { Gamepad2, BookOpen, MessageCircle, Crown, Star, Trophy } from 'lucide-react';

const sections = [
  {
    icon: Gamepad2,
    title: 'Games',
    desc: 'Play & Learn!',
    path: '/games',
    gradient: 'from-sky to-lavender',
    bgLight: 'bg-sky-light',
  },
  {
    icon: BookOpen,
    title: 'Stories',
    desc: 'Magical Tales!',
    path: '/stories',
    gradient: 'from-mint to-sky',
    bgLight: 'bg-mint-light',
  },
  {
    icon: MessageCircle,
    title: 'Chat Bot',
    desc: 'Talk to Buddy!',
    path: '/chat',
    gradient: 'from-bubblegum to-coral',
    bgLight: 'bg-bubblegum-light',
  },
  {
    icon: Crown,
    title: 'Parents',
    desc: 'Parent Zone',
    path: '/parents',
    gradient: 'from-sunshine to-coral',
    bgLight: 'bg-sunshine-light',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { y: 40, opacity: 0, scale: 0.8 },
  show: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200 } },
};

const HomePage = () => {
  const navigate = useNavigate();
  const { profile } = useChild();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingBubbles />
      <NavBar />

      <div className="pt-24 pb-12 px-4 max-w-5xl mx-auto relative z-10">
        {/* Hero section */}
        <div className="flex flex-col lg:flex-row items-center gap-8 mb-12">
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl lg:text-5xl font-bold">
              <span className="text-gradient-primary">Hey {profile?.name}!</span> 👋
            </h1>
            <p className="text-muted-foreground text-lg mt-2 font-body">
              Ready for some fun learning today?
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-6 justify-center lg:justify-start">
              <motion.div className="glass-card px-4 py-3 flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                <Star className="w-5 h-5 text-star fill-star" />
                <span className="font-bold">{profile?.stars || 0} Stars</span>
              </motion.div>
              <motion.div className="glass-card px-4 py-3 flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                <Trophy className="w-5 h-5 text-sunshine" />
                <span className="font-bold">{profile?.completedGames.length || 0} Games</span>
              </motion.div>
            </div>
          </motion.div>

          {/* 3D Character */}
          <motion.div
            className="w-64 h-64 lg:w-80 lg:h-80"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 150, delay: 0.3 }}
          >
            <Scene3D />
          </motion.div>
        </div>

        {/* Section Cards */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {sections.map((s) => (
            <motion.button
              key={s.path}
              variants={item}
              onClick={() => navigate(s.path)}
              className="glass-card-strong p-6 text-center group cursor-pointer"
              whileHover={{ scale: 1.05, y: -5 }}
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
