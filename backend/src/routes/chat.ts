import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ChatRequest, ChatResponse, Message } from '../types/chat';
import { callGemini } from '../services/gemini';

/**
 * Chat endpoint
 * POST /api/chat
 * 
 * TODO: Integrate Datadog APM tracing here:
 * - Add trace span for the entire /api/chat request
 * - Record custom metrics: request latency, conversationId, branchId
 * - Log structured events for each request/response
 * 
 * TODO: Integrate Firestore persistence:
 * - Load conversation + branch messages from Firestore instead of request body
 * - Save new messages (user + assistant) to Firestore after generation
 * - Handle conversationId and branchId properly with Firestore queries
 */

export async function chatHandler(req: Request, res: Response): Promise<void> {
  // TODO: Start Datadog trace span for /api/chat

  try {
    const requestBody: ChatRequest = req.body;

    // Validate request
    if (!requestBody.messages || !Array.isArray(requestBody.messages) || requestBody.messages.length === 0) {
      res.status(400).json({ error: 'messages array is required and must not be empty' });
      return;
    }

    // Generate conversationId if not provided
    const conversationId = requestBody.conversationId || uuidv4();
    const branchId = requestBody.branchId || 'main';

    // TODO: Load conversation history from Firestore if conversationId exists
    // For now, we use the messages from the request

    // TODO: Record custom metric: conversationId, branchId
    // TODO: Log structured event: chat request received

    // Call Gemini
    const messages: Message[] = requestBody.messages;
    const geminiResponse = await callGemini(messages);

    // Build response
    const response: ChatResponse = {
      conversationId,
      branchId,
      messages: [
        {
          role: 'assistant',
          content: geminiResponse.content,
        },
      ],
    };

    // TODO: Save user message and assistant response to Firestore
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


