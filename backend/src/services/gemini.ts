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

/**
 * Generate a short title for a conversation based on the first user message
 */
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    console.log(`[Gemini] Generating title for conversation from message: ${firstMessage.substring(0, 50)}...`);
    
    const vertexAI = new VertexAI({
      project: config.gcp.projectId,
      location: config.gcp.location,
    });

    const model = vertexAI.getGenerativeModel({
      model: config.gcp.modelName,
    });

    const prompt = `Generate a short, descriptive title (maximum 6 words) for a conversation that starts with this message: "${firstMessage}"

Return only the title, nothing else. Make it concise and descriptive.`;

    const result = await model.generateContent(prompt);
    const title = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'New Conversation';

    // Clean up the title - remove quotes if present, limit length
    let cleanTitle = title.replace(/^["']|["']$/g, '').trim();
    if (cleanTitle.length > 60) {
      cleanTitle = cleanTitle.substring(0, 57) + '...';
    }

    console.log(`[Gemini] Generated title: ${cleanTitle}`);
    return cleanTitle || 'New Conversation';
  } catch (error) {
    console.error('Error generating conversation title:', error);
    // Fallback: use first 50 chars of message or "New Conversation"
    const fallback = firstMessage.length > 50 
      ? firstMessage.substring(0, 47) + '...' 
      : firstMessage;
    return fallback || 'New Conversation';
  }
}

