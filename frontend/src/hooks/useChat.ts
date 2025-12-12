import { useState, useCallback } from 'react';
import { Message } from '../types/chat';
import { sendMessage } from '../api/chat';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId] = useState<string>('demo');
  const [branchId] = useState<string>('main');

  // TODO: Add branch selection logic when implementing branching feature

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Add user message immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Convert messages to API format (including the new user message)
        const apiMessages = [...messages, userMessage].map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }));

        // Call API
        const response = await sendMessage(apiMessages, conversationId, branchId);

        // Add assistant response
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.messages[0]?.content || 'No response received',
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        console.error('Error sending message:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, conversationId, branchId]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage: handleSendMessage,
  };
}


