
import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { socket } from './services/socket';
import { User, Chat, Message, AuthState, FriendRequest } from './types';
import { ICONS, STORAGE_KEYS } from './constants';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import AuthScreen from './components/AuthScreen';
import AddContactModal from './components/AddContactModal';
import ProfileModal from './components/ProfileModal';
import RequestsModal from './components/RequestsModal';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({ user: null, token: null, isAuthenticated: false });
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem(STORAGE_KEYS.THEME) === 'dark');
  const [isTyping, setIsTyping] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (saved) setAuthState(JSON.parse(saved));
  }, []);

  const refreshChats = useCallback(async () => {
    if (authState.isAuthenticated) {
      const data = await api.getChats();
      setChats(data);
    }
  }, [authState.isAuthenticated]);

  const refreshRequests = useCallback(async () => {
    if (authState.isAuthenticated) {
      const reqs = await api.getPendingRequests();
      setPendingRequests(reqs);
    }
  }, [authState.isAuthenticated]);

  useEffect(() => { 
    refreshChats(); 
    refreshRequests();
  }, [refreshChats, refreshRequests]);

  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const handleNewMessage = (msg: Message) => {
      if (msg.chatId === activeChatId) setMessages(prev => [...prev, msg]);
      refreshChats();
    };

    const handleFriendRequest = () => refreshRequests();
    const handleRequestAccepted = () => refreshChats();

    socket.on('message', handleNewMessage);
    socket.on('friend_request', handleFriendRequest);
    socket.on('request_accepted', handleRequestAccepted);

    return () => {
      socket.off('message', handleNewMessage);
      socket.off('friend_request', handleFriendRequest);
      socket.off('request_accepted', handleRequestAccepted);
    };
  }, [authState.isAuthenticated, activeChatId, refreshChats, refreshRequests]);

  useEffect(() => {
    if (activeChatId) api.getMessages(activeChatId).then(setMessages);
  }, [activeChatId]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Fix: Wrapped api calls to satisfy AuthScreenProps (Promise<void>) and update component state
  const handleLogin = async (username: string, password: string) => {
    const res = await api.login(username, password);
    setAuthState(res);
  };

  const handleSignup = async (username: string, password: string) => {
    const res = await api.register(username, password);
    setAuthState(res);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChatId || !authState.user) return;
    const newMessage: Message = { id: `m_${Date.now()}`, chatId: activeChatId, senderId: authState.user.id, text, timestamp: Date.now(), status: 'sent', reactions: {} };
    const sent = await api.sendMessage(newMessage);
    socket.emit('message', sent);
    setMessages(prev => [...prev, sent]);
    refreshChats();
  };

  if (!authState.isAuthenticated) {
    // Fix: Updated to use handleLogin and handleSignup wrappers instead of direct api methods to satisfy type constraints
    return <AuthScreen onLogin={handleLogin} onSignup={handleSignup} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-inter">
      <div className="w-full md:w-96 flex-shrink-0 border-r border-slate-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900 z-20 shadow-xl">
        <header className="p-5 flex justify-between items-center bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
          <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 group">
            <img src={authState.user?.profilePic} className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-500 shadow-lg" />
            <div className="text-left hidden md:block">
              <h1 className="font-black text-sm leading-none">{authState.user?.username}</h1>
            </div>
          </button>
          
          <div className="flex gap-1">
             <button onClick={() => setShowRequestsModal(true)} className="relative p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">
                <ICONS.Users size={18} />
                {pendingRequests.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                    {pendingRequests.length}
                  </span>
                )}
             </button>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800">
                {isDarkMode ? '🌞' : '🌙'}
             </button>
             <button onClick={() => { localStorage.removeItem(STORAGE_KEYS.AUTH); window.location.reload(); }} className="p-2.5 rounded-xl hover:bg-red-50 text-red-500">
                <ICONS.Delete size={18} />
             </button>
          </div>
        </header>

        <div className="p-4">
          <div className="relative">
            <ICONS.Search className="absolute left-4 top-3 text-slate-400" size={16} />
            <input placeholder="Search chats..." className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-medium outline-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ChatList chats={chats} activeId={activeChatId} onSelect={setActiveChatId} onDeleteChat={() => {}} />
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-zinc-800">
           <button onClick={() => setShowAddModal(true)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
             Add Contact
           </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col relative bg-[#f8fafc] dark:bg-zinc-950">
        {activeChatId ? (
          <ChatWindow chat={chats.find(c => c.id === activeChatId)!} messages={messages} isTyping={isTyping} onSendMessage={handleSendMessage} onReaction={() => {}} onDelete={() => {}} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <ICONS.Chat size={64} className="text-emerald-500/20 mb-6" />
            <h2 className="text-2xl font-black mb-2">Nexus Messaging</h2>
            <p className="text-slate-400 text-sm max-w-xs">Select a secure room to start communicating.</p>
          </div>
        )}
      </main>

      {showAddModal && <AddContactModal onClose={() => setShowAddModal(false)} onSent={() => {}} />}
      {showRequestsModal && <RequestsModal requests={pendingRequests} onClose={() => setShowRequestsModal(false)} onUpdate={() => { refreshRequests(); refreshChats(); }} />}
      {showProfileModal && authState.user && <ProfileModal user={authState.user} onClose={() => setShowProfileModal(false)} onUpdate={async () => {}} />}
    </div>
  );
};

export default App;
