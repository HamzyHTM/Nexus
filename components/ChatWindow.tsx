
import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message } from '../types';
import { ICONS, REACTION_EMOJIS } from '../constants';

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chat, 
  messages, 
  isTyping, 
  onSendMessage, 
  onReaction,
  onDelete
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const displayName = chat.name || (chat.id === 'c1' ? 'Alex AI' : 'Sarah Jenkins');
  const avatar = chat.avatar || `https://picsum.photos/seed/${chat.id}/200`;

  const formatFullDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 z-10">
        <div className="flex items-center gap-3">
          <img src={avatar} className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/20" alt={displayName} />
          <div>
            <h2 className="font-bold leading-tight">{displayName}</h2>
            <p className="text-xs text-emerald-500 font-bold uppercase tracking-wide">
              {isTyping ? 'typing...' : 'online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-400">
          <button className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"><ICONS.Search size={20} /></button>
          <button className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"><ICONS.Menu size={20} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === 'current' || msg.senderId.startsWith('user_');
          const showDateDivider = idx === 0 || new Date(messages[idx-1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
          const showAvatar = !isMe && (idx === 0 || messages[idx-1].senderId !== msg.senderId || showDateDivider);

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div className="flex justify-center my-8">
                  <span className="bg-slate-200/50 dark:bg-zinc-800/50 backdrop-blur-sm text-slate-500 dark:text-zinc-400 text-[10px] px-4 py-1.5 rounded-full uppercase tracking-[0.15em] font-black border border-slate-100 dark:border-zinc-700/50 shadow-sm">
                    {new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start animate-in slide-in-from-left-2 duration-300'}`}>
                {/* Receiver Avatar */}
                {!isMe && (
                  <div className="w-8 h-8 flex-shrink-0 mb-1">
                    {showAvatar ? (
                      <img src={avatar} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shadow-sm" alt="" />
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                )}

                <div className={`group relative max-w-[80%] md:max-w-[70%] px-4 py-3 shadow-md transition-all duration-200 ${
                  isMe 
                    ? 'bg-emerald-600 text-white rounded-[1.25rem] rounded-br-none shadow-emerald-500/10' 
                    : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-[1.25rem] rounded-bl-none border border-slate-100 dark:border-zinc-800 shadow-slate-200/50 dark:shadow-none'
                }`}>
                  
                  {/* Tooltip for Full Date on Hover */}
                  <div className={`absolute left-1/2 -top-9 -translate-x-1/2 bg-gray-900/90 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-30 shadow-xl font-bold border border-white/10 backdrop-blur-md`}>
                    {formatFullDate(msg.timestamp)}
                  </div>

                  {/* Reaction Hover Menu */}
                  <div className={`absolute top-0 ${isMe ? '-left-14' : '-right-14'} opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-1.5 z-20`}>
                    <button 
                      onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                      className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-slate-100 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-emerald-500 hover:scale-110 transition-transform"
                    >
                      <ICONS.Emoji size={16} />
                    </button>
                    {isMe && !msg.isDeleted && (
                       <button 
                       onClick={() => onDelete(msg.id)}
                       className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-slate-100 dark:border-zinc-700 text-slate-400 hover:text-red-500 hover:scale-110 transition-transform"
                     >
                       <ICONS.Delete size={16} />
                     </button>
                    )}
                  </div>

                  {showEmojiPicker === msg.id && (
                    <div className="absolute -top-14 left-0 bg-white dark:bg-zinc-800 p-2 rounded-full shadow-2xl flex gap-2 z-40 border border-slate-100 dark:border-zinc-700 animate-in fade-in zoom-in-75 slide-in-from-bottom-2">
                      {REACTION_EMOJIS.map(emoji => (
                        <button 
                          key={emoji} 
                          onClick={() => { onReaction(msg.id, emoji); setShowEmojiPicker(null); }}
                          className="hover:scale-150 transition-transform p-1 text-xl active:scale-90"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className={`text-sm leading-relaxed ${msg.isDeleted ? 'italic opacity-60' : 'font-medium'}`}>
                    {msg.text}
                  </p>
                  
                  {/* Message Metadata (Timestamp & Status) */}
                  <div className={`flex items-center gap-1.5 mt-2 justify-end ${isMe ? 'text-emerald-100/70' : 'text-slate-400 dark:text-zinc-500'}`}>
                    <span className="text-[10px] font-black tracking-tighter">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                    {isMe && (
                      <span className="flex">
                        {msg.status === 'read' ? <ICONS.Read size={14} className="text-emerald-200" /> : <ICONS.Sent size={14} />}
                      </span>
                    )}
                  </div>

                  {/* Reactions List */}
                  {Object.entries(msg.reactions).some(([_, users]) => (users as string[]).length > 0) && (
                    <div className={`absolute -bottom-4 ${isMe ? 'right-2' : 'left-2'} flex gap-1.5 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-full px-2.5 py-1 shadow-lg z-10 animate-in zoom-in-50`}>
                      {Object.entries(msg.reactions).map(([emoji, users]) => (
                        (users as string[]).length > 0 && (
                          <span key={emoji} className="text-[12px] flex items-center gap-1">
                            {emoji} <span className="text-slate-500 dark:text-zinc-400 font-black text-[10px]">{(users as string[]).length > 1 ? (users as string[]).length : ''}</span>
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {isTyping && (
          <div className="flex justify-start items-end gap-2 animate-in slide-in-from-left-2">
            <div className="w-8 h-8 flex-shrink-0">
               <img src={avatar} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shadow-sm opacity-50" alt="" />
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-5 py-3.5 rounded-[1.25rem] rounded-bl-none shadow-sm flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button type="button" className="p-2.5 text-slate-400 dark:text-zinc-500 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-all">
              <ICONS.Emoji size={22} />
            </button>
            <button type="button" className="p-2.5 text-slate-400 dark:text-zinc-500 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-all">
              <ICONS.Attachment size={22} />
            </button>
          </div>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 px-6 py-3.5 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium border border-transparent focus:border-emerald-500/30 transition-all shadow-inner"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className={`p-4 rounded-2xl transition-all ${
              inputText.trim() 
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 scale-105 active:scale-95' 
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-700'
            }`}
          >
            <ICONS.Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
