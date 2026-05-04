import { motion } from 'framer-motion';

const bubbles = [
  { size: 60, x: '10%', y: '20%', color: 'bg-sky-light', delay: 0 },
  { size: 40, x: '80%', y: '15%', color: 'bg-lavender-light', delay: 0.5 },
  { size: 80, x: '70%', y: '60%', color: 'bg-bubblegum-light', delay: 1 },
  { size: 50, x: '20%', y: '70%', color: 'bg-mint-light', delay: 1.5 },
  { size: 35, x: '50%', y: '85%', color: 'bg-sunshine-light', delay: 0.8 },
  { size: 45, x: '90%', y: '40%', color: 'bg-coral-light', delay: 1.2 },
];

const FloatingBubbles = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {bubbles.map((b, i) => (
      <motion.div
        key={i}
        className={`absolute rounded-full ${b.color} opacity-40`}
        style={{ width: b.size, height: b.size, left: b.x, top: b.y }}
        animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
        transition={{ duration: 4 + i, repeat: Infinity, delay: b.delay, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

export default FloatingBubbles;
