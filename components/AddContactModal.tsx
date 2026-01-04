
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
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const users = await api.searchUsers(query);
        setResults(users);
      } catch (err) {
        console.error("Registry lookup failed", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, query.trim() ? 250 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async (toId: string) => {
    try {
      setStatusMap(prev => ({ ...prev, [toId]: 'sending' }));
      const req = await api.sendFriendRequest(toId);
      socket.emit('friend_request', req);
      setStatusMap(prev => ({ ...prev, [toId]: 'sent' }));
      setTimeout(() => onSent(), 500);
    } catch (err: any) {
      alert(err.message);
      setStatusMap(prev => ({ ...prev, [toId]: 'error' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden border border-white/5 animate-in zoom-in-95 duration-200">
        
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Directory</h2>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              Live Community Registry
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-2xl transition-all active:scale-90"
          >
            <span className="text-xl leading-none text-slate-500 dark:text-slate-400">&times;</span>
          </button>
        </div>
        
        <div className="px-8 pb-10">
          <div className="relative mb-6">
            <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${loading ? 'text-emerald-500 rotate-180' : 'text-slate-400'}`}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ICONS.Search size={22} />
              )}
            </div>
            <input 
              autoFocus
              type="text" 
              placeholder="Search other members..."
              className="w-full pl-14 pr-6 py-5 bg-slate-100 dark:bg-zinc-800/60 rounded-[1.75rem] outline-none focus:ring-4 focus:ring-emerald-500/10 border-2 border-transparent focus:border-emerald-500/20 transition-all font-bold text-lg shadow-inner placeholder:text-slate-300 dark:placeholder:text-zinc-600"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center mb-3 px-1">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                {query.trim() ? 'Search Results' : 'Registered Members'}
             </h4>
             {!loading && <span className="text-[10px] font-bold text-emerald-500/60">{results.length} Active Users</span>}
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {results.length > 0 ? (
              results.map((user, idx) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 rounded-[1.5rem] bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all group animate-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 20}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={user.profilePic} className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:rotate-2 transition-transform" alt={user.username} />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base leading-none group-hover:text-emerald-500 transition-colors truncate">@{user.username}</h3>
                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-tighter rounded">Member</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[120px]">{user.status}</p>
                    </div>
                  </div>
                  <button 
                    disabled={statusMap[user.id] === 'sent' || statusMap[user.id] === 'sending'}
                    onClick={() => handleSendRequest(user.id)}
                    className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex-shrink-0 ${
                      statusMap[user.id] === 'sent' 
                        ? 'bg-emerald-100 text-emerald-600 shadow-none' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30'
                    }`}
                  >
                    {statusMap[user.id] === 'sending' ? 'Wait' : statusMap[user.id] === 'sent' ? 'Sent' : 'Add'}
                  </button>
                </div>
              ))
            ) : !loading && (
              <div className="text-center py-12 animate-in fade-in zoom-in-95 px-6">
                <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800/40 rounded-[2rem] flex items-center justify-center mx-auto mb-5 border-2 border-dashed border-slate-100 dark:border-zinc-700 opacity-40">
                  <ICONS.Profile size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Registry Empty</h3>
                <p className="text-xs font-bold text-slate-400 mt-2 leading-relaxed">
                  Only users who register on this platform will appear here.
                  <br />
                  <span className="text-emerald-500 dark:text-emerald-400/70 block mt-2">💡 Tip: Open Nexus in a private window and signup as a new user to test discovery!</span>
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 bg-slate-50/50 dark:bg-zinc-800/50 text-center border-t border-slate-100 dark:border-zinc-800">
           <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.4em] flex items-center justify-center gap-4">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
             Nexus Peer Verification
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
           </p>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
