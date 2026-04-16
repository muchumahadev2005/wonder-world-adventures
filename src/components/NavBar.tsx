import { AnimatePresence, motion } from 'framer-motion';
import { House, Gamepad2, BookText, MessagesSquare, UsersRound, CircleUserRound, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChild } from '@/context/ChildContext';

const navItems = [
  { icon: House, label: 'Home', path: '/' },
  { icon: Gamepad2, label: 'Games', path: '/games' },
  { icon: BookText, label: 'Stories', path: '/stories' },
  { icon: MessagesSquare, label: 'Chat', path: '/chat' },
  { icon: UsersRound, label: 'Parents', path: '/parents' },
];

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useChild();

  if (!profile) return null;

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-2 sm:px-3 md:px-4"
      style={{ marginTop: 12 }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
    >
      <div
        className="w-[96%] max-w-[1240px] px-3 py-3 md:w-[92%] md:px-4 lg:px-6"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 28,
          boxShadow: '0 8px 32px rgba(124,58,237,0.08), 0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
      >
        <div className="md:hidden">
          <div className="flex items-center justify-between gap-2">
            <motion.div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                <span className="text-sm font-bold text-white">K</span>
              </div>
              <span className="font-display text-xl font-bold text-gradient-primary">KidsPal</span>
            </motion.div>

            <div className="flex items-center gap-2">
              <motion.div
                className="flex h-10 items-center gap-1.5 rounded-full px-3"
                style={{
                  background: 'linear-gradient(135deg, hsl(45 100% 92%), hsl(45 100% 85%))',
                  border: '1px solid hsl(45 100% 75%)',
                }}
                whileHover={{ scale: 1.04 }}
              >
                <Sparkles className="h-4 w-4 text-amber-600" strokeWidth={2.3} />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={profile.stars}
                    className="text-base font-bold text-amber-700"
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {profile.stars}
                  </motion.span>
                </AnimatePresence>
              </motion.div>

              <motion.button
                onClick={() => { logout(); navigate('/login'); }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70"
                style={{
                  background: `hsl(${profile.favoriteColor === 'blue' ? '200 90% 90%' : profile.favoriteColor === 'pink' ? '330 85% 90%' : profile.favoriteColor === 'green' ? '160 70% 90%' : '270 80% 90%'})`,
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                title="Logout"
              >
                <CircleUserRound className="h-5 w-5 text-foreground/75" strokeWidth={2.2} />
              </motion.button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="group relative flex h-11 min-w-[102px] items-center justify-center gap-2 rounded-2xl px-3 py-2"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, hsl(260 85% 60%), hsl(270 80% 70%))',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
                  } : {
                    color: 'hsl(220 10% 50%)',
                    backgroundColor: 'rgba(255,255,255,0.45)',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill-mobile"
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, hsl(260 85% 60%), hsl(270 80% 70%))',
                      }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary/80'}`}>
                    <item.icon className="h-4 w-4" strokeWidth={2.3} />
                  </span>
                  <span className="relative z-10 text-sm font-semibold">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="hidden h-[82px] items-center gap-2 md:grid md:grid-cols-[minmax(165px,auto),1fr,minmax(165px,auto)] md:gap-4">
          <motion.div
            className="flex items-center gap-2 cursor-pointer select-none pr-1"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-base">K</span>
            </div>
            <span className="font-display text-2xl font-bold text-gradient-primary">KidsPal</span>
          </motion.div>

          <div className="flex items-center justify-center gap-1 px-1 lg:gap-1.5 sm:px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="group relative flex h-12 items-center gap-2.5 rounded-2xl px-3 py-2.5 transition-all duration-200 lg:px-4"
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
                      layoutId="nav-active-pill-desktop"
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, hsl(260 85% 60%), hsl(270 80% 70%))',
                      }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-primary/10 text-primary/80 group-hover:bg-primary/15 group-hover:text-primary'
                    }`}
                  >
                    <item.icon className="h-[17px] w-[17px]" strokeWidth={2.3} />
                  </span>
                  <span className="relative z-10 hidden text-base font-semibold tracking-tight lg:block">{item.label}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="flex min-w-[165px] items-center justify-end gap-2.5">
            <motion.div
              className="flex h-12 items-center gap-2 rounded-full px-3 sm:px-4"
              style={{
                background: 'linear-gradient(135deg, hsl(45 100% 92%), hsl(45 100% 85%))',
                border: '1px solid hsl(45 100% 75%)',
              }}
              whileHover={{ scale: 1.08 }}
            >
              <Sparkles className="h-5 w-5 text-amber-600" strokeWidth={2.3} />
              <AnimatePresence mode="wait">
                <motion.span
                  key={profile.stars}
                  className="text-xl font-bold text-amber-700"
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 6, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {profile.stars}
                  <span className="hidden lg:inline"> Stars</span>
                </motion.span>
              </AnimatePresence>
            </motion.div>

            <motion.button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/70"
              style={{
                background: `hsl(${profile.favoriteColor === 'blue' ? '200 90% 90%' : profile.favoriteColor === 'pink' ? '330 85% 90%' : profile.favoriteColor === 'green' ? '160 70% 90%' : '270 80% 90%'})`,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Logout"
            >
              <CircleUserRound className="h-6 w-6 text-foreground/75" strokeWidth={2.2} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default NavBar;
