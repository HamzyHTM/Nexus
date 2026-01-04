
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { ICONS } from '../constants';

interface AddContactModalProps {
  onClose: () => void;
  onAdd: (userId: string) => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ onClose, onAdd }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Real-time fetching with debounce
  useEffect(() => {
    let isMounted = true;
    
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const users = await api.searchUsers(query);
        if (isMounted) {
          setResults(users);
          setLoading(false);
        }
      } catch (error) {
        console.error("Search failed:", error);
        if (isMounted) setLoading(false);
      }
    };

    if (query.length === 0) {
      fetchUsers();
    } else {
      const timer = setTimeout(fetchUsers, 150); // Faster debounce for snappier feel
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    return () => { isMounted = false; };
  }, [query]);

  // Highlight helper for real-time visual feedback
  const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black rounded-sm px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Discover Users</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Nexus Registry
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-2xl transition-all active:scale-90"
          >
            <span className="text-xl leading-none text-slate-400">×</span>
          </button>
        </div>
        
        <div className="px-8 pb-8">
          {/* Real-time Search Input */}
          <div className="relative mb-8 group">
            <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${loading ? 'text-emerald-500' : 'text-slate-400'}`}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ICONS.Search size={20} />
              )}
            </div>
            <input 
              autoFocus
              type="text" 
              placeholder="Search by username..."
              className="w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-zinc-800/50 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-emerald-500/10 border-2 border-transparent focus:border-emerald-500/20 transition-all font-bold text-base shadow-inner"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Results Area */}
          <div className="max-h-[380px] overflow-y-auto space-y-3 custom-scrollbar pr-1">
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                {query.trim() ? `Found ${results.length} Matches` : 'Suggested Contacts'}
              </span>
              {loading && <span className="text-[10px] text-emerald-500 font-bold animate-pulse">Updating...</span>}
            </div>

            {results.length > 0 ? (
              results.map((user, idx) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-[1.5rem] transition-all group border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800/50 animate-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={user.profilePic} 
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-105" 
                        alt={user.username} 
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-3 border-white dark:border-zinc-900 ${user.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-none mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <HighlightedText text={user.username} highlight={query} />
                      </h3>
                      <p className="text-xs text-slate-400 font-medium truncate max-w-[160px]">{user.status}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onAdd(user.id)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95 group-hover:shadow-emerald-500/30"
                  >
                    Chat
                  </button>
                </div>
              ))
            ) : !loading ? (
              <div className="text-center py-16 animate-in fade-in">
                <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <ICONS.Search size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">User not found</h3>
                <p className="text-sm text-slate-400 font-medium px-8">No matching handle found in the Nexus registry. Check the spelling or try another name.</p>
              </div>
            ) : null}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-5 bg-slate-50 dark:bg-zinc-800/30 text-center border-t border-slate-100 dark:border-zinc-800">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
             <ICONS.Sent size={12} className="text-emerald-500" />
             Secured Nexus Protocol Registry
           </p>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
