
import { User, Chat, Message, AuthState } from '../types';
import { STORAGE_KEYS } from '../constants';

const USERS_DB = 'nexus_users_real';
const CHATS_DB = 'nexus_chats_real';
const MESSAGES_DB = 'nexus_messages_real';

class ApiService {
  constructor() {
    this.seedDatabase();
  }

  private get(key: string) { 
    return JSON.parse(localStorage.getItem(key) || '[]'); 
  }
  
  private save(key: string, data: any) { 
    localStorage.setItem(key, JSON.stringify(data)); 
    // Trigger storage event for cross-tab sync
    window.dispatchEvent(new Event('storage'));
  }

  private seedDatabase() {
    const users = this.get(USERS_DB);
    if (users.length === 0) {
      const initialUsers = [
        {
          id: 'u_nexus_guide',
          username: 'Nexus Guide',
          password: 'password',
          profilePic: 'https://api.dicebear.com/7.x/bottts/svg?seed=nexus',
          status: 'Here to help you navigate!',
          isOnline: true
        },
        {
          id: 'u_alex_ai',
          username: 'Alex AI',
          password: 'password',
          profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
          status: 'Always thinking...',
          isOnline: true
        }
      ];
      this.save(USERS_DB, initialUsers);
    }
  }

  async login(username: string, password: string): Promise<AuthState> {
    const users = this.get(USERS_DB);
    const user = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (!user) throw new Error("Invalid credentials");

    const state = {
      user: { ...user, isOnline: true } as User,
      token: `jwt_${Math.random().toString(36).substr(2)}`,
      isAuthenticated: true
    };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(state));
    
    const updatedUsers = users.map((u: any) => u.id === user.id ? { ...u, isOnline: true } : u);
    this.save(USERS_DB, updatedUsers);

    return state;
  }

  async register(username: string, password: string): Promise<AuthState> {
    const users = this.get(USERS_DB);
    if (users.find((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("Username already taken");
    }

    const newUser = {
      id: `u_${Date.now()}`,
      username,
      password,
      profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      status: 'Hey! I am new here.',
      isOnline: true
    };

    users.push(newUser);
    this.save(USERS_DB, users);

    const state = {
      user: newUser as User,
      token: `jwt_${Math.random().toString(36).substr(2)}`,
      isAuthenticated: true
    };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(state));
    return state;
  }

  async getChats(): Promise<Chat[]> {
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    if (!auth.user) return [];
    
    const chats = this.get(CHATS_DB);
    const users = this.get(USERS_DB);

    return chats
      .filter((c: Chat) => c.participants.includes(auth.user.id))
      .map((c: Chat) => {
        const otherId = c.participants.find(p => p !== auth.user.id);
        const otherUser = users.find((u: User) => u.id === otherId);
        return {
          ...c,
          name: otherUser?.username || 'Unknown User',
          avatar: otherUser?.profilePic,
          isOnline: otherUser?.isOnline
        };
      });
  }

  async createChat(targetUserId: string): Promise<Chat> {
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    const chats = this.get(CHATS_DB);
    
    const existing = chats.find((c: Chat) => 
      c.type === 'individual' && 
      c.participants.includes(auth.user.id) && 
      c.participants.includes(targetUserId)
    );

    if (existing) return existing;

    const newChat: Chat = {
      id: `c_${Date.now()}`,
      type: 'individual',
      participants: [auth.user.id, targetUserId],
      unreadCount: 0
    };

    chats.push(newChat);
    this.save(CHATS_DB, chats);
    return newChat;
  }

  async getMessages(chatId: string): Promise<Message[]> {
    const all = this.get(MESSAGES_DB);
    return all.filter((m: Message) => m.chatId === chatId);
  }

  async sendMessage(msg: Message): Promise<Message> {
    const all = this.get(MESSAGES_DB);
    all.push(msg);
    this.save(MESSAGES_DB, all);
    return msg;
  }

  async searchUsers(query: string): Promise<User[]> {
    const users = this.get(USERS_DB);
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    const currentUserId = auth.user?.id;

    if (!query.trim()) {
      return users
        .filter((u: User) => u.id !== currentUserId)
        .slice(-8)
        .reverse();
    }

    const q = query.toLowerCase();
    
    // Multi-tier search: StartsWith first, then Includes
    const startsWith = users.filter(u => 
      u.id !== currentUserId && 
      u.username.toLowerCase().startsWith(q)
    );
    
    const contains = users.filter(u => 
      u.id !== currentUserId && 
      u.username.toLowerCase().includes(q) && 
      !u.username.toLowerCase().startsWith(q)
    );

    return [...startsWith, ...contains].slice(0, 15);
  }
}

export const api = new ApiService();
