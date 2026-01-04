
import React from 'react';
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Search, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Send, 
  Check, 
  CheckCheck,
  Trash2,
  Reply,
  Heart,
  ThumbsUp,
  Laugh,
  User as UserIcon
} from 'lucide-react';

export const ICONS = {
  Chat: MessageSquare,
  Users: Users,
  Settings: Settings,
  Search: Search,
  Menu: MoreVertical,
  Attachment: Paperclip,
  Emoji: Smile,
  Send: Send,
  Sent: Check,
  Read: CheckCheck,
  Delete: Trash2,
  Reply: Reply,
  Heart: Heart,
  Like: ThumbsUp,
  Laugh: Laugh,
  Profile: UserIcon
};

export const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

export const STORAGE_KEYS = {
  AUTH: 'nexus_auth',
  CHATS: 'nexus_chats',
  MESSAGES: 'nexus_messages',
  THEME: 'nexus_theme'
};
