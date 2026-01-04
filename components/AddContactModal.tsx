
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

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const users = await api.searchUsers(query);
        setResults(users);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 200); // Fast 200ms debounce for "real-time" feel
    
    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async (toId: string) => {
    try {
      setStatusMap(prev => ({ ...prev, [toId]: 'sending' }));
      const req = await api.sendFriendRequest(toId);
      socket.emit('friend_request', req);
      setStatusMap(prev => ({ ...prev, [toId]: 'sent' }));
      // Small delay before auto-closing on success
      setTimeout(() => onSent(), 800);
    } catch (err: any) {
      alert(err.message);
      setStatusMap(prev => ({ ...prev, [toId]: 'error' }));
    }
  };

  // Helper to highlight matching text
  const HighlightMatch = ({ text, match }: { text: string, match: string }) => {
    if (!match.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${match})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === match.toLowerCase() 
            ? <span key={i} className="text-emerald-500 font-black bg-emerald-500/10 px-0.5 rounded-sm">{part}</span> 
            : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
        <div className="p-8 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Add Contact</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Live Registry Search</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-2xl transition-all active:scale-90"
          >
            <span className="text-xl leading-none text-slate-400">&times;</span>
          </button>
        </div>
        
        <div className="px-8 pb-8">
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

          <div className="max-h-[350px] overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {results.length > 0 ? (
              results.map((user, idx) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/30 rounded-[1.5rem] border border-transparent hover:border-emerald-500/20 transition-all group animate-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={user.profilePic} className="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt={user.username} />
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-none mb-1 group-hover:text-emerald-600 transition-colors">
                        <HighlightMatch text={user.username} match={query} />
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user.status}</p>
                    </div>
                  </div>
                  <button 
                    disabled={statusMap[user.id] === 'sent' || statusMap[user.id] === 'sending'}
                    onClick={() => handleSendRequest(user.id)}
                    className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 ${
                      statusMap[user.id] === 'sent' 
                        ? 'bg-emerald-100 text-emerald-600 shadow-none' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/10'
                    }`}
                  >
                    {statusMap[user.id] === 'sending' ? 'Sending...' : statusMap[user.id] === 'sent' ? 'Request Sent' : 'Add Friend'}
                  </button>
                </div>
              ))
            ) : query.length > 0 && !loading ? (
              <div className="text-center py-16 opacity-50 animate-in fade-in">
                <ICONS.Search size={40} className="mx-auto mb-4 text-slate-300" />
                <p className="text-sm font-bold text-slate-500">Handle not found in registry</p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1">Check the handle and try again</p>
              </div>
            ) : !loading && (
              <div className="text-center py-16 opacity-30">
                <ICONS.Users size={40} className="mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.3em]">Query Nexus Database</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-5 bg-slate-50 dark:bg-zinc-800/30 text-center border-t border-slate-100 dark:border-zinc-800">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center justify-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             Real-Time Connection Protocol
           </p>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
