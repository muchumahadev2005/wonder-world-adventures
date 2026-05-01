import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CheckCircle, XCircle, ChevronRight } from "lucide-react";

export interface QuizQuestion {
  type: "mcq" | "fill" | "match";
  question: string;
  emoji?: string;
  options?: string[];
  answer: string;
  hint?: string;
}

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (stars: number) => void;
  onBack: () => void;
}

const QuizScreen = ({ questions, onComplete, onBack }: QuizProps) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [fillInput, setFillInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;

  const checkAnswer = (ans: string) => {
    if (feedback) return;
    const correct = ans.trim().toLowerCase() === q.answer.trim().toLowerCase();
    setSelected(ans);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore(s => s + 1);
  };

  const next = () => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setFillInput("");
      setFeedback(null);
    }
  };

  const stars = score >= questions.length ? 3 : score >= Math.ceil(questions.length / 2) ? 2 : 1;

  if (done) {
    return (
      <motion.div
        className="relative p-6 sm:p-10 max-w-lg mx-auto rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-2xl text-center"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)" }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Confetti */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: `${(i * 41) % 90}%`, top: -10 }}
            animate={{ y: ["0%", "120%"], opacity: [1, 0], rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)] }}
            transition={{ duration: 1.5 + (i % 3) * 0.3, delay: i * 0.1 }}
          >
            <span className="text-lg">{["🌟", "⭐", "✨", "🎉", "🏆", "💫"][i % 6]}</span>
          </motion.div>
        ))}

        <motion.div
          className="text-6xl mb-4"
          animate={{ y: [0, -15, 0, -8, 0] }}
          transition={{ duration: 1 }}
        >
          {score === questions.length ? "🦉" : score >= Math.ceil(questions.length / 2) ? "😊" : "😅"}
        </motion.div>

        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md mb-2">
          {score === questions.length ? "Perfect Score! 🎊" : "Quiz Done!"}
        </h2>
        <p className="text-white/80 mb-6">
          You got <span className="font-bold text-amber-300">{score}/{questions.length}</span> correct!
        </p>

        {/* Stars earned */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: i <= stars ? 1 : 0.6, rotate: 0 }}
              transition={{ delay: i * 0.15, type: "spring" }}
            >
              <Star
                className={`w-10 h-10 drop-shadow-lg ${i <= stars ? "text-amber-300 fill-amber-300" : "text-white/30"}`}
              />
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={onBack}
            className="px-5 py-2.5 rounded-2xl font-bold text-white border border-white/40 bg-white/10 backdrop-blur-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
          </motion.button>
          <motion.button
            onClick={() => onComplete(stars)}
            className="px-6 py-2.5 rounded-2xl font-display font-bold text-amber-950"
            style={{ background: "linear-gradient(135deg, #FFE0A3 0%, #FFB870 50%, #E89A4A 100%)", boxShadow: "0 8px 25px -5px rgba(255,170,80,0.6)" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Collect Rewards! 🚀
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative p-5 sm:p-8 max-w-lg mx-auto rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-2xl"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)" }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {/* Back */}
      <button onClick={onBack} className="text-primary font-bold text-sm hover:underline mb-4 block">
        ← Back
      </button>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-purple-400 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120 }}
          />
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span className="font-bold text-white text-sm">{score}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Question */}
          <div className="text-center mb-6">
            {q.emoji && <div className="text-5xl mb-3">{q.emoji}</div>}
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-white drop-shadow-md">
              {q.question}
            </h3>
            <p className="text-white/60 text-xs mt-1">Question {current + 1} of {questions.length}</p>
          </div>

          {/* MCQ Options */}
          {q.type === "mcq" && q.options && (
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt) => {
                const isCorrect = feedback && opt.toLowerCase() === q.answer.toLowerCase();
                const isWrong = feedback === "wrong" && opt === selected;
                return (
                  <motion.button
                    key={opt}
                    onClick={() => !feedback && checkAnswer(opt)}
                    className={`relative p-4 rounded-2xl border font-bold text-base text-white transition-all ${
                      isCorrect
                        ? "border-green-400 bg-green-500/30"
                        : isWrong
                        ? "border-red-400 bg-red-500/30"
                        : feedback
                        ? "border-white/20 bg-white/5 opacity-60"
                        : "border-white/40 bg-white/10 hover:bg-white/20"
                    }`}
                    whileHover={!feedback ? { scale: 1.03, y: -2 } : {}}
                    whileTap={!feedback ? { scale: 0.97 } : {}}
                    animate={isCorrect ? { scale: [1, 1.08, 1] } : isWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {isCorrect && <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-green-400" />}
                    {isWrong && <XCircle className="absolute top-2 right-2 w-4 h-4 text-red-400" />}
                    {opt}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Fill in blank */}
          {q.type === "fill" && (
            <div className="text-center">
              <input
                type="text"
                value={fillInput}
                onChange={e => setFillInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fillInput && !feedback && checkAnswer(fillInput)}
                placeholder="Type your answer..."
                disabled={!!feedback}
                className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/10 text-white placeholder:text-white/50 text-center text-lg font-bold focus:outline-none focus:border-amber-300 backdrop-blur-md transition-all"
                autoFocus
              />
              {!feedback && fillInput && (
                <motion.button
                  onClick={() => checkAnswer(fillInput)}
                  className="mt-3 px-8 py-2.5 rounded-2xl font-display font-bold text-amber-950"
                  style={{ background: "linear-gradient(135deg, #FFE0A3 0%, #FFB870 50%, #E89A4A 100%)" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Check!
                </motion.button>
              )}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <motion.div
              className={`mt-4 p-3 rounded-2xl text-center font-bold ${
                feedback === "correct"
                  ? "bg-green-500/20 border border-green-400/50 text-green-300"
                  : "bg-red-500/20 border border-red-400/50 text-red-300"
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {feedback === "correct" ? (
                <span>✅ Correct! Amazing! 🌟</span>
              ) : (
                <span>❌ Oops! The answer is: <strong className="text-white">{q.answer}</strong>{q.hint ? ` — ${q.hint}` : ""}</span>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Continue button */}
      {feedback && (
        <motion.button
          onClick={next}
          className="mt-5 w-full py-3 rounded-2xl font-display font-bold text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, rgba(130,60,220,0.7), rgba(200,80,180,0.7))", border: "1px solid rgba(255,255,255,0.3)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {current + 1 >= questions.length ? "See Results 🏆" : "Continue"} <ChevronRight className="w-5 h-5" />
        </motion.button>
      )}
    </motion.div>
  );
};

export default QuizScreen;
