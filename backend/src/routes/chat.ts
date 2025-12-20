import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ChatRequest, ChatResponse, Message } from '../types/chat';
import { callGemini } from '../services/gemini';
import {
  getOrCreateConversation,
  getOrCreateBranch,
  loadBranchMessages,
  saveMessage,
} from '../services/firestore';

/**
 * Chat endpoint
 * POST /api/chat
 * 
 * TODO: Integrate Datadog APM tracing here:
 * - Add trace span for the entire /api/chat request
 * - Record custom metrics: request latency, conversationId, branchId
 * - Log structured events for each request/response
 */

export async function chatHandler(req: Request, res: Response): Promise<void> {
  // TODO: Start Datadog trace span for /api/chat

  try {
    const requestBody: ChatRequest = req.body;

    // Validate request - now we only need the current message, not full history
    if (!requestBody.messages || !Array.isArray(requestBody.messages) || requestBody.messages.length === 0) {
      res.status(400).json({ error: 'messages array is required and must not be empty' });
      return;
    }

    // Get userId from authenticated request
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.userId;

    // Generate conversationId if not provided
    const conversationId = requestBody.conversationId || uuidv4();
    const branchId = requestBody.branchId || 'main';

    // Get or create conversation and branch (with userId)
    await getOrCreateConversation(conversationId, userId);
    await getOrCreateBranch(conversationId, branchId);

    // Load conversation history from Firestore
    const historyMessages = await loadBranchMessages(conversationId, branchId);
    
    // Get the current user message (last message in request)
    const currentUserMessage = requestBody.messages[requestBody.messages.length - 1];
    
    // Combine history with current message
    const allMessages: Message[] = [...historyMessages, currentUserMessage];

    // Check if this is the first message in the conversation (for title generation)
    const isFirstMessage = historyMessages.length === 0 && branchId === 'main';
    
    // Save user message to Firestore
    const savedUserMessage = await saveMessage(conversationId, branchId, currentUserMessage, isFirstMessage);

    // TODO: Record custom metric: conversationId, branchId
    // TODO: Log structured event: chat request received

    // Call Gemini with full history
    const geminiResponse = await callGemini(allMessages);

    // Save assistant response to Firestore
    const assistantMessage: Message = {
      role: 'assistant',
      content: geminiResponse.content,
    };
    const savedAssistantMessage = await saveMessage(conversationId, branchId, assistantMessage);

    // Build response with message IDs from Firestore
    const response: ChatResponse = {
      conversationId,
      branchId,
      messages: [{
        id: savedAssistantMessage.id,
        role: 'assistant',
        content: savedAssistantMessage.content,
        timestamp: savedAssistantMessage.timestamp.toISOString(),
      }],
      userMessageId: savedUserMessage.id, // Include user message ID for frontend
    };

    // TODO: Log structured event: chat response sent
    // TODO: Record custom metric: response latency

    res.json(response);
  } catch (error) {
    // TODO: Log error to Datadog with error tracking
    console.error('Error in chat handler:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}


