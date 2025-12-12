import { Message } from '../types/chat';

export interface ChatRequest {
  conversationId?: string;
  branchId?: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
}

export interface ChatResponse {
  conversationId: string;
  branchId: string;
  messages: { role: 'assistant'; content: string }[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Send a chat message to the backend API
 * 
 * @param messages - Array of messages in the conversation
 * @param conversationId - Optional conversation ID (defaults to "demo" for now)
 * @param branchId - Optional branch ID (defaults to "main" for now)
 * @returns Promise resolving to the chat response
 */
export async function sendMessage(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  conversationId: string = 'demo',
  branchId: string = 'main'
): Promise<ChatResponse> {
  const requestBody: ChatRequest = {
    conversationId,
    branchId,
    messages,
  };

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}


