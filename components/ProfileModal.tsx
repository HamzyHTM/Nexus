
import React, { useState } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updates: Partial<User>) => Promise<void>;
}

const AVATAR_PRESETS = [
  'https://picsum.photos/seed/nature/200',
  'https://picsum.photos/seed/tech/200',
  'https://picsum.photos/seed/travel/200',
  'https://picsum.photos/seed/coffee/200',
  'https://picsum.photos/seed/music/200',
];

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [profilePic, setProfilePic] = useState(user.profilePic);
  const [status, setStatus] = useState(user.status);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onUpdate({ profilePic, status });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
          <h2 className="text-xl font-bold">Your Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
            <span className="text-xl">×</span>
          </button>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="relative group">
              <img 
                src={profilePic} 
                className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500 shadow-xl" 
                alt="Profile Preview" 
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ICONS.Profile className="text-white" size={32} />
              </div>
            </div>
            
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Choose Avatar</label>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {AVATAR_PRESETS.map((url, i) => (
                    <button 
                      key={i}
                      onClick={() => setProfilePic(url)}
                      className={`flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${profilePic === url ? 'border-emerald-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={url} className="w-full h-full object-cover" alt={`Preset ${i}`} />
                    </button>
                  ))}
                  <button 
                    onClick={() => {
                      const url = prompt("Enter custom Image URL:");
                      if (url) setProfilePic(url);
                    }}
                    className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:text-emerald-500 border-2 border-dashed border-gray-300 dark:border-zinc-700"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">About / Status</label>
                <input 
                  type="text" 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200 dark:border-zinc-700 transition-all font-semibold"
                  placeholder="e.g. Available, Busy, At work"
                />
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            onClick={handleSave}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
