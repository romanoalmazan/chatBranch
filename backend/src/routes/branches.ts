import { Request, Response } from 'express';
import { createBranchFromMessage, getConversationBranches, loadBranchMessages, loadBranchMessagesWithIds, verifyConversationOwnership, conversationsRef } from '../services/firestore';

/**
 * Create a new branch from a specific message
 * POST /api/branches
 */
export async function createBranchHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.userId;
    const { conversationId, parentBranchId, parentMessageId, branchId } = req.body;

    if (!conversationId || !parentBranchId || !parentMessageId) {
      res.status(400).json({
        error: 'conversationId, parentBranchId, and parentMessageId are required',
      });
      return;
    }

    // Verify user owns the conversation
    const ownsConversation = await verifyConversationOwnership(conversationId, userId);
    if (!ownsConversation) {
      res.status(403).json({ error: 'Forbidden: User does not own this conversation' });
      return;
    }

    const branch = await createBranchFromMessage(
      conversationId,
      parentBranchId,
      parentMessageId,
      branchId
    );

    res.json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get all branches for a conversation
 * GET /api/conversations/:conversationId/branches
 */
export async function getBranchesHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.userId;
    const { conversationId } = req.params;
    
    if (!conversationId) {
      res.status(400).json({ error: 'conversationId is required' });
      return;
    }

    // Check if conversation exists and verify ownership
    const conversationDoc = await conversationsRef.doc(conversationId).get();
    if (!conversationDoc.exists) {
      // Conversation doesn't exist yet (new conversation) - return empty array
      res.json([]);
      return;
    }

    // Verify user owns the conversation
    const ownsConversation = await verifyConversationOwnership(conversationId, userId);
    if (!ownsConversation) {
      res.status(403).json({ error: 'Forbidden: User does not own this conversation' });
      return;
    }

    const branches = await getConversationBranches(conversationId);
    res.json(branches);
  } catch (error) {
    // Handle NOT_FOUND (code 5) as empty array - conversation doesn't exist yet
    if (error instanceof Error && (error as any).code === 5) {
      console.log(`[Firestore] Conversation ${req.params.conversationId} not found, returning empty array`);
      res.json([]);
      return;
    }
    
    console.error('Error getting branches:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get messages for a specific branch
 * GET /api/conversations/:conversationId/branches/:branchId/messages
 */
export async function getBranchMessagesHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.userId;
    const { conversationId, branchId } = req.params;
    
    if (!conversationId || !branchId) {
      res.status(400).json({ error: 'conversationId and branchId are required' });
      return;
    }

    // Check if conversation exists and verify ownership
    const conversationDoc = await conversationsRef.doc(conversationId).get();
    if (!conversationDoc.exists) {
      // Conversation doesn't exist yet (new conversation) - return empty array
      res.json([]);
      return;
    }

    // Verify user owns the conversation
    const ownsConversation = await verifyConversationOwnership(conversationId, userId);
    if (!ownsConversation) {
      res.status(403).json({ error: 'Forbidden: User does not own this conversation' });
      return;
    }

    // Return messages with IDs for frontend to use in branching
    const messagesWithIds = await loadBranchMessagesWithIds(conversationId, branchId);
    res.json(messagesWithIds);
  } catch (error) {
    // Handle NOT_FOUND (code 5) as 404 - branch/collection doesn't exist yet
    if (error instanceof Error && (error as any).code === 5) {
      console.log(`[Firestore] Branch ${req.params.branchId} not found, returning empty array`);
      res.json([]);
      return;
    }
    
    console.error('Error getting branch messages:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

