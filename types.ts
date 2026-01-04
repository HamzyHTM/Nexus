
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
  status: MessageStatus;
  reactions: Record<string, string[]>;
  isDeleted?: boolean;
}

export interface User {
  id: string;
  username: string;
  profilePic: string;
  status: string;
  isOnline: boolean;
  lastSeen?: number;
  role?: 'member' | 'system';
}

export interface Chat {
  id: string;
  type: 'individual' | 'group';
  name?: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  unreadCount: number;
  avatar?: string;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: number;
  fromUsername?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface SocketEvent {
  type: 'message' | 'typing' | 'status' | 'reaction' | 'friend_request' | 'request_accepted' | 'new_user';
  payload: any;
}
