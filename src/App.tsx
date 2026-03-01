import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Clock, 
  BookOpen, 
  Smile, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Info,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Shield,
  Timer,
  Unlock
} from 'lucide-react';
import { cn } from './lib/utils';
import { getAIExplanation, getDNAInsight, getRegretInsight } from './services/aiService';
import Auth from './components/Auth';
import Markdown from 'react-markdown';
import ChatBestie from './components/ChatBestie';

type RecommendationType = 'Recommended' | 'Risky' | 'Not Recommended';
type DNAStatusType = 'Balanced Week' | 'Moderate Load' | 'High Load Alert';
type RegretStatusType = 'High Emotional Purchase' | 'Think Before Buying' | 'Safe Purchase';

interface UserData {
  email: string;
  name: string;
}

interface DecisionResult {
  score: number;
  recommendation: RecommendationType;
  explanation: string;
}

interface DNAResult {
  score: number;
  status: DNAStatusType;
  insight: string;
}

interface RegretResult {
  score: number;
  status: RegretStatusType;
  insight: string;
}

interface HistoryItem {
  id: string;
  type: 'optimizer' | 'dna' | 'regret';
  date: string;
  score: number;
  status: string;
  title: string;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'optimizer' | 'dna' | 'regret'>('home');
  const [currency] = useState<Currency>(CURRENCIES[0]);
  
  // Feature 1: Optimizer State
  const [budget, setBudget] = useState<number>(0);
  const [savings, setSavings] = useState<number>(0);
  const [assignments, setAssignments] = useState<number>(0);
  const [freeHours, setFreeHours] = useState<number>(0);
  const [eventCost, setEventCost] = useState<number>(0);
  const [mood, setMood] = useState<string>('');
  const [result, setResult] = useState<DecisionResult | null>(null);

  // Feature 2: Decision DNA State
  const [deadlines, setDeadlines] = useState<number>(0);
  const [eventsCount, setEventsCount] = useState<number>(0);
  const [dnaFreeHours, setDnaFreeHours] = useState<number>(0);
  const [sleepHours, setSleepHours] = useState<number>(0);
  const [dnaMood, setDnaMood] = useState<string>('');
  const [customRequirements, setCustomRequirements] = useState<string>('');
  const [dnaResult, setDnaResult] = useState<DNAResult | null>(null);

  // Feature 3: Regret Shield State
  const [itemName, setItemName] = useState<string>('');
  const [itemCost, setItemCost] = useState<number>(0);
  const [remainingBudget, setRemainingBudget] = useState<number>(0);
  const [recentSpending, setRecentSpending] = useState<number>(0);
  const [alternativeSpending, setAlternativeSpending] = useState<string>('');
  const [regretMood, setRegretMood] = useState<string>('');
  const [regretResult, setRegretResult] = useState<RegretResult | null>(null);
  const [coolingTimer, setCoolingTimer] = useState<number | null>(null);
  const [isOverridden, setIsOverridden] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (coolingTimer !== null && coolingTimer > 0) {
      interval = setInterval(() => {
        setCoolingTimer(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [coolingTimer]);

  const burnoutRisk = useMemo(() => {
    // Risk increases with assignments and decreases with free hours
    const workloadFactor = (assignments / 10) * 100;
    const restFactor = (freeHours / 40) * 100;
    const risk = Math.max(0, Math.min(100, workloadFactor - (restFactor / 2) + 20));
    return Math.round(risk);
  }, [assignments, freeHours]);

  const calculateFeasibility = async () => {
    setIsAnalyzing(true);
    
    // Logic from PRD:
    // Feasibility Score = (Budget Score × 0.4) + (Free Time × 0.3) – (Workload × 0.3)
    
    // Normalize Budget Score (0-100)
    // If cost is 0, score is 100. If cost > budget + savings, score is 0.
    const totalAvailable = budget + savings;
    const budgetScore = totalAvailable > 0 
      ? Math.max(0, Math.min(100, ((totalAvailable - eventCost) / totalAvailable) * 100))
      : (eventCost > 0 ? 0 : 100);
    
    const freeTimeScore = Math.max(0, Math.min(100, (freeHours / 40) * 100));
    const workloadScore = Math.max(0, Math.min(100, (assignments / 10) * 100));
    
    // Strictly follow PRD formula: (Budget Score × 0.4) + (Free Time × 0.3) – (Workload × 0.3)
    const score = Math.round((budgetScore * 0.4) + (freeTimeScore * 0.3) - (workloadScore * 0.3)); 
    
    const finalScore = Math.max(0, Math.min(100, score));

    let recommendation: RecommendationType = 'Not Recommended';
    if (finalScore >= 70) recommendation = 'Recommended';
    else if (finalScore >= 40) recommendation = 'Risky';

    const explanation = await getAIExplanation({
      budget,
      savings,
      assignments,
      freeHours,
      eventCost,
      mood,
      score: finalScore,
      recommendation,
      currencySymbol: currency.symbol
    });

    setResult({
      score: finalScore,
      recommendation,
      explanation
    });

    setHistory(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      type: 'optimizer' as const,
      date: new Date().toLocaleTimeString(),
      score: finalScore,
      status: recommendation,
      title: eventCost > 0 ? `Event (${currency.symbol}${eventCost})` : 'Quick Check'
    }, ...prev].slice(0, 5));

    setIsAnalyzing(false);
  };

  const calculateStressScore = async () => {
    setIsAnalyzing(true);
    
    // Stress Score = (deadlines × 5) + (events × 4) – (free hours × 2) – (sleep hours × 3)
    const rawScore = (deadlines * 5) + (eventsCount * 4) - (dnaFreeHours * 2) - (sleepHours * 3);
    
    // Normalize to 0-100. 
    // Max possible raw: (10*5) + (10*4) - (0*2) - (0*3) = 90
    // Min possible raw: (0*5) + (0*4) - (40*2) - (12*3) = -116
    // Let's use a simpler normalization for MVP
    const normalizedScore = Math.max(0, Math.min(100, rawScore + 50)); 
    
    let status: DNAStatusType = 'Balanced Week';
    if (normalizedScore >= 70) status = 'High Load Alert';
    else if (normalizedScore >= 40) status = 'Moderate Load';

    const insight = await getDNAInsight({
      deadlines,
      events: eventsCount,
      freeHours: dnaFreeHours,
      sleepHours,
      mood: dnaMood,
      custom: customRequirements,
      score: normalizedScore,
      status
    });

    setDnaResult({
      score: normalizedScore,
      status,
      insight
    });

    setHistory(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      type: 'dna' as const,
      date: new Date().toLocaleTimeString(),
      score: normalizedScore,
      status: status,
      title: 'Burnout Scan'
    }, ...prev].slice(0, 5));

    setIsAnalyzing(false);
  };

  const calculateRegretIndex = async () => {
    setIsAnalyzing(true);
    setIsOverridden(false);
    
    // Regret Index Formula :
    // Financial Risk = (Item Cost ÷ Remaining Budget) × 100
    const financialRisk = remainingBudget > 0 ? (itemCost / remainingBudget) * 100 : (itemCost > 0 ? 100 : 0);
    
    // Emotional Score = (Stress Score × 0.7) + (Mood Intensity × 0.3)
    // We'll use the current DNA stress score if available, otherwise 50
    const currentStress = dnaResult ? dnaResult.score : 50;
    const moodIntensity = regretMood.length > 0 ? 80 : 40; // Simple heuristic for MVP
    const emotionalScore = (currentStress * 0.7) + (moodIntensity * 0.3);
    
    // Regret Index = (Financial Risk × 0.5) + (Emotional Score × 0.5)
    const regretIndex = Math.round((financialRisk * 0.5) + (emotionalScore * 0.5));
    const finalScore = Math.max(0, Math.min(100, regretIndex));
    
    let status: RegretStatusType = 'Safe Purchase';
    if (finalScore >= 70) status = 'High Emotional Purchase';
    else if (finalScore >= 40) status = 'Think Before Buying';

    const insight = await getRegretInsight({
      itemName,
      itemCost,
      remainingBudget,
      recentSpending,
      mood: regretMood,
      stressScore: currentStress,
      regretIndex: finalScore,
      status,
      alternative: alternativeSpending,
      currencySymbol: currency.symbol
    });

    setRegretResult({
      score: finalScore,
      status,
      insight
    });

    if (finalScore >= 70) {
      setCoolingTimer(60); // 60 seconds cooling period
    } else {
      setCoolingTimer(null);
    }

    setHistory(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      type: 'regret' as const,
      date: new Date().toLocaleTimeString(),
      score: finalScore,
      status: status,
      title: itemName ? `Regret Check: ${itemName}` : `Regret Check (${currency.symbol}${itemCost})`
    }, ...prev].slice(0, 5));

    setIsAnalyzing(false);
  };

  const reset = () => {
    setResult(null);
    setDnaResult(null);
    setRegretResult(null);
    setMood('');
    setDnaMood('');
    setRegretMood('');
    setItemName('');
    setCustomRequirements('');
    setAlternativeSpending('');
    setCoolingTimer(null);
    setIsOverridden(false);
  };

  const logout = () => {
    setUser(null);
    reset();
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 lg:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                ExpEra <span className="text-emerald-500 text-sm font-mono bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">MVP v1.0</span>
              </h1>
              <p className="text-zinc-500 mt-2">AI-driven behavioral intelligence for your life decisions.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Welcome back</span>
                <span className="text-sm font-bold text-zinc-900">{user.name}</span>
              </div>

              <div className="hidden md:flex items-center gap-4 text-sm text-zinc-400">
                <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Budget</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Time</span>
              </div>

              <button 
                onClick={logout}
                className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-rose-500 transition-all"
                title="Logout"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm flex gap-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('home')}
              className={cn(
                "px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'home' ? "bg-zinc-900 text-white shadow-lg" : "bg-white text-zinc-500 hover:bg-zinc-100"
              )}
            >
              <Smile size={18} />
              Home (Bestie Chat)
            </button>
            <button 
              onClick={() => setActiveTab('optimizer')}
              className={cn(
                "px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'optimizer' ? "bg-zinc-900 text-white shadow-lg" : "bg-white text-zinc-500 hover:bg-zinc-100"
              )}
            >
              <TrendingUp size={18} />
              Life AutoPilot
            </button>
            <button 
              onClick={() => setActiveTab('dna')}
              className={cn(
                "px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'dna' ? "bg-zinc-900 text-white shadow-lg" : "bg-white text-zinc-500 hover:bg-zinc-100"
              )}
            >
              <BookOpen size={18} />
              Decision DNA
            </button>
            <button 
              onClick={() => setActiveTab('regret')}
              className={cn(
                "px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'regret' ? "bg-zinc-900 text-white shadow-lg" : "bg-white text-zinc-500 hover:bg-zinc-100"
              )}
            >
              <Shield size={18} />
              AI Regret Shield
            </button>
          </nav>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Input Section */}
          <div className={cn(
            activeTab === 'home' ? "lg:col-span-12" : "lg:col-span-7",
            "space-y-6"
          )}>
            {activeTab === 'home' ? (
              <ChatBestie />
            ) : (
              <div className="glass-card p-6 md:p-8 space-y-8">
                <div className="flex items-center gap-2 text-zinc-900 font-semibold border-b border-zinc-100 pb-4">
                  <Sparkles size={20} className="text-emerald-500" />
                  <h2>
                    {activeTab === 'optimizer' ? 'Life AutoPilot Context' : 
                     activeTab === 'dna' ? 'Burnout DNA Profile' : 
                     'Purchase Shield Profile'}
                  </h2>
                </div>

                {activeTab === 'optimizer' ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Budget */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Wallet size={14} /> Monthly Budget
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono">{currency.symbol}</span>
                        <input 
                          type="number" 
                          value={budget}
                          onChange={(e) => setBudget(Number(e.target.value))}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Savings */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <TrendingUp size={14} /> Current Savings
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono">{currency.symbol}</span>
                        <input 
                          type="number" 
                          value={savings}
                          onChange={(e) => setSavings(Number(e.target.value))}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Assignments */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <BookOpen size={14} /> Pending Assignments
                      </label>
                      <input 
                        type="number" 
                        value={assignments}
                        onChange={(e) => setAssignments(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                      />
                    </div>

                    {/* Free Hours */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Clock size={14} /> Weekly Free Hours
                      </label>
                      <input 
                        type="number" 
                        value={freeHours}
                        onChange={(e) => setFreeHours(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Event Cost */}
                  <div className="space-y-2 pt-4 border-t border-zinc-100">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <ChevronRight size={14} /> Event / Trip Cost
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono">{currency.symbol}</span>
                      <input 
                        type="number" 
                        value={eventCost}
                        onChange={(e) => setEventCost(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-4 pl-8 pr-4 text-lg font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Mood */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Smile size={14} /> How are you feeling? (Optional)
                    </label>
                    <textarea 
                      placeholder="e.g., Feeling a bit burnt out, need a break..."
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 min-h-[100px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <button 
                    onClick={calculateFeasibility}
                    disabled={isAnalyzing}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-2",
                      isAnalyzing ? "bg-zinc-400 cursor-not-allowed" : "bg-zinc-900 hover:bg-zinc-800 shadow-lg shadow-zinc-200"
                    )}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        Vibe check ho raha hai...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Life AutoPilot Karle 🚀
                      </>
                    )}
                  </button>
                </div>
              ) : activeTab === 'dna' ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Deadlines */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <AlertTriangle size={14} /> Deadlines this Week
                      </label>
                      <input 
                        type="number" 
                        value={deadlines}
                        onChange={(e) => setDeadlines(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                      />
                    </div>

                    {/* Events */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Info size={14} /> Events / Meetings
                      </label>
                      <input 
                        type="number" 
                        value={eventsCount}
                        onChange={(e) => setEventsCount(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                      />
                    </div>

                    {/* Free Hours */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Clock size={14} /> Daily Free Hours
                      </label>
                      <input 
                        type="number" 
                        value={dnaFreeHours}
                        onChange={(e) => setDnaFreeHours(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                      />
                    </div>

                    {/* Sleep Hours */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <XCircle size={14} className="rotate-45" /> Avg Sleep Hours
                      </label>
                      <input 
                        type="number" 
                        value={sleepHours}
                        onChange={(e) => setSleepHours(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Mood */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Smile size={14} /> Current Mood
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g., Stressed, Excited, Tired..."
                      value={dnaMood}
                      onChange={(e) => setDnaMood(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  {/* Custom Requirements */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Info size={14} /> Custom Requirements / Notes
                    </label>
                    <textarea 
                      placeholder="Any specific needs or context for this week..."
                      value={customRequirements}
                      onChange={(e) => setCustomRequirements(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 min-h-[100px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <button 
                    onClick={calculateStressScore}
                    disabled={isAnalyzing}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-2",
                      isAnalyzing ? "bg-zinc-400 cursor-not-allowed" : "bg-zinc-900 hover:bg-zinc-800 shadow-lg shadow-zinc-200"
                    )}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        DNA Decode ho raha hai...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Burnout DNA Check Karle
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Item Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Sparkles size={14} /> What are you buying?
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g., New Sneakers, Gaming Console, Coffee..."
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Item Cost */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Wallet size={14} /> Item Cost
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono">{currency.symbol}</span>
                        <input 
                          type="number" 
                          value={itemCost}
                          onChange={(e) => setItemCost(Number(e.target.value))}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Remaining Budget */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <TrendingUp size={14} /> Remaining Budget
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono">{currency.symbol}</span>
                        <input 
                          type="number" 
                          value={remainingBudget}
                          onChange={(e) => setRemainingBudget(Number(e.target.value))}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Recent Spending */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Clock size={14} /> Recent Spending (Last 7 Days)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono">{currency.symbol}</span>
                        <input 
                          type="number" 
                          value={recentSpending}
                          onChange={(e) => setRecentSpending(Number(e.target.value))}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Mood */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Smile size={14} /> How's the Vibe? 🎭
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g., Bored, Sad, Impulsive..."
                        value={regretMood}
                        onChange={(e) => setRegretMood(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Alternative Spending */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Info size={14} /> What's the better move? 🤨
                    </label>
                    <textarea 
                      placeholder="e.g., Save for travel, pay rent, buy books..."
                      value={alternativeSpending}
                      onChange={(e) => setAlternativeSpending(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 min-h-[80px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <button 
                    onClick={calculateRegretIndex}
                    disabled={isAnalyzing}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-2",
                      isAnalyzing ? "bg-zinc-400 cursor-not-allowed" : "bg-zinc-900 hover:bg-zinc-800 shadow-lg shadow-zinc-200"
                    )}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        Dekh rahe hain kitne delulu ho...
                      </>
                    ) : (
                      <>
                        <Shield size={20} />
                        Check the Vibe Karle 💅
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

          {/* Result Section */}
          {activeTab !== 'home' && (
            <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {activeTab === 'optimizer' ? (
                !result ? (
                  <motion.div 
                    key="empty-opt"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="glass-card p-8 h-full flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2"
                  >
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                      <Info size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">Optimizer Input Ka Wait Hai</h3>
                      <p className="text-zinc-500 text-sm max-w-[200px] mx-auto">Budget aur time details bharo, trip W hai ya L dekhte hain.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="result-opt"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {/* Score Card */}
                    <div className={cn(
                      "glass-card p-8 text-center space-y-6 overflow-hidden relative",
                      result.recommendation === 'Recommended' ? "border-emerald-200 bg-emerald-50/30" :
                      result.recommendation === 'Risky' ? "border-amber-200 bg-amber-50/30" :
                      "border-rose-200 bg-rose-50/30"
                    )}>
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Feasibility Score</p>
                        <div className="text-7xl font-black tracking-tighter font-mono">
                          {result.score}<span className="text-2xl opacity-30">/100</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider",
                          result.recommendation === 'Recommended' ? "bg-emerald-500 text-white" :
                          result.recommendation === 'Risky' ? "bg-amber-500 text-white" :
                          "bg-rose-500 text-white"
                        )}>
                          {result.recommendation === 'Recommended' && <CheckCircle2 size={16} />}
                          {result.recommendation === 'Risky' && <AlertTriangle size={16} />}
                          {result.recommendation === 'Not Recommended' && <XCircle size={16} />}
                          {result.recommendation}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-zinc-100 text-left">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-zinc-900 font-semibold">
                            <Sparkles size={16} className="text-emerald-500" />
                            <h4 className="text-sm">AI Vibe Insight ✨</h4>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-lg">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Burnout Risk</span>
                            <div className={cn(
                              "w-2 h-2 rounded-full animate-pulse",
                              burnoutRisk > 70 ? "bg-rose-500" : burnoutRisk > 40 ? "bg-amber-500" : "bg-emerald-500"
                            )} />
                            <span className="text-[10px] font-bold text-zinc-700">{burnoutRisk}%</span>
                          </div>
                        </div>
                        <div className="markdown-body">
                          <Markdown>{result.explanation}</Markdown>
                        </div>
                      </div>

                      <button 
                        onClick={reset}
                        className="mt-6 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1 mx-auto"
                      >
                        <RefreshCw size={12} /> Naya Plan, Kaun Hai Ye?
                      </button>
                    </div>

                    {/* Breakdown Card */}
                    <div className="glass-card p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Decision Breakdown</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500">Financial Impact</span>
                          <span className={cn(
                            "font-mono font-bold",
                            (budget + savings - eventCost) > 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {currency.symbol}{budget + savings - eventCost} left
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (eventCost / (budget + savings)) * 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2">
                          <span className="text-zinc-500">Academic Load</span>
                          <span className="font-mono font-bold text-zinc-900">{assignments} tasks</span>
                        </div>
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full transition-all duration-1000" 
                            style={{ width: `${(assignments / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              ) : activeTab === 'dna' ? (
                !dnaResult ? (
                  <motion.div 
                    key="empty-dna"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="glass-card p-8 h-full flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2"
                  >
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                      <BookOpen size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">DNA Profile Ka Wait Hai</h3>
                      <p className="text-zinc-500 text-sm max-w-[200px] mx-auto">Apna weekly load batao, burnout risk check karte hain.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="result-dna"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {/* Stress Card */}
                    <div className={cn(
                      "glass-card p-8 text-center space-y-6 overflow-hidden relative",
                      dnaResult.status === 'Balanced Week' ? "border-emerald-200 bg-emerald-50/30" :
                      dnaResult.status === 'Moderate Load' ? "border-amber-200 bg-amber-50/30" :
                      "border-rose-200 bg-rose-50/30"
                    )}>
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Stress Score</p>
                        <div className="text-7xl font-black tracking-tighter font-mono">
                          {dnaResult.score}<span className="text-2xl opacity-30">/100</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider",
                          dnaResult.status === 'Balanced Week' ? "bg-emerald-500 text-white" :
                          dnaResult.status === 'Moderate Load' ? "bg-amber-500 text-white" :
                          "bg-rose-500 text-white"
                        )}>
                          {dnaResult.status === 'Balanced Week' && <CheckCircle2 size={16} />}
                          {dnaResult.status === 'Moderate Load' && <AlertTriangle size={16} />}
                          {dnaResult.status === 'High Load Alert' && <XCircle size={16} />}
                          {dnaResult.status}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-zinc-100 text-left">
                        <div className="flex items-center gap-2 text-zinc-900 font-semibold mb-3">
                          <Sparkles size={16} className="text-emerald-500" />
                          <h4 className="text-sm">AI DNA Insight ✨</h4>
                        </div>
                        <div className="markdown-body">
                          <Markdown>{dnaResult.insight}</Markdown>
                        </div>
                      </div>

                      <button 
                        onClick={reset}
                        className="mt-6 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1 mx-auto"
                      >
                        <RefreshCw size={12} /> Naya DNA Scan, Kaun Hai Ye?
                      </button>
                    </div>

                    {/* Load Breakdown */}
                    <div className="glass-card p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Load Breakdown</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-rose-500" />
                            <span className="text-zinc-500">Deadline Pressure</span>
                          </div>
                          <span className="font-mono font-bold text-zinc-900">{deadlines * 5} pts</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-emerald-500" />
                            <span className="text-zinc-500">Rest Offset</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-600">-{ (dnaFreeHours * 2) + (sleepHours * 3) } pts</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              ) : (
                !regretResult ? (
                  <motion.div 
                    key="empty-regret"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="glass-card p-8 h-full flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2"
                  >
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                      <Shield size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">Regret Shield Ka Wait Hai</h3>
                      <p className="text-zinc-500 text-sm max-w-[200px] mx-auto">Purchase analyze karo, emotional trigger check karte hain.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="result-regret"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {/* Regret Card */}
                    <div className={cn(
                      "glass-card p-8 text-center space-y-6 overflow-hidden relative",
                      regretResult.status === 'Safe Purchase' ? "border-emerald-200 bg-emerald-50/30" :
                      regretResult.status === 'Think Before Buying' ? "border-amber-200 bg-amber-50/30" :
                      "border-rose-200 bg-rose-50/30"
                    )}>
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Regret Vibe Check</p>
                        <div className="text-7xl font-black tracking-tighter font-mono">
                          {regretResult.score}<span className="text-2xl opacity-30">/100</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider",
                          regretResult.status === 'Safe Purchase' ? "bg-emerald-500 text-white" :
                          regretResult.status === 'Think Before Buying' ? "bg-amber-500 text-white" :
                          "bg-rose-500 text-white"
                        )}>
                          {regretResult.status === 'Safe Purchase' && <CheckCircle2 size={16} />}
                          {regretResult.status === 'Think Before Buying' && <AlertTriangle size={16} />}
                          {regretResult.status === 'High Emotional Purchase' && <XCircle size={16} />}
                          {regretResult.status}
                        </div>
                      </div>

                      {coolingTimer !== null && coolingTimer > 0 && !isOverridden && (
                        <div className="bg-rose-100/50 border border-rose-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-center gap-2 text-rose-600 font-bold">
                            <Timer size={18} className="animate-pulse" />
                            <span>Thoda thanda le bhai... 🌿</span>
                          </div>
                          <p className="text-xs text-rose-500">Wait {coolingTimer}s before you do something delulu.</p>
                          <button 
                            onClick={() => setIsOverridden(true)}
                            className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 flex items-center gap-1 mx-auto"
                          >
                            <Unlock size={10} /> Main toh karunga hi 💀
                          </button>
                        </div>
                      )}

                      <div className="pt-6 border-t border-zinc-100 text-left">
                        <div className="flex items-center gap-2 text-zinc-900 font-semibold mb-3">
                          <Sparkles size={16} className="text-emerald-500" />
                          <h4 className="text-sm">The Vibe Summary 💅</h4>
                        </div>
                        <div className="markdown-body">
                          <Markdown>{regretResult.insight}</Markdown>
                        </div>
                      </div>

                      <button 
                        onClick={reset}
                        className="mt-6 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1 mx-auto"
                      >
                        <RefreshCw size={12} /> Naya Scan, Kaun Hai Ye?
                      </button>
                    </div>

                    {/* Risk Breakdown */}
                    <div className="glass-card p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">The Receipts 🧾</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500">Wallet Damage 💸</span>
                          <span className="font-mono font-bold text-zinc-900">
                            {Math.round(remainingBudget > 0 ? (itemCost / remainingBudget) * 100 : 0)}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-rose-500 h-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, remainingBudget > 0 ? (itemCost / remainingBudget) * 100 : 0)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500">Main Character Energy 💅</span>
                          <span className="font-mono font-bold text-zinc-900">
                            {dnaResult ? dnaResult.score : 50}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full transition-all duration-1000" 
                            style={{ width: `${dnaResult ? dnaResult.score : 50}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>

            {/* History Section */}
            {history.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Decisions</h4>
                  <button onClick={() => setHistory([])} className="text-[10px] text-zinc-400 hover:text-rose-500 uppercase font-bold tracking-tighter">Clear</button>
                </div>
                <div className="space-y-2">
                  {history.map(item => (
                    <div key={item.id} className="glass-card p-3 flex items-center justify-between group hover:border-zinc-300 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          item.type === 'optimizer' ? "bg-emerald-50 text-emerald-600" : 
                          item.type === 'dna' ? "bg-indigo-50 text-indigo-600" :
                          "bg-rose-50 text-rose-600"
                        )}>
                          {item.type === 'optimizer' ? <TrendingUp size={14} /> : 
                           item.type === 'dna' ? <BookOpen size={14} /> :
                           <Shield size={14} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900">{item.title}</p>
                          <p className="text-[10px] text-zinc-400">{item.date} • {item.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black font-mono text-zinc-900">{item.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-zinc-200 text-center">
          <p className="text-zinc-400 text-xs uppercase tracking-[0.2em]">
            Powered by ExpEra Behavioral Engine & Gemini AI
          </p>
        </footer>
      </div>
    </div>
  );
}
