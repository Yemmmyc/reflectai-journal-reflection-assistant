export type ReflectionMode = 'reflection' | 'brainstorm' | 'summary' | 'clarity';

export type JournalMood = 'mindful' | 'creative' | 'seeking-clarity' | 'grateful' | 'energized' | 'thoughtful';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  response: string;
  mode: ReflectionMode;
  mood: JournalMood;
  tags: string[];
  conversation: ChatMessage[];
  summary?: string;
  keyThemes?: string[];
  actionInsight?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
