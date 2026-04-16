import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChild } from '@/context/ChildContext';
import NavBar from '@/components/NavBar';
import FloatingBubbles from '@/components/FloatingBubbles';
import { MessageCircle, Send, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const botResponses: Record<string, string[]> = {
  hello: ["Hi there! 😊 I'm Buddy, your learning friend!", "Hey! Ready to learn something cool?", "Hello! How are you today? 🌟"],
  help: ["I can tell you fun facts, jokes, or help with math! What would you like?", "Sure! Ask me anything - I love helping!"],
  joke: [
    "Why did the math book look sad? Because it had too many problems! 😂",
    "What do you call a sleeping dinosaur? A dino-snore! 🦕😴",
    "Why did the teddy bear say no to dessert? Because she was already stuffed! 🧸",
  ],
  fact: [
    "Did you know? Honey never goes bad! They found 3000-year-old honey in Egypt! 🍯",
    "A group of flamingos is called a 'flamboyance'! 🦩",
    "Octopuses have three hearts! 🐙❤️❤️❤️",
  ],
  math: [
    "I love math! Try this: What's 7 + 5? (It's 12! 🎉)",
    "Fun math trick: multiply any number by 9, add the digits, and you always get 9! ✨",
  ],
  default: [
    "That's interesting! Tell me more! 🤔",
    "Cool! Want to hear a joke or a fun fact?",
    "I'm still learning! Try saying 'joke', 'fact', or 'help'! 😊",
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
    { role: 'bot', text: `Hi ${profile?.name || 'friend'}! 👋 I'm Buddy! Ask me for jokes, fun facts, or math help!` },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: getResponse(userMsg.text) }]);
      setIsTyping(false);
    }, 800 + Math.random() * 800);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <FloatingBubbles />
      <NavBar />

      <div className="page-shell-compact flex-1 flex flex-col w-full">
        <motion.div className="page-header mb-4" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gradient-primary flex items-center justify-center gap-2">
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-primary" /> Chat with Buddy
          </h1>
        </motion.div>

        <div ref={scrollRef} className="glass-card-strong flex-1 p-4 overflow-y-auto space-y-3 mb-4 max-h-[60vh]">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'bot' ? 'bg-gradient-to-br from-primary to-lavender' : 'bg-gradient-to-br from-sky to-mint'
              }`}>
                {msg.role === 'bot' ? <Bot className="w-4 h-4 text-primary-foreground" /> : <User className="w-4 h-4 text-primary-foreground" />}
              </div>
              <div className={`glass-card px-4 py-2 max-w-[85%] sm:max-w-[75%] ${
                msg.role === 'user' ? 'bg-primary/10' : ''
              }`}>
                <p className="text-sm font-body">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-lavender flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="glass-card px-4 py-2 flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="glass-card-strong p-2 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Say something to Buddy..."
            className="flex-1 px-4 py-2 rounded-xl bg-transparent text-foreground focus:outline-none font-body"
          />
          <motion.button
            onClick={sendMessage}
            className="glossy-btn p-3 text-primary-foreground"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
