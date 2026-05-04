import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarBurstProps {
  show: boolean;
  count: number;
  onComplete?: () => void;
}

const StarBurst = ({ show, count, onComplete }: StarBurstProps) => (
  <AnimatePresence onExitComplete={onComplete}>
    {show && (
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1.5, 0],
              x: Math.cos(i * Math.PI / 4) * 150,
              y: Math.sin(i * Math.PI / 4) * 150,
            }}
            transition={{ duration: 1, delay: i * 0.05 }}
          >
            <Star className="w-8 h-8 text-star fill-star star-glow" />
          </motion.div>
        ))}
        <motion.div
          className="text-center"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="glass-card-strong px-8 py-6">
            <Star className="w-16 h-16 text-star fill-star star-glow mx-auto mb-2" />
            <p className="font-display text-3xl font-bold text-gradient-gold">+{count} Stars!</p>
            <p className="text-muted-foreground font-body text-sm mt-1">Amazing work! 🎉</p>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default StarBurst;
