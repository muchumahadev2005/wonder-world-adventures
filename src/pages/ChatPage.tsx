import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChild } from "@/context/ChildContext";
import NavBar from "@/components/NavBar";
import SceneBackground from "@/components/SceneBackground";
import AmbientSoundToggle from "@/components/AmbientSoundToggle";
import chatBg from "@/assets/chat-bg.jpg";
import { MessageCircle, Send, User } from "lucide-react";

interface Message {
  role: "user" | "bot";
  text: string;
}

const suggestions = [
  { label: "📖 Tell me a story", send: "Tell me a story" },
  { label: "📚 Help me learn", send: "Help me learn something new" },
  { label: "🎮 Play a game", send: "Let's play a word game" },
  { label: "😂 Tell a joke", send: "Tell me a funny joke" },
  { label: "🤔 Fun fact", send: "Tell me a fun fact" },
  { label: "➕ Math help", send: "Help me with math" },
];

const botResponses: Record<string, string[]> = {
  "tell me a story": [
    "🌟 Once upon a time, a little owl named Ollie lived in a cozy tree! Every night he would read books under the moonlight. One day he found a magical bookmark that could bring any story to life! Want to hear more? Go to the Stories section! 📚",
    "🐉 In a land far away, there was a friendly dragon who could breathe rainbow fire! His name was Sparky and he loved making art with his colorful flames. Shall we go read the full story in Stories? 🌈",
  ],
  "help me learn": [
    "🎓 Great idea! Here are some ways I can help:\n• Go to **Learn** to study words with lessons!\n• Go to **Stories** to read and take quizzes!\n• Go to **Games** to play learning games!\n\nWhich one sounds fun? 😊",
  ],
  "word game": [
    "🎮 Let's play! I'm thinking of an animal that says MOO 🐄. What is it?\n\n(Type your answer and I'll tell you if you're right!) 🌟",
    "🎮 Word game time! Complete this word: EL _ _ HANT 🐘 (Hint: It's a BIG animal!)",
  ],
  "joke": [
    "😂 Why did the math book look sad? Because it had too many PROBLEMS! 🤣",
    "😄 What do you call a sleeping dinosaur? A dino-SNORE! 🦕😴",
    "🤣 Why don't scientists trust atoms? Because they make up everything! ⚗️",
    "😂 What do you call a fish without eyes? A FSH! 🐟",
  ],
  "fact": [
    "🌍 Cool fact! Honey never goes bad! Archaeologists found 3,000-year-old honey in Egyptian pyramids and it was still tasty! 🍯",
    "🐙 Did you know octopuses have THREE hearts? And their blood is BLUE! How cool is that! 💙",
    "🦒 A giraffe's tongue is dark purple and about 45cm long! They use it to grab leaves from tall trees! 🌿",
  ],
  "math": [
    "➕ Math is fun! Try this: What is 6 × 7? Take your time! (It's 42! 🎉)\n\nHere's a trick: 6 × 7 is the same as 6 × 6 + 6 = 36 + 6 = 42! ✨",
    "🧮 Did you know? If you multiply any number by 9 and add up the digits of the answer, you always get 9! Try it with 9 × 5 = 45 → 4+5 = 9! 🤯",
  ],
  cow: ["🐄 Yes! A cow says MOO! Great job! You win a virtual star! ⭐"],
  elephant: ["🐘 Amazing! ELEPHANT is right! You're super smart! 🌟"],
  default: [
    "That's interesting! I'm Ollie the owl 🦉 and I love learning! Try saying 'tell me a story', 'joke', or 'fun fact'! 😊",
    "Hmmm, let me think... 🤔 I know! Want to hear a joke or a fun fact? Just ask! 🌟",
    "You're so curious! I love that! 🦉 Try clicking one of the suggestion buttons below for something fun! ✨",
  ],
};

const getResponse = (input: string): string => {
  const lower = input.toLowerCase();
  for (const [key, responses] of Object.entries(botResponses)) {
    if (lower.includes(key)) return responses[Math.floor(Math.random() * responses.length)];
  }
  return botResponses.default[Math.floor(Math.random() * botResponses.default.length)];
};

const ChatPage = () => {
  const { profile } = useChild();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: `Hi ${profile?.name || "friend"}! 👋 I'm Ollie the Owl! 🦉 I'm here to help you learn, tell stories, and have fun! What would you like to do today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    const userMsg: Message = { role: "user", text: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setShowSuggestions(false);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: "bot", text: getResponse(msg) }]);
      setIsTyping(false);
    }, 800 + Math.random() * 800);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <SceneBackground image={chatBg} alt="Cozy magical treehouse interior at night" variant="treehouse" />
      <NavBar />
      <AmbientSoundToggle />

      <div className="page-shell-compact flex-1 flex flex-col w-full">
        <motion.div
          className="page-header mb-4"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2 drop-shadow-md">
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" /> Chat with Ollie
          </h1>
        </motion.div>

        {/* Chat window */}
        <div
          ref={scrollRef}
          className="relative flex-1 p-4 overflow-y-auto space-y-3 mb-3 max-h-[52vh] rounded-[32px] border border-white/40 shadow-2xl backdrop-blur-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base ${
                  msg.role === "bot"
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg"
                    : "bg-gradient-to-br from-sky to-mint"
                }`}
              >
                {msg.role === "bot" ? "🦉" : <User className="w-4 h-4 text-primary-foreground" />}
              </div>

              <div
                className={`px-4 py-2.5 max-w-[85%] sm:max-w-[75%] rounded-2xl border border-white/40 backdrop-blur-md ${
                  msg.role === "user" ? "bg-primary/20 text-white" : "bg-white/10 text-white"
                }`}
                style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
              >
                <p className="text-sm font-body whitespace-pre-line leading-relaxed">{msg.text}</p>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg text-base">
                🦉
              </div>
              <div className="px-4 py-2 rounded-2xl border border-white/40 bg-white/10 backdrop-blur-md flex gap-1 items-center">
                <span className="text-white/60 text-xs mr-1">Ollie is thinking</span>
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 bg-amber-300 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Suggestion chips */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              className="flex flex-wrap gap-2 mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {suggestions.map(s => (
                <motion.button
                  key={s.label}
                  onClick={() => sendMessage(s.send)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/40 backdrop-blur-md transition-all"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                  whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.22)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  {s.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <div
          className="relative p-2 flex gap-2 rounded-2xl border border-white/40 shadow-xl backdrop-blur-2xl"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Say something to Ollie..."
            className="flex-1 px-4 py-2 rounded-xl bg-transparent text-white placeholder:text-white/60 focus:outline-none font-body font-bold"
          />
          <motion.button
            onClick={() => sendMessage()}
            className="glossy-btn p-3 text-primary-foreground"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Re-show suggestions button */}
        {!showSuggestions && (
          <button
            onClick={() => setShowSuggestions(true)}
            className="mt-2 text-center text-white/50 text-xs hover:text-white transition-colors"
          >
            💡 Show suggestions
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
