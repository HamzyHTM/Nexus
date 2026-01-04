
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Now searching from the actual registered users in USERS_DB
        const users = await api.searchUsers(query);
        setResults(users);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
          <h2 className="text-xl font-bold">Find People</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
            <span className="text-xl">×</span>
          </button>
        </div>
        
        <div className="p-6">
          <div className="relative mb-6">
            <ICONS.Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              autoFocus
              type="text" 
              placeholder="Search registered usernames..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="max-h-[350px] overflow-y-auto space-y-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Searching Database...</p>
              </div>
            ) : results.length > 0 ? (
              results.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-2xl transition-all group border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800/50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={user.profilePic} className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-zinc-800 shadow-sm" alt={user.username} />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{user.username}</h3>
                      <p className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]">{user.status}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onAdd(user.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
                  >
                    Message
                  </button>
                </div>
              ))
            ) : query.length > 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
                   <ICONS.Search size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-400">No users found with that name.</p>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <ICONS.Profile className="text-emerald-500 opacity-50" size={32} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">Find your friends on Nexus</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-zinc-800/30 text-center border-t border-gray-100 dark:border-zinc-800">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">End-to-End Encrypted Discovery</p>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
