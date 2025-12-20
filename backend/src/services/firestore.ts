import { Firestore, Timestamp } from '@google-cloud/firestore';
import { config } from '../config';
import { Conversation, Branch, StoredMessage } from '../types/conversation';
import { Message } from '../types/chat';
import path from 'path';
import { generateConversationTitle } from './gemini';

// Initialize Firestore with explicit credentials if available
let firestoreOptions: { projectId: string; keyFilename?: string; credentials?: any } = {
  projectId: config.gcp.projectId,
};

// Get service account path from config or environment variable
const serviceAccountPath = config.credentials?.serviceAccountPath || process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (serviceAccountPath) {
  // Resolve the path - handle both relative and absolute paths
  // For relative paths, resolve from the backend directory
  let resolvedPath = serviceAccountPath;
  
  if (!path.isAbsolute(resolvedPath)) {
    // Resolve relative to the backend directory (where the .env file is)
    // __dirname is backend/src/services, so we need to go up 2 levels to get to backend/
    const backendDir = path.resolve(__dirname, '../..');
    resolvedPath = path.resolve(backendDir, resolvedPath);
    console.log(`[Firestore] Resolved path: ${resolvedPath}`);
  }
  
  // Verify the file exists and load credentials
  try {
    const fs = require('fs');
    if (fs.existsSync(resolvedPath)) {
      // Set GOOGLE_APPLICATION_CREDENTIALS environment variable FIRST
      // This is the most reliable way for Firestore SDK to pick up credentials
      process.env.GOOGLE_APPLICATION_CREDENTIALS = resolvedPath;
      
      // Load credentials as object and pass directly (more reliable)
      try {
        const credsContent = fs.readFileSync(resolvedPath, 'utf8');
        const creds = JSON.parse(credsContent);
        
        // Pass credentials directly as object
        firestoreOptions.credentials = creds;
        firestoreOptions.keyFilename = resolvedPath; // Also set as backup
        
        console.log(`[Firestore] Using service account: ${resolvedPath}`);
        console.log(`[Firestore] Service account: ${creds.client_email}`);
        console.log(`[Firestore] Project ID from credentials: ${creds.project_id}`);
        console.log(`[Firestore] Project ID from config: ${config.gcp.projectId}`);
        
        if (creds.project_id !== config.gcp.projectId) {
          console.warn(`[Firestore] WARNING: Project ID mismatch! Credentials project: ${creds.project_id}, Config project: ${config.gcp.projectId}`);
        }
      } catch (parseErr) {
        console.warn(`[Firestore] Could not parse service account file: ${parseErr}`);
        // Fallback to keyFilename only
        firestoreOptions.keyFilename = resolvedPath;
      }
    } else {
      console.warn(`[Firestore] Service account file not found: ${resolvedPath}`);
      console.warn(`[Firestore] Will attempt to use default credentials or environment variable`);
    }
  } catch (err) {
    console.warn(`[Firestore] Error checking service account file: ${err}`);
  }
} else {
  console.log(`[Firestore] No explicit credentials provided, using default authentication`);
}

console.log(`[Firestore] Initializing with project: ${config.gcp.projectId}`);
console.log(`[Firestore] GOOGLE_APPLICATION_CREDENTIALS env: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'not set'}`);

const firestore = new Firestore(firestoreOptions);

// Collection references
export const conversationsRef = firestore.collection('conversations');

/**
 * Get or create a conversation
 */
export async function getOrCreateConversation(conversationId: string, userId: string): Promise<Conversation> {
  const conversationDoc = await conversationsRef.doc(conversationId).get();
  
  if (conversationDoc.exists) {
    const data = conversationDoc.data()!;
    // Verify user owns this conversation
    if (data.userId !== userId) {
      throw new Error('Unauthorized: User does not own this conversation');
    }
    return {
      id: conversationId,
      userId: data.userId,
      title: data.title,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  } else {
    // Create new conversation
    const now = new Date();
    const conversation: Omit<Conversation, 'id'> = {
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    await conversationsRef.doc(conversationId).set({
      ...conversation,
      createdAt: Timestamp.fromDate(conversation.createdAt),
      updatedAt: Timestamp.fromDate(conversation.updatedAt),
    });
    
    return {
      id: conversationId,
      ...conversation,
    };
  }
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    console.log(`[Firestore] Loading conversations for user: ${userId}`);
    // Query without orderBy to avoid requiring a composite index
    // We'll sort in memory instead
    const snapshot = await conversationsRef
      .where('userId', '==', userId)
      .get();
    
    console.log(`[Firestore] Loaded ${snapshot.docs.length} conversations`);
    
    // Map and sort by updatedAt descending
    const conversations = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    });
    
    // Sort by updatedAt descending (most recent first)
    conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    return conversations;
  } catch (error) {
    console.error(`[Firestore] Error loading user conversations:`, error);
    throw error;
  }
}

/**
 * Verify that a user owns a conversation
 */
export async function verifyConversationOwnership(conversationId: string, userId: string): Promise<boolean> {
  try {
    const conversationDoc = await conversationsRef.doc(conversationId).get();
    
    if (!conversationDoc.exists) {
      return false;
    }
    
    const data = conversationDoc.data()!;
    return data.userId === userId;
  } catch (error) {
    console.error(`[Firestore] Error verifying conversation ownership:`, error);
    return false;
  }
}

/**
 * Delete a conversation and all its subcollections (branches and messages)
 * Note: Firestore doesn't automatically delete subcollections, so we must do it manually
 */
export async function deleteConversation(conversationId: string, userId: string): Promise<void> {
  try {
    // First verify ownership
    const ownsConversation = await verifyConversationOwnership(conversationId, userId);
    if (!ownsConversation) {
      throw new Error('Unauthorized: User does not own this conversation');
    }

    console.log(`[Firestore] Deleting conversation: ${conversationId}`);
    
    // Get all branches for this conversation
    const branchesRef = conversationsRef
      .doc(conversationId)
      .collection('branches');
    
    const branchesSnapshot = await branchesRef.get();
    
    // Delete all messages in each branch, then delete the branch
    const deletePromises: Promise<void>[] = [];
    
    for (const branchDoc of branchesSnapshot.docs) {
      const branchId = branchDoc.id;
      const messagesRef = branchesRef
        .doc(branchId)
        .collection('messages');
      
      const messagesSnapshot = await messagesRef.get();
      
      // Delete all messages in this branch
      const messageDeletePromises = messagesSnapshot.docs.map((msgDoc) => 
        msgDoc.ref.delete().then(() => {}) // Convert WriteResult to void
      );
      deletePromises.push(...messageDeletePromises);
      
      // Delete the branch document
      deletePromises.push(branchDoc.ref.delete().then(() => {})); // Convert WriteResult to void
    }
    
    // Wait for all subcollections to be deleted
    await Promise.all(deletePromises);
    
    // Finally, delete the conversation document itself
    await conversationsRef.doc(conversationId).delete();
    
    console.log(`[Firestore] Successfully deleted conversation: ${conversationId}`);
  } catch (error) {
    console.error(`[Firestore] Error deleting conversation:`, error);
    throw error;
  }
}

/**
 * Get or create a branch
 */
export async function getOrCreateBranch(
  conversationId: string,
  branchId: string,
  parentBranchId?: string,
  parentMessageId?: string
): Promise<Branch> {
  const branchRef = conversationsRef
    .doc(conversationId)
    .collection('branches')
    .doc(branchId);
  
  const branchDoc = await branchRef.get();
  
  if (branchDoc.exists) {
    const data = branchDoc.data()!;
    return {
      id: branchId,
      conversationId,
      parentBranchId: data.parentBranchId,
      parentMessageId: data.parentMessageId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  } else {
    // Create new branch
    const now = new Date();
    
    // Build the branch data object, excluding undefined values
    const branchData: any = {
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    
    // Only include optional fields if they are defined
    if (parentBranchId !== undefined) {
      branchData.parentBranchId = parentBranchId;
    }
    if (parentMessageId !== undefined) {
      branchData.parentMessageId = parentMessageId;
    }
    
    await branchRef.set(branchData);
    
    return {
      id: branchId,
      conversationId,
      parentBranchId,
      parentMessageId,
      createdAt: now,
      updatedAt: now,
    };
  }
}

/**
 * Load all messages for a conversation branch
 * Returns messages with their Firestore document IDs
 */
export async function loadBranchMessages(
  conversationId: string,
  branchId: string
): Promise<Message[]> {
  try {
    console.log(`[Firestore] Loading messages for conversation: ${conversationId}, branch: ${branchId}`);
    const messagesRef = conversationsRef
      .doc(conversationId)
      .collection('branches')
      .doc(branchId)
      .collection('messages');
    
    const snapshot = await messagesRef.orderBy('timestamp', 'asc').get();
    console.log(`[Firestore] Loaded ${snapshot.docs.length} messages`);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        role: data.role as Message['role'],
        content: data.content,
      };
    });
  } catch (error) {
    // Handle NOT_FOUND errors gracefully - means collection doesn't exist yet (empty)
    if (error instanceof Error && (error as any).code === 5) {
      console.log(`[Firestore] No messages found for branch ${branchId} (collection doesn't exist yet)`);
      return [];
    }
    console.error(`[Firestore] Error loading messages:`, error);
    if (error instanceof Error) {
      console.error(`[Firestore] Error code: ${(error as any).code}`);
      console.error(`[Firestore] Error details: ${(error as any).details}`);
    }
    throw error;
  }
}

/**
 * Load all messages with their IDs for a conversation branch
 * Used for branch creation to get message IDs
 */
export async function loadBranchMessagesWithIds(
  conversationId: string,
  branchId: string
): Promise<Array<Message & { id: string }>> {
  try {
    const messagesRef = conversationsRef
      .doc(conversationId)
      .collection('branches')
      .doc(branchId)
      .collection('messages');
    
    const snapshot = await messagesRef.orderBy('timestamp', 'asc').get();
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        role: data.role as Message['role'],
        content: data.content,
      };
    });
  } catch (error) {
    // Handle NOT_FOUND errors gracefully - means collection doesn't exist yet (empty)
    if (error instanceof Error && (error as any).code === 5) {
      return [];
    }
    throw error;
  }
}

/**
 * Save a message to Firestore
 */
export async function saveMessage(
  conversationId: string,
  branchId: string,
  message: Message,
  generateTitleIfFirst?: boolean
): Promise<StoredMessage> {
  const messagesRef = conversationsRef
    .doc(conversationId)
    .collection('branches')
    .doc(branchId)
    .collection('messages');
  
  const messageId = messagesRef.doc().id;
  const timestamp = new Date();
  
  const storedMessage: StoredMessage = {
    id: messageId,
    branchId,
    conversationId,
    timestamp,
    ...message,
  };
  
  await messagesRef.doc(messageId).set({
    ...storedMessage,
    timestamp: Timestamp.fromDate(timestamp),
  });
  
  // Update branch and conversation timestamps
  await conversationsRef
    .doc(conversationId)
    .collection('branches')
    .doc(branchId)
    .update({
      updatedAt: Timestamp.fromDate(timestamp),
    });
  
  // Update conversation timestamp first (don't wait for title generation)
  await conversationsRef.doc(conversationId).update({
    updatedAt: Timestamp.fromDate(timestamp),
  });
  
  // Generate title asynchronously if this is the first user message in the main branch
  if (generateTitleIfFirst && message.role === 'user' && branchId === 'main') {
    // Don't await - let this run in the background
    (async () => {
      try {
        const conversationDoc = await conversationsRef.doc(conversationId).get();
        if (conversationDoc.exists) {
          const data = conversationDoc.data()!;
          // Only generate title if conversation doesn't have one yet
          if (!data.title) {
            const title = await generateConversationTitle(message.content);
            await conversationsRef.doc(conversationId).update({
              title,
            });
          }
        }
      } catch (error) {
        console.error('Error generating conversation title:', error);
        // Continue without title if generation fails
      }
    })();
  }
  
  return storedMessage;
}

/**
 * Get all branches for a conversation
 */
export async function getConversationBranches(conversationId: string): Promise<Branch[]> {
  try {
    console.log(`[Firestore] Loading branches for conversation: ${conversationId}`);
    const branchesRef = conversationsRef
      .doc(conversationId)
      .collection('branches');
    
    const snapshot = await branchesRef.get();
    console.log(`[Firestore] Loaded ${snapshot.docs.length} branches`);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        conversationId,
        parentBranchId: data.parentBranchId,
        parentMessageId: data.parentMessageId,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    });
  } catch (error) {
    // Handle NOT_FOUND errors gracefully - means collection doesn't exist yet (empty)
    if (error instanceof Error && (error as any).code === 5) {
      console.log(`[Firestore] No branches found for conversation ${conversationId} (collection doesn't exist yet)`);
      return [];
    }
    console.error(`[Firestore] Error loading branches:`, error);
    if (error instanceof Error) {
      console.error(`[Firestore] Error code: ${(error as any).code}`);
      console.error(`[Firestore] Error details: ${(error as any).details}`);
    }
    throw error;
  }
}

/**
 * Create a new branch from an existing message
 * Note: Ownership is verified by the caller before calling this function
 */
export async function createBranchFromMessage(
  conversationId: string,
  parentBranchId: string,
  parentMessageId: string,
  newBranchId?: string
): Promise<Branch> {
  // Load all messages with IDs from parent branch
  const messagesWithIds = await loadBranchMessagesWithIds(conversationId, parentBranchId);
  
  // Find the index of the parent message
  const parentMessageIndex = messagesWithIds.findIndex((msg) => msg.id === parentMessageId);
  
  if (parentMessageIndex === -1) {
    throw new Error(`Parent message ${parentMessageId} not found in branch ${parentBranchId}`);
  }
  
  // Create new branch
  const branchId = newBranchId || `thread-${Date.now()}-${parentMessageId.substring(0, 8)}`;
  const branch = await getOrCreateBranch(
    conversationId,
    branchId,
    parentBranchId,
    parentMessageId
  );
  
  // Copy messages up to and including the parent message to the new branch
  const messagesToCopy = messagesWithIds.slice(0, parentMessageIndex + 1);
  for (const message of messagesToCopy) {
    await saveMessage(conversationId, branchId, {
      role: message.role,
      content: message.content,
    });
  }
  
  return branch;
}

