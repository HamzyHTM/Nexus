
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
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const users = await api.searchUsers(query);
      setResults(users);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async (toId: string) => {
    try {
      setStatusMap(prev => ({ ...prev, [toId]: 'sending' }));
      const req = await api.sendFriendRequest(toId);
      socket.emit('friend_request', req);
      setStatusMap(prev => ({ ...prev, [toId]: 'sent' }));
      setTimeout(() => onSent(), 1000);
    } catch (err: any) {
      alert(err.message);
      setStatusMap(prev => ({ ...prev, [toId]: 'error' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Search Nexus Registry</h2>
          <button onClick={onClose} className="text-2xl text-slate-400">&times;</button>
        </div>
        
        <div className="p-6">
          <div className="relative mb-6">
            <ICONS.Search className="absolute left-4 top-4 text-slate-400" size={18} />
            <input 
              autoFocus
              type="text" 
              placeholder="Search by username..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-100 dark:bg-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center py-10 opacity-50">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              results.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-transparent hover:border-emerald-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <img src={user.profilePic} className="w-10 h-10 rounded-xl" alt={user.username} />
                    <div>
                      <h3 className="font-bold text-sm">{user.username}</h3>
                      <p className="text-[10px] text-slate-400 font-medium">{user.status}</p>
                    </div>
                  </div>
                  <button 
                    disabled={statusMap[user.id] === 'sent' || statusMap[user.id] === 'sending'}
                    onClick={() => handleSendRequest(user.id)}
                    className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                      statusMap[user.id] === 'sent' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {statusMap[user.id] === 'sending' ? 'Sending...' : statusMap[user.id] === 'sent' ? 'Sent' : 'Add Friend'}
                  </button>
                </div>
              ))
            ) : query.length > 0 ? (
              <p className="text-center py-10 text-slate-400 text-sm font-medium italic">No users found with that handle.</p>
            ) : (
              <div className="text-center py-10 opacity-30">
                <ICONS.Search size={32} className="mx-auto mb-2" />
                <p className="text-xs font-black uppercase tracking-widest">Type to explore Nexus</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
