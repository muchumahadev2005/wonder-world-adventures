import { motion } from 'framer-motion';
import { Home, Gamepad2, BookOpen, MessageCircle, Crown, LogOut, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';
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
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4"
      style={{ marginTop: 20 }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
    >
      <div
        className="flex items-center justify-between w-[92%] max-w-6xl px-6"
        style={{
          height: 72,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 30,
          boxShadow: '0 8px 32px rgba(124,58,237,0.08), 0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
      >
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-display text-lg font-bold text-gradient-primary hidden sm:block">KidsPal</span>
        </motion.div>

        {/* Nav Items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-200"
                style={isActive ? {
                  background: 'linear-gradient(135deg, hsl(260 85% 60%), hsl(270 80% 70%))',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
                } : {
                  color: 'hsl(220 10% 50%)',
                }}
                whileHover={!isActive ? {
                  scale: 1.05,
                  backgroundColor: 'rgba(124,58,237,0.08)',
                } : { scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, hsl(260 85% 60%), hsl(270 80% 70%))',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className="w-[18px] h-[18px] relative z-10" />
                <span className="text-sm font-bold relative z-10 hidden md:block">{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Right side: Stars + Profile */}
        <div className="flex items-center gap-3">
          {/* Star Badge */}
          <motion.div
            className="flex items-center gap-1.5 px-4 py-2 rounded-full"
            style={{
              background: 'linear-gradient(135deg, hsl(45 100% 92%), hsl(45 100% 85%))',
              border: '1px solid hsl(45 100% 75%)',
            }}
            whileHover={{ scale: 1.08 }}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="text-sm font-bold text-amber-700">{profile.stars} Stars</span>
          </motion.div>

          {/* Profile / Logout */}
          <motion.button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: `hsl(${profile.favoriteColor === 'blue' ? '200 90% 90%' : profile.favoriteColor === 'pink' ? '330 85% 90%' : profile.favoriteColor === 'green' ? '160 70% 90%' : '270 80% 90%'})`,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Logout"
          >
            <User className="w-4 h-4 text-foreground/70" />
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default NavBar;
