import { useState, useEffect } from "react";
import { Play, Square, ChevronLeft, ChevronRight, CheckCircle, XCircle, RotateCcw, Volume2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AdminLessonFull, AdminLessonCard, AdminQuizQuestion } from "@/lib/adminApi";
import { speakText, stopSpeaking, isSpeaking } from "@/lib/tts.service";

interface LessonPreviewProps {
  lesson: Partial<AdminLessonFull> & { language?: { code: string; name: string } };
}

export default function LessonPreview({ lesson }: LessonPreviewProps) {
  const cards = lesson.cards || [];
  const quiz = lesson.quizzes?.[0]?.questions || [];
  const langCode = lesson.language?.code || "en";

  const [mode, setMode] = useState<"cards" | "quiz">("cards");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<"correct" | "incorrect" | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(0.8);
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  // Stop speaking when component unmounts or slide changes
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [currentCardIndex, mode]);

  const handleSpeak = (card: AdminLessonCard) => {
    if (speakingWordId === card.id) {
      stopSpeaking();
      setSpeakingWordId(null);
      return;
    }

    setSpeakingWordId(card.id);
    speakText(card.word, langCode, {
      rate: ttsSpeed,
      onEnd: () => setSpeakingWordId(null),
      onError: () => setSpeakingWordId(null),
    });
  };

  const handleSpeakMeaning = (card: AdminLessonCard) => {
    if (!card.meaning) return;
    if (speakingWordId === `${card.id}_meaning`) {
      stopSpeaking();
      setSpeakingWordId(null);
      return;
    }

    setSpeakingWordId(`${card.id}_meaning`);
    speakText(card.meaning, langCode, {
      rate: ttsSpeed,
      onEnd: () => setSpeakingWordId(null),
      onError: () => setSpeakingWordId(null),
    });
  };

  const handleAnswerSelect = (option: string, answer: string) => {
    if (selectedAnswer !== null) return; // Already answered this question
    setSelectedAnswer(option);

    if (option === answer) {
      setAnswerStatus("correct");
      setQuizScore((s) => s + 1);
    } else {
      setAnswerStatus("incorrect");
    }
  };

  const nextQuizQuestion = () => {
    setSelectedAnswer(null);
    setAnswerStatus(null);
    if (currentQuizIndex < quiz.length - 1) {
      setCurrentQuizIndex((idx) => idx + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setAnswerStatus(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const activeCard = cards[currentCardIndex];
  const activeQuestion = quiz[currentQuizIndex];
  const progressPercent =
    mode === "cards"
      ? cards.length > 0
        ? ((currentCardIndex + 1) / cards.length) * 100
        : 0
      : quiz.length > 0
      ? ((currentQuizIndex + (selectedAnswer !== null ? 1 : 0)) / quiz.length) * 100
      : 0;

  return (
    <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col h-[520px] max-w-md mx-auto relative">
      {/* Phone status bar look */}
      <div className="bg-slate-950 px-4 py-2 flex justify-between items-center text-xs font-semibold text-slate-400 select-none border-b border-slate-800/60">
        <span className="flex items-center gap-1">
          🌍 {lesson.title || "Lesson Preview"}
          <Badge className="bg-indigo-600/30 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 text-[9px] scale-90 px-1 py-0 ml-1">
            {lesson.language?.name || "EN"}
          </Badge>
        </span>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">SIMULATOR</span>
        </div>
      </div>

      {/* Simulator header controls */}
      <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-800/40 z-10">
        <div className="flex gap-1 bg-slate-950 p-1 rounded-lg">
          <button
            onClick={() => setMode("cards")}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
              mode === "cards" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Lesson Cards
          </button>
          <button
            onClick={() => {
              setMode("quiz");
              resetQuiz();
            }}
            disabled={quiz.length === 0}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === "quiz" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Quiz Play
          </button>
        </div>

        {/* TTS speed slider */}
        {mode === "cards" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] text-slate-400">TTS Rate</span>
            <div className="w-20">
              <Slider
                min={0.5}
                max={1.5}
                step={0.1}
                value={[ttsSpeed]}
                onValueChange={(val) => setTtsSpeed(val[0])}
                className="my-1"
              />
            </div>
            <span className="text-[10px] font-mono text-slate-300 w-6 text-right">{ttsSpeed.toFixed(1)}x</span>
          </div>
        )}
      </div>

      {/* Simulator Screen Content */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-center bg-slate-950/40">
        {mode === "cards" && cards.length > 0 && activeCard && (
          <div className="space-y-6 flex flex-col justify-center h-full max-w-sm mx-auto w-full animate-in fade-in zoom-in-95 duration-200">
            {/* Main Interactive card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center space-y-4 relative min-h-[300px] justify-between">
              {/* Media Thumbnail */}
              <div className="w-full flex justify-center">
                {activeCard.imageUrl ? (
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                    <img src={activeCard.imageUrl} alt={activeCard.word} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-indigo-950/40 border border-indigo-900/30 flex items-center justify-center text-6xl shadow-inner shadow-indigo-950">
                    {activeCard.emoji || "📚"}
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
                  {activeCard.word}
                  <button
                    onClick={() => handleSpeak(activeCard)}
                    className={`p-1.5 rounded-full transition-all ${
                      speakingWordId === activeCard.id
                        ? "bg-indigo-600 text-white animate-pulse"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </h3>
                {activeCard.translit && (
                  <p className="text-sm text-indigo-400 font-medium italic">{activeCard.translit}</p>
                )}
                {activeCard.meaning && (
                  <p className="text-sm text-slate-300 max-w-xs px-2 flex items-center justify-center gap-1.5 mt-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800/40">
                    <span className="leading-tight text-center flex-1">{activeCard.meaning}</span>
                    <button
                      onClick={() => handleSpeakMeaning(activeCard)}
                      className={`p-1 rounded-md transition-all flex-shrink-0 ${
                        speakingWordId === `${activeCard.id}_meaning`
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </p>
                )}
              </div>

              {/* Card index indicators */}
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Card {currentCardIndex + 1} of {cards.length}
              </div>
            </div>

            {/* Bottom Slider Nav */}
            <div className="flex justify-between items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                disabled={currentCardIndex === 0}
                onClick={() => setCurrentCardIndex((i) => i - 1)}
                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex-1 flex gap-1 justify-center">
                {cards.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentCardIndex ? "w-6 bg-indigo-500" : "w-1.5 bg-slate-800"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                disabled={currentCardIndex === cards.length - 1}
                onClick={() => setCurrentCardIndex((i) => i + 1)}
                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {mode === "cards" && cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-6">
            <span className="text-4xl mb-3">📭</span>
            <p className="text-sm font-semibold text-slate-300">No cards in this lesson</p>
            <p className="text-xs text-slate-500 mt-1">Please add cards in Step 2 to preview the lesson slideshow.</p>
          </div>
        )}

        {mode === "quiz" && quiz.length > 0 && !quizFinished && activeQuestion && (
          <div className="space-y-5 flex flex-col justify-center h-full max-w-sm mx-auto w-full animate-in fade-in duration-200">
            {/* Question Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">
                  Question {currentQuizIndex + 1} of {quiz.length}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {activeQuestion.points} pts
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-100 flex items-start gap-2">
                <span className="text-xl flex-shrink-0">{activeQuestion.emoji || "❓"}</span>
                <span>{activeQuestion.question}</span>
              </h4>

              {/* Options Grid */}
              <div className="flex flex-col gap-2.5 pt-2">
                {activeQuestion.options?.map((option, optIdx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option === activeQuestion.answer;
                  const showSuccess = selectedAnswer !== null && isCorrectAnswer;
                  const showFailure = isSelected && !isCorrectAnswer;

                  return (
                    <button
                      key={optIdx}
                      disabled={selectedAnswer !== null}
                      onClick={() => handleAnswerSelect(option, activeQuestion.answer)}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all duration-200 flex items-center justify-between ${
                        showSuccess
                          ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold"
                          : showFailure
                          ? "bg-rose-950/60 border-rose-500 text-rose-300 font-bold"
                          : isSelected
                          ? "border-indigo-500 bg-indigo-950/50"
                          : "border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200"
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="truncate">{option}</span>
                      </span>

                      {/* Result Icons */}
                      {showSuccess && <CheckCircle className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0 ml-2" />}
                      {showFailure && <XCircle className="w-4.5 h-4.5 text-rose-400 flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation box */}
            {selectedAnswer !== null && activeQuestion.explanation && (
              <div className="bg-slate-900/50 border border-slate-800/50 p-3 rounded-2xl text-xs text-slate-400 flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-bold text-slate-300 mr-1">Explanation:</span>
                  {activeQuestion.explanation}
                </p>
              </div>
            )}

            {/* Next question Button */}
            {selectedAnswer !== null && (
              <Button
                onClick={nextQuizQuestion}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-md h-10 font-bold animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                {currentQuizIndex < quiz.length - 1 ? "Next Question" : "Finish Quiz"}
              </Button>
            )}
          </div>
        )}

        {/* Quiz Finished State */}
        {mode === "quiz" && quizFinished && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-4xl shadow-lg relative">
              <Sparkles className="absolute -top-1 -right-1 text-yellow-400 w-6 h-6 animate-bounce" />
              🎉
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-slate-100">Quiz Completed!</h4>
              <p className="text-xs text-slate-400">Awesome learning adventure.</p>
            </div>

            {/* Score box */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 w-full max-w-[280px]">
              <div className="text-xs text-slate-500 font-semibold uppercase">Your Score</div>
              <div className="text-3xl font-extrabold text-indigo-400 mt-1">
                {quizScore} / {quiz.length}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium mt-1">
                +{quizScore * 10} Stars Rewarded!
              </div>
            </div>

            <Button
              onClick={resetQuiz}
              variant="outline"
              className="rounded-xl border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Simulator screen footer progress */}
      <div className="p-3 bg-slate-900 border-t border-slate-800/60 z-10 flex flex-col gap-2">
        <Progress value={progressPercent} className="h-1.5 bg-slate-950" />
      </div>
    </div>
  );
}
