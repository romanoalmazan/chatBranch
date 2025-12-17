/**
 * Types for conversation, branch, and message entities.
 * These are designed to be compatible with Google Cloud Firestore.
 * 
 * TODO: When integrating Firestore, these will map to Firestore documents:
 * - Conversation: /conversations/{conversationId}
 * - Branch: /conversations/{conversationId}/branches/{branchId}
 * - Message: /conversations/{conversationId}/branches/{branchId}/messages/{messageId}
 */

import { Message, MessageRole } from './chat';

export interface Conversation {
  id: string;
  userId: string; // User who owns this conversation
  createdAt: Date;
  updatedAt: Date;
  // TODO: Add metadata, title, etc. when implementing Firestore
}

export interface Branch {
  id: string;
  conversationId: string;
  parentBranchId?: string; // For branching: which branch this was created from
  parentMessageId?: string; // The message from which this branch was created
  createdAt: Date;
  updatedAt: Date;
  // TODO: Add branch metadata, name, etc. when implementing Firestore
}

export interface StoredMessage extends Message {
  id: string;
  branchId: string;
  conversationId: string;
  timestamp: Date;
  // TODO: Add metadata like token counts, model version, etc. when implementing Firestore
}



