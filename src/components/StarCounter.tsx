import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { useChild } from '@/context/ChildContext';

const StarCounter = () => {
  const { profile } = useChild();
  if (!profile) return null;

  return (
    <motion.div
      className="glass-card px-4 py-2 flex items-center gap-2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Star className="w-6 h-6 text-star star-glow fill-star" />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={profile.stars}
          className="font-display text-xl font-bold text-gradient-gold"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
        >
          {profile.stars}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
};

export default StarCounter;
