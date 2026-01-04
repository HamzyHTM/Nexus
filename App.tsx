
import React, { useState, useEffect } from 'react';
import { db } from './services/mockBackend';
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

  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (savedAuth) {
      setAuthState(JSON.parse(savedAuth));
    }
  }, []);

  useEffect(() => {
    if (authState.isAuthenticated) {
      db.getChats().then(setChats);
    }
  }, [authState.isAuthenticated]);

  useEffect(() => {
    if (activeChatId) {
      db.getMessages(activeChatId).then(setMessages);
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [isDarkMode]);

  const handleLogin = async (username: string, password: string) => {
    const res = await db.login(username, password);
    setAuthState(res);
  };

  const handleSignup = async (username: string, password: string) => {
    const res = await db.signup(username, password);
    setAuthState(res);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    setAuthState({ user: null, token: null, isAuthenticated: false });
    setActiveChatId(null);
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    try {
      const updatedUser = await db.updateProfile(updates);
      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChatId || !authState.user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId: activeChatId,
      senderId: authState.user.id,
      text,
      timestamp: Date.now(),
      status: 'sent',
      reactions: {}
    };

    const sent = await db.sendMessage(newMessage);
    setMessages(prev => [...prev, sent]);

    setChats(prev => prev.map(c => 
      c.id === activeChatId ? { ...c, lastMessage: sent } : c
    ));

    const currentChat = chats.find(c => c.id === activeChatId);
    if (currentChat?.participants.includes('u1')) {
      setIsTyping(true);
      const history = messages.slice(-5).map(m => ({
        role: m.senderId === authState.user.id ? 'user' : 'assistant',
        text: m.text
      }));
      
      const aiResponseText = await getAIResponse(text, history);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        chatId: activeChatId,
        senderId: 'u1',
        text: aiResponseText || '',
        timestamp: Date.now(),
        status: 'read',
        reactions: {}
      };

      await db.sendMessage(aiMessage);
      setMessages(prev => [...prev, aiMessage]);
      setChats(prev => prev.map(c => 
        c.id === activeChatId ? { ...c, lastMessage: aiMessage } : c
      ));
      setIsTyping(false);
    }
  };

  const handleAddContact = async (userId: string) => {
    const newChat = await db.addContact(userId);
    const updatedChats = await db.getChats();
    setChats(updatedChats);
    setActiveChatId(newChat.id);
    setShowAddModal(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      await db.removeChat(chatId);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) setActiveChatId(null);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!authState.user) return;
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    const currentReactions = { ...message.reactions };
    const users = (currentReactions[emoji] || []) as string[];
    if (users.includes(authState.user.id)) {
      currentReactions[emoji] = users.filter(id => id !== authState.user.id);
    } else {
      currentReactions[emoji] = [...users, authState.user.id];
    }
    const updated = { ...message, reactions: currentReactions };
    await db.updateMessage(updated);
    setMessages(prev => prev.map(m => m.id === messageId ? updated : m));
  };

  const handleDeleteMessage = async (messageId: string) => {
    await db.deleteMessage(messageId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted' } : m));
  };

  if (!authState.isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} onSignup={handleSignup} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* Sidebar */}
      <div className="w-full md:w-96 flex-shrink-0 border-r border-slate-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900 z-20">
        <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-zinc-800">
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 p-2 rounded-2xl transition-all group"
          >
            <div className="relative">
              <img src={authState.user?.profilePic} className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 group-hover:scale-105" alt="Profile" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
            </div>
            <div className="text-left">
              <span className="font-bold text-base block leading-none">{authState.user?.username}</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">{authState.user?.status}</span>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <span className="text-xl">🌞</span> : <span className="text-xl">🌙</span>}
            </button>
            <button 
              onClick={handleLogout} 
              className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
              title="Logout"
            >
              <ICONS.Delete size={20} />
            </button>
          </div>
        </div>

        <div className="p-3">
          <div className="relative group">
            <ICONS.Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-emerald-500" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative">
          <ChatList 
            chats={chats} 
            activeId={activeChatId} 
            onSelect={setActiveChatId}
            onDeleteChat={handleDeleteChat}
          />
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
          >
            <span className="text-3xl group-hover:rotate-90 transition-transform">+</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-zinc-950 relative">
        {activeChatId ? (
          <ChatWindow 
            chat={chats.find(c => c.id === activeChatId)!}
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            onReaction={handleReaction}
            onDelete={handleDeleteMessage}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-zinc-900/20">
            <div className="w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-3 shadow-xl">
              <ICONS.Chat size={64} className="text-emerald-600 -rotate-3" />
            </div>
            <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Nexus Chat</h1>
            <p className="text-slate-500 dark:text-zinc-400 max-w-sm text-lg font-medium leading-relaxed">
              Experience the future of messaging. Connect with friends or chat with Alex AI.
            </p>
            <div className="mt-12 flex gap-4 text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
              <span className="flex items-center gap-2"><ICONS.Sent size={14} className="text-emerald-500" /> Secure</span>
              <span className="flex items-center gap-2"><ICONS.Sent size={14} className="text-emerald-500" /> Cloud Sync</span>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddContactModal 
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddContact}
        />
      )}

      {showProfileModal && authState.user && (
        <ProfileModal 
          user={authState.user}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default App;
