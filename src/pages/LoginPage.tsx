import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useChild } from '@/context/ChildContext';
import Scene3D from '@/components/Scene3D';
import { Sparkles, ArrowRight, Palette } from 'lucide-react';

const colorOptions = [
  { name: 'Red', value: '#ef4444', bg: 'bg-red-400' },
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-400' },
  { name: 'Green', value: '#22c55e', bg: 'bg-green-400' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-400' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-400' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-400' },
  { name: 'Yellow', value: '#eab308', bg: 'bg-yellow-400' },
];

const LoginPage = () => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [mathAnswer, setMathAnswer] = useState('');
  const [color, setColor] = useState('');
  const [mathA] = useState(() => Math.floor(Math.random() * 5) + 1);
  const [mathB] = useState(() => Math.floor(Math.random() * 5) + 1);
  const [error, setError] = useState('');
  const { setProfile } = useChild();
  const navigate = useNavigate();

  const steps = [
    { title: "What's your name?", subtitle: 'Tell us who you are! 🌟' },
    { title: 'How old are you?', subtitle: "We'll find the best stuff for you! 🎂" },
    { title: `What is ${mathA} + ${mathB}?`, subtitle: "Let's see how smart you are! 🧠" },
    { title: 'Pick your favorite color!', subtitle: 'Choose the one you love most! 🎨' },
  ];

  const handleNext = () => {
    setError('');
    if (step === 0 && name.trim().length < 1) { setError('Please enter your name!'); return; }
    if (step === 1 && (!age || parseInt(age) < 3 || parseInt(age) > 15)) { setError('Enter an age between 3 and 15!'); return; }
    if (step === 2 && parseInt(mathAnswer) !== mathA + mathB) { setError('Oops! Try again! 🤔'); return; }
    if (step === 3 && !color) { setError('Pick a color!'); return; }

    if (step < 3) {
      setStep(step + 1);
    } else {
      setProfile({
        name: name.trim(),
        age: parseInt(age),
        favoriteColor: color,
        stars: 0,
        completedGames: [],
        completedStories: [],
        isPremium: false,
      });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bubble-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 opacity-30">
        <Scene3D />
      </div>

      <motion.div
        className="glass-card-strong p-5 sm:p-8 w-full max-w-md relative z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`w-3 h-3 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`}
              animate={{ scale: i === step ? 1.3 : 1 }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{steps[step].title}</h1>
              <p className="text-muted-foreground mt-1">{steps[step].subtitle}</p>
            </div>

            {step === 0 && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your awesome name..."
                className="w-full px-4 py-3 rounded-2xl border-2 border-primary/20 bg-card text-foreground text-center text-lg font-bold focus:outline-none focus:border-primary transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                autoFocus
              />
            )}

            {step === 1 && (
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Your age..."
                min={3}
                max={15}
                className="w-full px-4 py-3 rounded-2xl border-2 border-primary/20 bg-card text-foreground text-center text-lg font-bold focus:outline-none focus:border-primary transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                autoFocus
              />
            )}

            {step === 2 && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
                  <span className="glass-card px-3 sm:px-4 py-2 text-xl sm:text-2xl font-display font-bold">{mathA}</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">+</span>
                  <span className="glass-card px-3 sm:px-4 py-2 text-xl sm:text-2xl font-display font-bold">{mathB}</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">=</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">?</span>
                </div>
                <input
                  type="number"
                  value={mathAnswer}
                  onChange={(e) => setMathAnswer(e.target.value)}
                  placeholder="?"
                  className="w-20 sm:w-24 px-4 py-3 rounded-2xl border-2 border-primary/20 bg-card text-foreground text-center text-xl sm:text-2xl font-bold focus:outline-none focus:border-primary transition-colors mx-auto"
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  autoFocus
                />
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-wrap justify-center gap-3">
                {colorOptions.map((c) => (
                  <motion.button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${c.bg} border-4 transition-all ${
                      color === c.name ? 'border-foreground scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p
            className="text-destructive text-center mt-3 font-bold text-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {error}
          </motion.p>
        )}

        <motion.button
          onClick={handleNext}
          className="glossy-btn w-full mt-6 px-6 py-3 text-primary-foreground font-display text-base sm:text-lg flex items-center justify-center gap-2"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {step === 3 ? (
            <>
              <Sparkles className="w-5 h-5" /> Let's Go!
            </>
          ) : (
            <>
              Next <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default LoginPage;
