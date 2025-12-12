export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ChatRequest {
  conversationId?: string;
  branchId?: string;
  messages: Message[];
}

export interface ChatResponse {
  conversationId: string;
  branchId: string;
  messages: Message[];
}


