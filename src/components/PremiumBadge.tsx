import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

const PremiumBadge = () => (
  <motion.div
    className="premium-badge flex items-center gap-1"
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    <Crown className="w-3 h-3" />
    <span>Premium</span>
  </motion.div>
);

export default PremiumBadge;
