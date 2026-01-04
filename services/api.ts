
import { User, Chat, Message, AuthState, FriendRequest } from '../types';
import { STORAGE_KEYS } from '../constants';

// Increment this version to force a database reset across all clients
const DB_VERSION = '2.1.0'; 
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
      console.log(`Database version mismatch (${storedVersion} vs ${DB_VERSION}). Resetting storage...`);
      // Clear all nexus-related keys
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      localStorage.removeItem(USERS_DB);
      localStorage.removeItem(CHATS_DB);
      localStorage.removeItem(MESSAGES_DB);
      localStorage.removeItem(REQUESTS_DB);
      
      localStorage.setItem(VERSION_KEY, DB_VERSION);
    }
  }

  private get(key: string) { 
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : []; 
  }
  
  private save(key: string, data: any) { 
    localStorage.setItem(key, JSON.stringify(data)); 
    // Trigger storage event for real-time cross-tab reactivity
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
          status: 'Your guide to the Nexus network.', 
          isOnline: true 
        },
        { 
          id: 'u_alex_ai', 
          username: 'Alex AI', 
          password: 'password', 
          profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 
          status: 'Always online, always thinking.', 
          isOnline: true 
        }
      ];
      this.save(USERS_DB, initialUsers);
    }
  }

  async login(username: string, password: string): Promise<AuthState> {
    const users = this.get(USERS_DB);
    const user = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (!user) throw new Error("Invalid username or password.");
    
    const state = { 
      user: { ...user, isOnline: true } as User, 
      token: `jwt_${Math.random().toString(36).substr(2)}`, 
      isAuthenticated: true 
    };
    
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(state));
    // Update online status in registry
    this.save(USERS_DB, users.map((u: any) => u.id === user.id ? { ...u, isOnline: true } : u));
    
    return state;
  }

  async register(username: string, password: string): Promise<AuthState> {
    const users = this.get(USERS_DB);
    if (users.find((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("This username is already registered in our real-time registry.");
    }

    const newUser = { 
      id: `u_${Date.now()}`, 
      username: username.trim(), 
      password, 
      profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`, 
      status: 'Available', 
      isOnline: true 
    };

    // Immediate persistence
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

  async searchUsers(query: string): Promise<User[]> {
    if (!query.trim()) return [];
    
    // Always fetch the freshest data from "database"
    const users = this.get(USERS_DB);
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    const q = query.toLowerCase();
    
    // Filter out current user and match by username
    return users.filter((u: User) => 
      u.id !== auth.user?.id && 
      u.username.toLowerCase().includes(q)
    ).slice(0, 15);
  }

  async sendFriendRequest(toId: string): Promise<FriendRequest> {
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    if (!auth.user) throw new Error("Authentication required");
    
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
      // When accepted, automatically create a chat session
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
