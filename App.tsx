
import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { socket } from './services/socket';
import { getAIResponse } from './services/geminiService';
import { User, Chat, Message, AuthState } from './types';
import { ICONS, STORAGE_KEYS } from './constants';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import AuthScreen from './components/AuthScreen';
import AddContactModal from './components/AddContactModal';
import ProfileModal from './components/ProfileModal';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false
  });
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.THEME) === 'dark'
  );
  const [isTyping, setIsTyping] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Initialize Auth
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (saved) setAuthState(JSON.parse(saved));
  }, []);

  // Sync Chats
  const refreshChats = useCallback(async () => {
    if (authState.isAuthenticated) {
      const data = await api.getChats();
      setChats(data);
    }
  }, [authState.isAuthenticated]);

  useEffect(() => { refreshChats(); }, [refreshChats]);

  // Socket Listeners
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const handleNewMessage = (msg: Message) => {
      if (msg.chatId === activeChatId) {
        setMessages(prev => [...prev, msg]);
      }
      refreshChats();
    };

    const handleTyping = (data: { chatId: string; userId: string }) => {
      if (data.chatId === activeChatId && data.userId !== authState.user?.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on('message', handleNewMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('message', handleNewMessage);
      socket.off('typing', handleTyping);
    };
  }, [authState.isAuthenticated, activeChatId, authState.user?.id, refreshChats]);

  // Load Messages
  useEffect(() => {
    if (activeChatId) {
      api.getMessages(activeChatId).then(setMessages);
    }
  }, [activeChatId]);

  // Theme Sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleLogin = async (u: string, p: string) => {
    const res = await api.login(u, p);
    setAuthState(res);
  };

  const handleSignup = async (u: string, p: string) => {
    const res = await api.register(u, p);
    setAuthState(res);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    setAuthState({ user: null, token: null, isAuthenticated: false });
    setActiveChatId(null);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChatId || !authState.user) return;

    const newMessage: Message = {
      id: `m_${Date.now()}`,
      chatId: activeChatId,
      senderId: authState.user.id,
      text,
      timestamp: Date.now(),
      status: 'sent',
      reactions: {}
    };

    const sent = await api.sendMessage(newMessage);
    socket.emit('message', sent);
    setMessages(prev => [...prev, sent]);
    refreshChats();
  };

  if (!authState.isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} onSignup={handleSignup} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-inter">
      {/* Sidebar */}
      <div className="w-full md:w-96 flex-shrink-0 border-r border-slate-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900 z-20 shadow-xl">
        <header className="p-5 flex justify-between items-center bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
          <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 group">
            <div className="relative">
              <img src={authState.user?.profilePic} className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
            </div>
            <div className="text-left">
              <h1 className="font-black text-lg leading-none tracking-tight">{authState.user?.username}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">Nexus Verified</p>
            </div>
          </button>
          
          <div className="flex gap-2">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-90">
                {isDarkMode ? '🌞' : '🌙'}
             </button>
             <button onClick={handleLogout} className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all active:scale-90">
                <ICONS.Delete size={20} />
             </button>
          </div>
        </header>

        <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="relative group">
            <ICONS.Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              placeholder="Search contacts..." 
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ChatList 
            chats={chats} 
            activeId={activeChatId} 
            onSelect={setActiveChatId}
            onDeleteChat={() => {}}
          />
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-zinc-800">
           <button 
             onClick={() => setShowAddModal(true)}
             className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.25rem] font-black text-sm tracking-widest uppercase shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
             <span className="text-lg">+</span> Start New Conversation
           </button>
        </div>
      </div>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col relative bg-[#f8fafc] dark:bg-zinc-950">
        {activeChatId ? (
          <ChatWindow 
            chat={chats.find(c => c.id === activeChatId)!}
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            onReaction={() => {}}
            onDelete={() => {}}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl animate-pulse">
               <ICONS.Chat size={64} className="text-emerald-600" />
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-4">Select a Nexus Room</h2>
            <p className="text-slate-400 dark:text-zinc-500 max-w-sm text-lg font-medium">
              Choose a contact to begin your end-to-end encrypted session.
            </p>
          </div>
        )}
      </main>

      {showAddModal && <AddContactModal onClose={() => setShowAddModal(false)} onAdd={(id) => { api.createChat(id).then(refreshChats); setShowAddModal(false); }} />}
      {showProfileModal && authState.user && <ProfileModal user={authState.user} onClose={() => setShowProfileModal(false)} onUpdate={async (u) => {}} />}
    </div>
  );
};

export default App;
