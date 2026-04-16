import { motion } from 'framer-motion';
import { Home, Gamepad2, BookOpen, MessageCircle, Crown, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import StarCounter from './StarCounter';
import { useChild } from '@/context/ChildContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Gamepad2, label: 'Games', path: '/games' },
  { icon: BookOpen, label: 'Stories', path: '/stories' },
  { icon: MessageCircle, label: 'Chat', path: '/chat' },
  { icon: Crown, label: 'Parents', path: '/parents' },
];

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useChild();

  if (!profile) return null;

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <div className="glass-card-strong flex items-center justify-between px-4 py-2 max-w-5xl mx-auto">
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 300 }}
                  />
                )}
                <item.icon className="w-5 h-5 relative z-10" />
                <span className="text-[10px] font-bold relative z-10">{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <StarCounter />
          <motion.button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-muted-foreground hover:text-destructive transition-colors p-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default NavBar;
