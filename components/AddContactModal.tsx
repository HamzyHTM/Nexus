
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { User } from '../types';
import { ICONS } from '../constants';

interface AddContactModalProps {
  onClose: () => void;
  onSent: () => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ onClose, onSent }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});

  // Real-time fetching logic
  useEffect(() => {
    // If query is empty, clear results and don't search
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        // Fetch directly from the "real-time database"
        const users = await api.searchUsers(query);
        setResults(users);
      } catch (err) {
        console.error("Discovery failed", err);
      } finally {
        setLoading(false);
      }
    }, 150); // Aggressive 150ms debounce for instant feel
    
    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async (toId: string) => {
    try {
      setStatusMap(prev => ({ ...prev, [toId]: 'sending' }));
      const req = await api.sendFriendRequest(toId);
      
      // Emit socket event so the recipient gets a notification immediately
      socket.emit('friend_request', req);
      
      setStatusMap(prev => ({ ...prev, [toId]: 'sent' }));
      setTimeout(() => onSent(), 600);
    } catch (err: any) {
      alert(err.message);
      setStatusMap(prev => ({ ...prev, [toId]: 'error' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Find People</h2>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.25em] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Registry Access
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-2xl transition-all active:scale-90"
          >
            <span className="text-xl leading-none text-slate-400">&times;</span>
          </button>
        </div>
        
        <div className="px-8 pb-8">
          {/* Search Bar */}
          <div className="relative mb-6 group">
            <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${loading ? 'text-emerald-500' : 'text-slate-400'}`}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ICONS.Search size={20} />
              )}
            </div>
            <input 
              autoFocus
              type="text" 
              placeholder="Type a username..."
              className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-zinc-800/40 rounded-[1.75rem] outline-none focus:ring-4 focus:ring-emerald-500/10 border-2 border-transparent focus:border-emerald-500/30 transition-all font-bold text-base shadow-inner"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Results Area */}
          <div className="max-h-[320px] overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {results.length > 0 ? (
              results.map((user, idx) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-zinc-800/20 rounded-[1.5rem] border border-transparent hover:border-emerald-500/20 transition-all group animate-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <img src={user.profilePic} className="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:rotate-3 transition-transform" alt={user.username} />
                    <div>
                      <h3 className="font-bold text-sm leading-none mb-1 group-hover:text-emerald-600 transition-colors">@{user.username}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.isOnline ? 'Online Now' : 'Offline'}</p>
                    </div>
                  </div>
                  <button 
                    disabled={statusMap[user.id] === 'sent' || statusMap[user.id] === 'sending'}
                    onClick={() => handleSendRequest(user.id)}
                    className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 ${
                      statusMap[user.id] === 'sent' 
                        ? 'bg-emerald-100 text-emerald-600 shadow-none' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
                    }`}
                  >
                    {statusMap[user.id] === 'sending' ? 'Wait...' : statusMap[user.id] === 'sent' ? 'Sent' : 'Add'}
                  </button>
                </div>
              ))
            ) : query.trim().length > 0 && !loading ? (
              <div className="text-center py-16 opacity-60 animate-in fade-in">
                <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200 dark:border-zinc-700">
                  <ICONS.Search size={32} className="text-slate-300" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">User not found</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">Check the spelling or try another handle.</p>
              </div>
            ) : !loading && (
              <div className="text-center py-16 opacity-20">
                <ICONS.Users size={48} className="mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.4em]">Ready for search</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Info Footer */}
        <div className="p-6 bg-slate-50 dark:bg-zinc-800/40 text-center border-t border-slate-100 dark:border-zinc-800">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center justify-center gap-3">
             <ICONS.Sent size={12} className="text-emerald-500" />
             Instant Real-Time Nexus Sync
           </p>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
