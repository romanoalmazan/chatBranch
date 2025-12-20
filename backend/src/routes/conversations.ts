import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getUserConversations, verifyConversationOwnership, deleteConversation } from '../services/firestore';

/**
 * Get all conversations for the authenticated user
 * GET /api/conversations
 */
export async function getConversationsHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.userId;
    const conversations = await getUserConversations(userId);
    
    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Create a new conversation
 * POST /api/conversations
 */
export async function createConversationHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.userId;
    const conversationId = uuidv4();
    
    // The conversation will be created automatically when the first message is sent
    // This endpoint is mainly for future use if we want to pre-create conversations
    res.json({
      id: conversationId,
      userId,
      message: 'Conversation will be created when first message is sent',
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Delete a conversation
 * DELETE /api/conversations/:conversationId
 */
export async function deleteConversationHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.userId;
    const conversationId = req.params.conversationId;

    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID is required' });
      return;
    }

    await deleteConversation(conversationId, userId);
    
    res.json({ 
      success: true,
      message: 'Conversation deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Verify conversation ownership middleware helper
 * Can be used in routes that need to verify ownership
 */
export async function verifyOwnership(conversationId: string, userId: string): Promise<boolean> {
  return await verifyConversationOwnership(conversationId, userId);
}
