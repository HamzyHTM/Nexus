
import { User, Chat, Message, AuthState, FriendRequest } from '../types';
import { STORAGE_KEYS } from '../constants';
import { socket } from './socket';

// Increment this version to force a database reset whenever the code logic changes significantly
const DB_VERSION = '2.2.0'; 
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
      console.log(`[Database] Resetting storage for version ${DB_VERSION}`);
      // Clear all nexus-related storage to ensure a clean state
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
    // Dispatch storage event so other tabs/components are aware of the persistent update
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
          status: 'Always here to help you navigate.', 
          isOnline: true 
        },
        { 
          id: 'u_alex_ai', 
          username: 'Alex AI', 
          password: 'password', 
          profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 
          status: 'Artificial Intelligence, Real Connection.', 
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
    // Set user as online in the shared registry
    this.save(USERS_DB, users.map((u: any) => u.id === user.id ? { ...u, isOnline: true } : u));
    
    return state;
  }

  async register(username: string, password: string): Promise<AuthState> {
    const users = this.get(USERS_DB);
    const normalizedUsername = username.trim();

    if (users.some((u: any) => u.username.toLowerCase() === normalizedUsername.toLowerCase())) {
      throw new Error("Handle already exists in the live registry.");
    }

    const newUser = { 
      id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
      username: normalizedUsername, 
      password, 
      profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedUsername}`, 
      status: 'Connected to Nexus', 
      isOnline: true 
    };

    // 1. Add to the "database" instantly
    users.push(newUser);
    this.save(USERS_DB, users);

    // 2. Broadcast to all other sessions/tabs that a new user is available
    socket.emit('new_user', newUser);

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
    
    // Always fetch the freshest snapshot of the USERS_DB
    const users = this.get(USERS_DB);
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    const q = query.toLowerCase();
    
    // Exact match prioritization then fuzzy
    return users.filter((u: User) => 
      u.id !== auth.user?.id && 
      u.username.toLowerCase().includes(q)
    ).sort((a, b) => {
      const aStarts = a.username.toLowerCase().startsWith(q);
      const bStarts = b.username.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    }).slice(0, 10);
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
