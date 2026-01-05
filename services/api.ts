
import { User, Chat, Message, AuthState, FriendRequest } from '../types';
import { STORAGE_KEYS } from '../constants';
import { socket } from './socket';

// Incrementing version to 2.7.0 to wipe all previous pioneer/mock data
const DB_VERSION = '2.7.0'; 
const VERSION_KEY = 'nexus_db_version';

const USERS_DB = 'nexus_users_real';
const CHATS_DB = 'nexus_chats_real';
const MESSAGES_DB = 'nexus_messages_real';
const REQUESTS_DB = 'nexus_requests_real';

class ApiService {
  constructor() {
    this.checkVersionAndReset();
    this.seedDatabase();
  }

  private checkVersionAndReset() {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== DB_VERSION) {
      console.log(`[Database] Initializing Clean Registry Version ${DB_VERSION}`);
      localStorage.removeItem(USERS_DB);
      localStorage.removeItem(CHATS_DB);
      localStorage.removeItem(MESSAGES_DB);
      localStorage.removeItem(REQUESTS_DB);
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.CHATS);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      
      localStorage.setItem(VERSION_KEY, DB_VERSION);
    }
  }

  private get(key: string) { 
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : []; 
  }
  
  private save(key: string, data: any) { 
    localStorage.setItem(key, JSON.stringify(data)); 
    window.dispatchEvent(new Event('storage'));
  }

  private seedDatabase() {
    const users = this.get(USERS_DB);
    if (users.length === 0) {
      // Registry starts completely empty for a true production-ready feel.
      // We only keep a hidden system entry for AI internal logic if needed, 
      // but it is tagged as 'system' so it won't appear in member searches.
      const systemUsers: any[] = [
        { 
          id: 'u_alex_ai', 
          username: 'Alex AI', 
          password: 'password',
          profilePic: 'https://api.dicebear.com/7.x/bottts/svg?seed=nexus', 
          status: 'Nexus AI Core', 
          isOnline: true,
          role: 'system'
        }
      ];
      this.save(USERS_DB, systemUsers);
    }
  }

  async login(username: string, password: string): Promise<AuthState> {
    const users = this.get(USERS_DB);
    const user = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (!user) throw new Error("Invalid username or password.");
    
    const { password: _, ...userSafe } = user;
    const state = { 
      user: { ...userSafe, isOnline: true } as User, 
      token: `jwt_${Math.random().toString(36).substr(2)}`, 
      isAuthenticated: true 
    };
    
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(state));
    this.save(USERS_DB, users.map((u: any) => u.id === user.id ? { ...u, isOnline: true } : u));
    
    return state;
  }

  async register(username: string, password: string): Promise<AuthState> {
    const users = this.get(USERS_DB);
    const normalizedUsername = username.trim();

    if (users.some((u: any) => u.username.toLowerCase() === normalizedUsername.toLowerCase())) {
      throw new Error("Handle already exists in the live registry.");
    }

    const newUser: User = { 
      id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
      username: normalizedUsername, 
      profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedUsername}`, 
      status: 'New Nexus Citizen', 
      isOnline: true,
      role: 'member'
    };

    const userToStore = { ...newUser, password };
    users.push(userToStore);
    this.save(USERS_DB, users);

    socket.emit('new_user', newUser);

    const state = { 
      user: newUser, 
      token: `jwt_${Math.random().toString(36).substr(2)}`, 
      isAuthenticated: true 
    };
    
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(state));
    return state;
  }

  async searchUsers(query: string): Promise<User[]> {
  if (!query.trim()) return [];

  const users: User[] = this.get(USERS_DB);
  const auth = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.AUTH) || '{}'
  );

  const q = query.toLowerCase();

  return users.filter((user) => {
    // exclude current user
    if (user.id === auth?.user?.id) return false;

    // match username directly from "database"
    return user.username.toLowerCase().includes(q);
  });
}


  async sendFriendRequest(toId: string): Promise<FriendRequest> {
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    if (!auth.user) throw new Error("Authentication session expired.");
    
    const requests = this.get(REQUESTS_DB);
    const existing = requests.find((r: FriendRequest) => 
      r.fromId === auth.user.id && r.toId === toId && r.status === 'pending'
    );
    
    if (existing) throw new Error("A request for this user is already pending.");

    const newReq: FriendRequest = {
      id: `req_${Date.now()}`,
      fromId: auth.user.id,
      fromUsername: auth.user.username,
      toId,
      status: 'pending',
      timestamp: Date.now()
    };
    
    requests.push(newReq);
    this.save(REQUESTS_DB, requests);
    return newReq;
  }

  async getPendingRequests(): Promise<FriendRequest[]> {
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    if (!auth.user) return [];
    const requests = this.get(REQUESTS_DB);
    return requests.filter((r: FriendRequest) => r.toId === auth.user.id && r.status === 'pending');
  }

  async respondToRequest(requestId: string, status: 'accepted' | 'declined'): Promise<void> {
    const requests = this.get(REQUESTS_DB);
    const reqIndex = requests.findIndex((r: FriendRequest) => r.id === requestId);
    if (reqIndex === -1) return;

    requests[reqIndex].status = status;
    this.save(REQUESTS_DB, requests);

    if (status === 'accepted') {
      const req = requests[reqIndex];
      await this.createChat(req.fromId);
    }
  }

  async createChat(targetUserId: string): Promise<Chat> {
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    const chats = this.get(CHATS_DB);
    
    const existing = chats.find((c: Chat) => 
      c.participants.includes(auth.user.id) && c.participants.includes(targetUserId)
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

  async getChats(): Promise<Chat[]> {
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    if (!auth.user) return [];
    
    const chats = this.get(CHATS_DB);
    const users = this.get(USERS_DB);
    
    return chats.filter((c: Chat) => c.participants.includes(auth.user.id))
      .map((c: Chat) => {
        const otherId = c.participants.find(p => p !== auth.user.id);
        const otherUser = users.find((u: User) => u.id === otherId);
        return { 
          ...c, 
          name: otherUser?.username || 'Nexus User', 
          avatar: otherUser?.profilePic, 
          isOnline: otherUser?.isOnline 
        };
      });
  }

  async getMessages(chatId: string): Promise<Message[]> {
    return this.get(MESSAGES_DB).filter((m: Message) => m.chatId === chatId);
  }

  async sendMessage(msg: Message): Promise<Message> {
    const all = this.get(MESSAGES_DB);
    all.push(msg);
    this.save(MESSAGES_DB, all);
    return msg;
  }
}

export const api = new ApiService();
