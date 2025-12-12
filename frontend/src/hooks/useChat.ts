import { useState, useCallback, useEffect } from 'react';
import { Message } from '../types/chat';
import { sendMessage, loadConversation, createBranch } from '../api/chat';

export function useChat(conversationId: string, branchId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBranchId, setCurrentBranchId] = useState<string>(branchId);

  // Load conversation history on mount or when IDs change
  useEffect(() => {
    if (conversationId && currentBranchId) {
      setIsLoadingHistory(true);
      setError(null); // Clear any previous errors
      loadConversation(conversationId, currentBranchId)
        .then((loadedMessages) => {
          setMessages(loadedMessages);
          setIsLoadingHistory(false);
        })
        .catch((err) => {
          console.error('Failed to load conversation:', err);
          // If it's a 404 or NOT_FOUND, that's fine - just means no messages yet
          if (err instanceof Error && (err.message.includes('404') || err.message.includes('NOT_FOUND'))) {
            setMessages([]);
          } else {
            // Only set error for real errors, not "not found"
            setError(err instanceof Error ? err.message : 'Failed to load conversation');
          }
          setIsLoadingHistory(false);
        });
    }
  }, [conversationId, currentBranchId]);

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
        // Only send the current message - backend will load history
        const apiMessages = [{
          role: 'user' as const,
          content,
        }];

        // Call API
        const response = await sendMessage(apiMessages, conversationId, currentBranchId);

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
        // Remove the user message on error
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, currentBranchId]
  );

  const switchBranch = useCallback((newBranchId: string) => {
    setCurrentBranchId(newBranchId);
    // Messages will be reloaded by the useEffect
  }, []);

  const handleCreateBranch = useCallback(
    async (parentMessageId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Create new branch
        const newBranch = await createBranch(
          conversationId,
          currentBranchId,
          parentMessageId
        );

        // Automatically switch to new branch
        setCurrentBranchId(newBranch.id);
        // Messages will be reloaded by the useEffect

        return newBranch;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create branch';
        setError(errorMessage);
        console.error('Error creating branch:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, currentBranchId]
  );

  return {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage: handleSendMessage,
    branchId: currentBranchId,
    switchBranch,
    createBranchFromMessage: handleCreateBranch,
  };
}


