import { VertexAI } from '@google-cloud/vertexai';
import { config } from '../config';
import { Message } from '../types/chat';

/**
 * Service for interacting with Google Cloud Vertex AI Gemini models.
 * 
 * TODO: Integrate Datadog LLM Observability here:
 * - Track token usage (input/output tokens)
 * - Record latency metrics
 * - Log prompts and responses (with PII redaction if needed)
 * - Add trace spans for LLM calls
 */

export interface GeminiResponse {
  content: string;
  // TODO: Add token usage, model metadata, etc. when integrating Datadog
}

export async function callGemini(messages: Message[]): Promise<GeminiResponse> {
  // TODO: Add Datadog trace span start here

  try {
    console.log(`[Gemini] Initializing with project: ${config.gcp.projectId}, location: ${config.gcp.location}, model: ${config.gcp.modelName}`);
    
    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: config.gcp.projectId,
      location: config.gcp.location,
    });

    // Get the generative model
    const model = vertexAI.getGenerativeModel({
      model: config.gcp.modelName,
    });

    // Convert messages to Gemini format
    // For chat, we need to separate history from the current message
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const currentMessage = messages[messages.length - 1];

    console.log(`[Gemini] Sending message with ${history.length} history messages`);

    // Start a chat session with history (or empty if no history)
    const chat = model.startChat({
      history: history.length > 0 ? history : undefined,
    });

    // Send the current message
    const result = await chat.sendMessage(currentMessage.content);
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!responseText) {
      throw new Error('No response text received from Gemini');
    }

    console.log(`[Gemini] Successfully received response (${responseText.length} chars)`);

    // TODO: Extract and log token usage from result.response.usageMetadata
    // TODO: Record Datadog metrics for latency and token counts
    // TODO: Add Datadog trace span end here

    return {
      content: responseText,
    };
  } catch (error) {
    // TODO: Log error to Datadog with proper error tracking
    console.error('Error calling Gemini:', error);
    throw new Error(`Failed to call Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

