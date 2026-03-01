import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, User, Bot, RefreshCw, MessageCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function ChatBestie() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Yo! Main hoon tera ExpEra Bestie. ✨ Koi tension hai? Budget tight hai ya life mein chaos chal raha hai? Chill maar aur bata, no pressure, no hurry. Hum milke solve karenge. Kya scene hai? 🤙"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are "ExpEra Bestie", a Gen Z AI assistant for a student decision-making app. 
          Your vibe is:
          - Use "Gen Z Hinglish" (mix of Hindi, English, and Gen Z slang like "no cap", "bet", "slay", "delulu", "rent is due", "W or L").
          - Be a supportive, chill best friend.
          - Help the user make decisions (financial, academic, life) without making them feel pressured or rushed.
          - If they are stressed, tell them to take a breath.
          - Keep responses punchy and relatable.
          - Use emojis naturally.
          - Your goal is to be a "safe space" for their chaotic thoughts.`,
        },
      });

      // Send the whole history for context
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `You are "ExpEra Bestie", a Gen Z AI assistant for a student decision-making app. 
          Your vibe is:
          - Use "Gen Z Hinglish" (mix of Hindi, English, and Gen Z slang like "no cap", "bet", "slay", "delulu", "rent is due", "W or L").
          - Be a supportive, chill best friend.
          - Help the user make decisions (financial, academic, life) without making them feel pressured or rushed.
          - If they are stressed, tell them to take a breath.
          - Keep responses punchy and relatable.
          - Use emojis naturally.
          - Your goal is to be a "safe space" for their chaotic thoughts.`,
        }
      });

      const aiText = response.text || "Bhai, network ka scene thoda off hai. Phir se bol?";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Oops, brain freeze ho gaya! 🧊 Phir se try kar?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-bottom border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 leading-tight">ExpEra Bestie</h3>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Always Vibe Checkin'</p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'model', text: "Yo! Naya start? Kya scene hai?" }])}
          className="p-2 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-400"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                m.role === 'user' ? "bg-zinc-900 text-white" : "bg-emerald-100 text-emerald-600"
              )}>
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                m.role === 'user' 
                  ? "bg-zinc-900 text-white rounded-tr-none" 
                  : "bg-zinc-50 text-zinc-800 rounded-tl-none border border-zinc-100"
              )}>
                <div className="markdown-body chat-markdown">
                  <Markdown>{m.text}</Markdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 mr-auto"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <RefreshCw size={14} className="animate-spin" />
            </div>
            <div className="bg-zinc-50 p-4 rounded-2xl rounded-tl-none border border-zinc-100">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-zinc-100">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Kuch bhi bol, no judgment..."
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 pr-14 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute right-2 p-2.5 rounded-xl transition-all",
              input.trim() && !isLoading 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:scale-105" 
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
            )}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-center text-zinc-400 mt-3 font-medium uppercase tracking-widest">
          Chill vibe only • No pressure • Just talk
        </p>
      </div>
    </div>
  );
}
