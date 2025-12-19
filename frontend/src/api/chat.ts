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

export interface Branch {
  id: string;
  conversationId: string;
  parentBranchId?: string;
  parentMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Get auth token from auth context
 * This function will be called by API functions to get the current user's token
 */
let getAuthTokenFn: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  getAuthTokenFn = fn;
}

async function getAuthToken(): Promise<string | null> {
  if (!getAuthTokenFn) {
    return null;
  }
  return await getAuthTokenFn();
}

/**
 * Send a chat message to the backend API
 * Now only sends the current message - backend loads history from Firestore
 * 
 * @param messages - Array containing only the current user message
 * @param conversationId - Conversation ID
 * @param branchId - Branch ID
 * @returns Promise resolving to the chat response
 */
export async function sendMessage(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  conversationId: string,
  branchId: string
): Promise<ChatResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const requestBody: ChatRequest = {
    conversationId,
    branchId,
    messages,
  };

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in again');
    }
    if (response.status === 404) {
      // For chat/branch endpoints that might return 404 for new items
      // we'll let the specific functions handle it or return a safe default
      const errorData = await response.json().catch(() => ({ error: 'Not found' }));
      throw new Error(errorData.error || 'Resource not found');
    }
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Load conversation history from backend
 */
export async function loadConversation(
  conversationId: string,
  branchId: string
): Promise<Message[]> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationId}/branches/${branchId}/messages`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in again');
    }
    if (response.status === 404) {
      // Branch doesn't exist yet, return empty array
      return [];
    }
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const messages = await response.json();
  // Convert backend messages to frontend format with IDs and timestamps
  // Backend now returns messages with IDs
  return messages.map((msg: { id: string; role: string; content: string; timestamp?: string }) => ({
    id: msg.id,
    role: msg.role as Message['role'],
    content: msg.content,
    timestamp: msg.timestamp || new Date().toISOString(),
  }));
}

/**
 * Create a new branch from a message
 */
export async function createBranch(
  conversationId: string,
  parentBranchId: string,
  parentMessageId: string,
  branchId?: string
): Promise<Branch> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const response = await fetch(`${API_BASE_URL}/api/branches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      conversationId,
      parentBranchId,
      parentMessageId,
      branchId,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in again');
    }
    if (response.status === 404) {
      // For chat/branch endpoints that might return 404 for new items
      // we'll let the specific functions handle it or return a safe default
      const errorData = await response.json().catch(() => ({ error: 'Not found' }));
      throw new Error(errorData.error || 'Resource not found');
    }
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const branch = await response.json();
  // Convert Date objects to strings
  return {
    ...branch,
    createdAt: branch.createdAt ? new Date(branch.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: branch.updatedAt ? new Date(branch.updatedAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * Get all branches for a conversation
 */
export async function getBranches(conversationId: string): Promise<Branch[]> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationId}/branches`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in again');
    }
    if (response.status === 404) {
      // For chat/branch endpoints that might return 404 for new items
      // we'll let the specific functions handle it or return a safe default
      const errorData = await response.json().catch(() => ({ error: 'Not found' }));
      throw new Error(errorData.error || 'Resource not found');
    }
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const branches = await response.json();
  // Convert Date objects to strings
  return branches.map((branch: Branch) => ({
    ...branch,
    createdAt: branch.createdAt ? new Date(branch.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: branch.updatedAt ? new Date(branch.updatedAt).toISOString() : new Date().toISOString(),
  }));
}


