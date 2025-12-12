import { Firestore } from '@google-cloud/firestore';
import { config } from '../config';
import { Conversation, Branch, StoredMessage } from '../types/conversation';
import { Message } from '../types/chat';
import path from 'path';

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
const conversationsRef = firestore.collection('conversations');

/**
 * Get or create a conversation
 */
export async function getOrCreateConversation(conversationId: string): Promise<Conversation> {
  const conversationDoc = await conversationsRef.doc(conversationId).get();
  
  if (conversationDoc.exists) {
    const data = conversationDoc.data()!;
    return {
      id: conversationId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  } else {
    // Create new conversation
    const now = new Date();
    const conversation: Omit<Conversation, 'id'> = {
      createdAt: now,
      updatedAt: now,
    };
    
    await conversationsRef.doc(conversationId).set({
      ...conversation,
      createdAt: Firestore.Timestamp.fromDate(conversation.createdAt),
      updatedAt: Firestore.Timestamp.fromDate(conversation.updatedAt),
    });
    
    return {
      id: conversationId,
      ...conversation,
    };
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
    const branch: Omit<Branch, 'id' | 'conversationId'> = {
      parentBranchId,
      parentMessageId,
      createdAt: now,
      updatedAt: now,
    };
    
    await branchRef.set({
      ...branch,
      createdAt: Firestore.Timestamp.fromDate(branch.createdAt),
      updatedAt: Firestore.Timestamp.fromDate(branch.updatedAt),
    });
    
    return {
      id: branchId,
      conversationId,
      ...branch,
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
  message: Message
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
    timestamp: Firestore.Timestamp.fromDate(timestamp),
  });
  
  // Update branch and conversation timestamps
  await conversationsRef
    .doc(conversationId)
    .collection('branches')
    .doc(branchId)
    .update({
      updatedAt: Firestore.Timestamp.fromDate(timestamp),
    });
  
  await conversationsRef.doc(conversationId).update({
    updatedAt: Firestore.Timestamp.fromDate(timestamp),
  });
  
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
  const branchId = newBranchId || `branch-${Date.now()}`;
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

