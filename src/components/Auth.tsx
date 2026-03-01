import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  onLogin: (user: { email: string; name: string }) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onLogin({ 
      email, 
      name: isLogin ? (email.split('@')[0] || 'User') : name 
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 rounded-2xl mb-4 shadow-xl shadow-zinc-200">
            <Sparkles className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">ExpEra</h1>
          <p className="text-zinc-500 mt-2">Your AI Behavioral Decision Partner</p>
        </div>

        <div className="glass-card p-8 shadow-2xl shadow-zinc-200/50">
          <div className="flex gap-4 mb-8 p-1 bg-zinc-100 rounded-xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                isLogin ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                !isLogin ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <User size={14} /> Full Name
                </label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Mail size={14} /> Email Address
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Lock size={14} /> Password
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-bold transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-zinc-200"
            >
              {isLoading ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <ArrowRight size={20} />
                </motion.div>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            Secure, encrypted authentication
          </div>
        </div>
      </motion.div>
    </div>
  );
}
