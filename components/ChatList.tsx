
import React from 'react';
import { Chat } from '../types';
import { ICONS } from '../constants';

interface ChatListProps {
  chats: Chat[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, activeId, onSelect, onDeleteChat }) => {
  return (
    <div className="flex flex-col p-2 space-y-1">
      {chats.map(chat => (
        <div key={chat.id} className="group relative">
          <button
            onClick={() => onSelect(chat.id)}
            className={`w-full flex items-center gap-4 p-3.5 text-left transition-all rounded-2xl ${
              activeId === chat.id 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 shadow-sm' 
                : 'hover:bg-gray-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <div className="relative flex-shrink-0">
              <img 
                src={chat.avatar || `https://picsum.photos/seed/${chat.id}/200`} 
                alt={chat.name} 
                className={`w-12 h-12 rounded-2xl object-cover transition-transform duration-300 ${activeId === chat.id ? 'scale-110' : ''}`}
              />
              {chat.type === 'individual' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full shadow-sm"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className={`font-bold truncate ${activeId === chat.id ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                  {chat.name}
                </h3>
                {chat.lastMessage && (
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                    {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 truncate pr-6 font-medium">
                  {chat.lastMessage?.text || 'No messages yet'}
                </p>
                {chat.unreadCount > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg min-w-[20px] text-center shadow-md shadow-emerald-500/20">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
          >
            <ICONS.Delete size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
