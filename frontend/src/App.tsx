import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Layout from './components/Layout';
import ChatWindow from './components/ChatWindow';
import BranchSidebar from './components/BranchSidebar';
import { useChat } from './hooks/useChat';

const CONVERSATION_ID_KEY = 'chatbranch_conversation_id';
const BRANCH_ID_KEY = 'chatbranch_branch_id';

function App() {
  // Load conversation and branch IDs from localStorage or create new ones
  const [conversationId, setConversationId] = useState<string>(() => {
    const stored = localStorage.getItem(CONVERSATION_ID_KEY);
    return stored || uuidv4();
  });

  const [branchId, setBranchId] = useState<string>(() => {
    const stored = localStorage.getItem(BRANCH_ID_KEY);
    return stored || 'main';
  });

  // Save to localStorage when IDs change
  useEffect(() => {
    localStorage.setItem(CONVERSATION_ID_KEY, conversationId);
  }, [conversationId]);

  useEffect(() => {
    localStorage.setItem(BRANCH_ID_KEY, branchId);
  }, [branchId]);

  const {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    switchBranch,
    createBranchFromMessage,
  } = useChat(conversationId, branchId);

  const handleSwitchBranch = useCallback(
    (newBranchId: string) => {
      setBranchId(newBranchId);
      switchBranch(newBranchId);
    },
    [switchBranch]
  );

  const handleCreateBranch = useCallback(
    async (messageId: string) => {
      try {
        const newBranch = await createBranchFromMessage(messageId);
        setBranchId(newBranch.id);
      } catch (err) {
        console.error('Failed to create branch:', err);
      }
    },
    [createBranchFromMessage]
  );

  const handleNewChat = useCallback(() => {
    // Create a new conversation
    const newConversationId = uuidv4();
    setConversationId(newConversationId);
    setBranchId('main');
    // Clear localStorage will happen automatically via useEffect
  }, []);

  return (
    <Layout onNewChat={handleNewChat}>
      <div className="flex h-full">
        <BranchSidebar
          conversationId={conversationId}
          currentBranchId={branchId}
          onSwitchBranch={handleSwitchBranch}
        />
        <div className="flex-1 flex flex-col min-h-0">
          <ChatWindow
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            isLoadingHistory={isLoadingHistory}
            error={error}
            onBranch={handleCreateBranch}
            isCreatingBranch={isLoading}
          />
        </div>
      </div>
    </Layout>
  );
}

export default App;


