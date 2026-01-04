
import React from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { FriendRequest } from '../types';
import { ICONS } from '../constants';

interface RequestsModalProps {
  requests: FriendRequest[];
  onClose: () => void;
  onUpdate: () => void;
}

const RequestsModal: React.FC<RequestsModalProps> = ({ requests, onClose, onUpdate }) => {
  const handleResponse = async (id: string, status: 'accepted' | 'declined') => {
    await api.respondToRequest(id, status);
    if (status === 'accepted') {
      socket.emit('request_accepted', { id });
    }
    onUpdate();
    if (requests.length === 1) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Friend Requests</h2>
          <button onClick={onClose} className="text-2xl text-slate-400">&times;</button>
        </div>
        
        <div className="p-6 max-h-[400px] overflow-y-auto space-y-4 custom-scrollbar">
          {requests.length > 0 ? (
            requests.map(req => (
              <div key={req.id} className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-sm">
                    {req.fromUsername?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">@{req.fromUsername}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Wants to connect with you</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleResponse(req.id, 'accepted')}
                    className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-emerald-700 transition-all"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleResponse(req.id, 'declined')}
                    className="flex-1 py-2 bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-[10px] font-black uppercase rounded-xl hover:bg-slate-300 transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <ICONS.Users size={32} className="mx-auto mb-2 text-slate-200" />
              <p className="text-sm font-medium text-slate-400">No pending requests</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-zinc-800/30 text-center">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NexNet Connection Protocol</p>
        </div>
      </div>
    </div>
  );
};

export default RequestsModal;
