
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockBackend';
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
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const users = await db.searchUsers(query);
      setResults(users);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
          <h2 className="text-xl font-bold">New Chat</h2>
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
              placeholder="Search by username..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : results.length > 0 ? (
              results.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <img src={user.profilePic} className="w-12 h-12 rounded-full object-cover" alt={user.username} />
                    <div>
                      <h3 className="font-semibold">{user.username}</h3>
                      <p className="text-xs text-gray-500">{user.status}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onAdd(user.id)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    Chat
                  </button>
                </div>
              ))
            ) : query.length > 1 ? (
              <p className="text-center text-gray-500 py-8">No users found.</p>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <ICONS.Profile className="mx-auto mb-2 opacity-20" size={40} />
                <p className="text-sm">Search for friends to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
