
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface AuthScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onSignup: (username: string, password: string) => Promise<void>;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await onLogin(username.trim(), password);
      } else {
        await onSignup(username.trim(), password);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-zinc-950 p-4 font-inter transition-colors duration-500">
      <div className="absolute inset-0 bg-emerald-600 h-[30%] -z-10 transition-colors duration-500"></div>
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 relative animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-[1.75rem] flex items-center justify-center rotate-6 shadow-2xl shadow-emerald-500/40 mb-6 animate-bounce-subtle">
            <ICONS.Chat size={40} className="text-white -rotate-6" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Nexus Chat</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2 text-center font-medium leading-relaxed">
            {isLogin ? "Welcome back to the Nexus." : "Create your Nexus identity."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-[1.25rem] mb-8">
          <button 
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${isLogin ? 'bg-white dark:bg-zinc-700 shadow-md text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${!isLogin ? 'bg-white dark:bg-zinc-700 shadow-md text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}
          >
            Signup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-500 text-xs font-bold p-4 rounded-xl border border-red-100 dark:border-red-900/30 animate-in shake duration-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400 ml-2">
              Username
            </label>
            <div className="relative group">
              <ICONS.Profile className="absolute left-4 top-[1rem] text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                disabled={loading}
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Unique handle" 
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-emerald-500/10 border border-gray-200 dark:border-zinc-700 transition-all font-semibold"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400 ml-2">
              Password
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-[1rem] text-gray-400 group-focus-within:text-emerald-500 transition-colors text-lg font-bold">●</span>
              <input 
                disabled={loading}
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Secure code" 
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-emerald-500/10 border border-gray-200 dark:border-zinc-700 transition-all font-semibold"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400 ml-2">
                Confirm Password
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-[1rem] text-gray-400 group-focus-within:text-emerald-500 transition-colors text-lg font-bold">●</span>
                <input 
                  disabled={loading}
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat code" 
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-emerald-500/10 border border-gray-200 dark:border-zinc-700 transition-all font-semibold"
                  required
                />
              </div>
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4.5 bg-emerald-600 text-white rounded-[1.25rem] font-black text-lg shadow-xl hover:bg-emerald-700 hover:shadow-emerald-500/20 transition-all active:scale-[0.97] flex items-center justify-center gap-3 mt-4 ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Syncing...
              </>
            ) : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-4">
            Secured by Nexus Protocol
          </p>
          <div className="flex justify-center gap-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-50"></div>
             <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-25"></div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0) rotate(6deg); }
          50% { transform: translateY(-8px) rotate(8deg); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        .shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;
