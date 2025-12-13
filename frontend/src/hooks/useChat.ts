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
      // Add user message optimistically (immediately)
      const tempUserMessage: Message = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMessage]);
      setIsLoading(true);
      setError(null);

      // Add a temporary assistant message for streaming effect
      const tempAssistantId = `temp-assistant-${Date.now()}`;
      const tempAssistantMessage: Message = {
        id: tempAssistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempAssistantMessage]);

      try {
        // Only send the current message - backend will load history
        const apiMessages = [{
          role: 'user' as const,
          content,
        }];

        // Call API
        const response = await sendMessage(apiMessages, conversationId, currentBranchId);
        const assistantContent = response.messages[0]?.content || '';

        // Simulate typing effect - reveal text gradually
        if (assistantContent) {
          const chars = assistantContent.split('');
          let currentText = '';
          
          for (let i = 0; i < chars.length; i++) {
            currentText += chars[i];
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAssistantId
                  ? { ...msg, content: currentText }
                  : msg
              )
            );
            // Variable delay for smoother effect (faster for spaces, slower for punctuation)
            const delay = chars[i] === ' ' ? 10 : chars[i].match(/[.,!?;:]/) ? 50 : 15;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        // Small delay before replacing with real message
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Reload conversation to get all messages with correct Firestore IDs
        const loadedMessages = await loadConversation(conversationId, currentBranchId);
        setMessages(loadedMessages);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        console.error('Error sending message:', err);
        // Remove the optimistic messages on error
        setMessages((prev) => prev.filter((msg) => 
          msg.id !== tempUserMessage.id && msg.id !== tempAssistantId
        ));
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


