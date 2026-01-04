
import { User, Chat, Message, AuthState } from '../types';
import { STORAGE_KEYS } from '../constants';

const LOCAL_USERS_KEY = 'nexus_registered_users';

// Global registry of all "system" users (NPCs)
const SYSTEM_USERS: User[] = [
  { id: 'u1', username: 'Alex AI', profilePic: 'https://picsum.photos/seed/ai/200', status: 'Thinking...', isOnline: true },
  { id: 'u2', username: 'Sarah Jenkins', profilePic: 'https://picsum.photos/seed/sarah/200', status: 'At the gym 🏋️', isOnline: true },
  { id: 'u3', username: 'Mike Ross', profilePic: 'https://picsum.photos/seed/mike/200', status: 'Busy', isOnline: false },
  { id: 'u4', username: 'Jessica Pearson', profilePic: 'https://picsum.photos/seed/jessica/200', status: 'Available', isOnline: true },
  { id: 'u5', username: 'Louis Litt', profilePic: 'https://picsum.photos/seed/louis/200', status: 'Working...', isOnline: false },
];

class MockBackend {
  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify([
        { id: 'c1', type: 'individual', participants: ['u1', 'current'], unreadCount: 0 },
      ]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
    }
    if (!localStorage.getItem(LOCAL_USERS_KEY)) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([]));
    }
  }

  private getRegisteredUsers(): any[] {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  }

  async signup(username: string, password: string): Promise<AuthState> {
    await new Promise(r => setTimeout(r, 1200));
    const users = this.getRegisteredUsers();
    
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("Username already taken");
    }

    const newUser = {
      id: 'user_' + Date.now(),
      username,
      password, // In a real app, this would be hashed
      profilePic: `https://picsum.photos/seed/${username}/200`,
      status: 'Hey there! I am using Nexus.',
      isOnline: true
    };

    users.push(newUser);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = newUser;
    const state = { 
      user: userWithoutPassword as User, 
      token: 'mock-jwt-' + Date.now(), 
      isAuthenticated: true 
    };
    
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(state));
    return state;
  }

  async login(username: string, password: string): Promise<AuthState> {
    await new Promise(r => setTimeout(r, 1000));
    const users = this.getRegisteredUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (!user) {
      throw new Error("Invalid username or password");
    }

    const { password: _, ...userWithoutPassword } = user;
    const state = { 
      user: userWithoutPassword as User, 
      token: 'mock-jwt-' + Date.now(), 
      isAuthenticated: true 
    };
    
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(state));
    return state;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    await new Promise(r => setTimeout(r, 600));
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    if (!auth.user) throw new Error("Not authenticated");
    
    // Update in registry
    const users = this.getRegisteredUsers();
    const userIndex = users.findIndex(u => u.id === auth.user.id);
    if (userIndex > -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    }

    auth.user = { ...auth.user, ...updates };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
    return auth.user;
  }

  async searchUsers(query: string): Promise<User[]> {
    await new Promise(r => setTimeout(r, 300));
    const q = query.toLowerCase();
    return SYSTEM_USERS.filter(u => u.username.toLowerCase().includes(q));
  }

  async getChats(): Promise<Chat[]> {
    const chats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]');
    return chats.map((c: Chat) => {
      if (c.type === 'individual') {
        const otherId = c.participants.find(p => p !== 'current' && !p.startsWith('user_'));
        const otherUser = SYSTEM_USERS.find(u => u.id === otherId);
        if (otherUser) {
          return { ...c, name: otherUser.username, avatar: otherUser.profilePic };
        }
      }
      return c;
    });
  }

  async addContact(userId: string): Promise<Chat> {
    const chats = await this.getChats();
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
    const currentId = auth.user?.id || 'current';
    
    const existing = chats.find(c => c.participants.includes(userId) && c.type === 'individual');
    if (existing) return existing;

    const newChat: Chat = {
      id: 'c' + Date.now(),
      type: 'individual',
      participants: [currentId, userId],
      unreadCount: 0
    };
    
    const allChats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]');
    allChats.push(newChat);
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
    return newChat;
  }

  async removeChat(chatId: string): Promise<void> {
    const chats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]');
    const filtered = chats.filter((c: any) => c.id !== chatId);
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(filtered));
    
    const allMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    const keptMessages = allMessages.filter((m: Message) => m.chatId !== chatId);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(keptMessages));
  }

  async getMessages(chatId: string): Promise<Message[]> {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    return all.filter((m: Message) => m.chatId === chatId);
  }

  async sendMessage(message: Message): Promise<Message> {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    all.push(message);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    return message;
  }

  async updateMessage(updatedMessage: Message): Promise<void> {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    const index = all.findIndex((m: Message) => m.id === updatedMessage.id);
    if (index > -1) {
      all[index] = updatedMessage;
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    const index = all.findIndex((m: Message) => m.id === messageId);
    if (index > -1) {
      all[index].isDeleted = true;
      all[index].text = 'This message was deleted';
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    }
  }
}

export const db = new MockBackend();
