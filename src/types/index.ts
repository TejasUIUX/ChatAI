export interface SummaryResult {
  sec10: string;
  min1: string;
  fullBreakdown: string;
  actionPoints: string[];
}

export interface ApiConfig {
  apiKey: string;
  model: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  content: string; // base64 for images, text content for files
  mimeType?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  projectId?: string; // Optional: if null, it's in "Unorganized"
  title: string;
  messages: Message[];
  timestamp: number;
}
