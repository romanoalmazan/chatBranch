import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ChatWindow from './components/ChatWindow';
import BranchSidebar from './components/BranchSidebar';
import BranchPanel from './components/BranchPanel';
import ThreadCreationModal from './components/ThreadCreationModal';
import AuthModal from './components/AuthModal';
import ConversationList from './components/ConversationList';
import { useChat } from './hooks/useChat';
import { getBranches, Branch, setAuthTokenGetter } from './api/chat';
import { Message } from './types/chat';

function AppContent() {
  const { user, loading: authLoading, getAuthToken } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Set up auth token getter for API
  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!user) return null;
      try {
        const token = await getAuthToken();
        return token;
      } catch (err) {
        console.error('[App] Error getting auth token for API:', err);
        return null;
      }
    });
  }, [user, getAuthToken]);

  // Update auth token when user changes
  useEffect(() => {
    const updateToken = async () => {
      if (user) {
        try {
          const token = await getAuthToken();
          setAuthToken(token);
        } catch (err) {
          console.error('Failed to get auth token:', err);
          setAuthToken(null);
        }
      } else {
        setAuthToken(null);
      }
    };
    updateToken();
  }, [user, getAuthToken]);

  // Conversation and branch state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string>('main');

  // Branch panel state
  const [openBranchId, setOpenBranchId] = useState<string | null>(null);
  const [openBranch, setOpenBranch] = useState<Branch | null>(null);
  
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConversationListCollapsed, setIsConversationListCollapsed] = useState(false);

  // Thread creation modal state
  const [threadCreationMessage, setThreadCreationMessage] = useState<Message | null>(null);
  const [threadCreationPosition, setThreadCreationPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  // Track branches per message for thread indicators
  const [messageThreadCounts, setMessageThreadCounts] = useState<Record<string, number>>({});
  const [messageThreads, setMessageThreads] = useState<Record<string, Branch[]>>({});

  const {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    switchBranch,
    createBranchFromMessage,
  } = useChat(conversationId || '', branchId);

  // Load open branch data when openBranchId changes
  useEffect(() => {
    if (openBranchId && conversationId) {
      getBranches(conversationId)
        .then((branches) => {
          const branch = branches.find((b) => b.id === openBranchId);
          if (branch) {
            setOpenBranch(branch);
          } else {
            // Branch not found, clear it
            setOpenBranchId(null);
            setOpenBranch(null);
          }
        })
        .catch((err) => {
          // Handle 403/404 gracefully - conversation might not exist yet
          if (err instanceof Error && (err.message.includes('403') || err.message.includes('404') || err.message.includes('Forbidden') || err.message.includes('NOT_FOUND'))) {
            // Conversation doesn't exist yet (new conversation), that's fine
            setOpenBranchId(null);
            setOpenBranch(null);
          } else {
            console.error('Failed to load branch:', err);
            setOpenBranchId(null);
            setOpenBranch(null);
          }
        });
    } else {
      setOpenBranch(null);
    }
  }, [openBranchId, conversationId]);
  
  // Load branches and calculate thread counts per message, and store branches per message
  useEffect(() => {
    if (conversationId) {
      getBranches(conversationId)
        .then((branches) => {
          const counts: Record<string, number> = {};
          const threads: Record<string, Branch[]> = {};
          branches.forEach((branch) => {
            if (branch.parentMessageId) {
              counts[branch.parentMessageId] = (counts[branch.parentMessageId] || 0) + 1;
              if (!threads[branch.parentMessageId]) {
                threads[branch.parentMessageId] = [];
              }
              threads[branch.parentMessageId].push(branch);
            }
          });
          setMessageThreadCounts(counts);
          setMessageThreads(threads);
        })
        .catch((err) => {
          // Handle 403/404 gracefully - conversation might not exist yet (new conversation)
          if (err instanceof Error && (err.message.includes('403') || err.message.includes('404') || err.message.includes('Forbidden') || err.message.includes('NOT_FOUND'))) {
            // Conversation doesn't exist yet, that's fine - just clear thread counts
            setMessageThreadCounts({});
            setMessageThreads({});
          } else {
            console.error('Failed to load branches for thread counts:', err);
          }
        });
    } else {
      // Clear thread counts when no conversation
      setMessageThreadCounts({});
      setMessageThreads({});
    }
  }, [conversationId, openBranchId]); // Use openBranchId instead of messages to avoid infinite loop

  const handleSwitchBranch = useCallback(
    (newBranchId: string) => {
      setBranchId(newBranchId);
      switchBranch(newBranchId);
    },
    [switchBranch]
  );

  const handleOpenBranch = useCallback(
    (branchId: string) => {
      setOpenBranchId(branchId);
    },
    []
  );

  const handleOpenThread = useCallback(
    async (messageId: string, branchId?: string) => {
      // If branchId is provided, open it directly
      if (branchId) {
        setOpenBranchId(branchId);
        return;
      }
      
      // Otherwise, find the first branch that was created from this message
      try {
        const branches = await getBranches(conversationId);
        const branch = branches.find((b) => b.parentMessageId === messageId);
        if (branch) {
          setOpenBranchId(branch.id);
        }
      } catch (err) {
        console.error('Failed to find thread:', err);
      }
    },
    [conversationId]
  );

  const handleCloseBranchPanel = useCallback(() => {
    setOpenBranchId(null);
    setOpenBranch(null);
  }, []);

  const handleRequestThreadCreation = useCallback(
    (message: Message, position: { x: number; y: number }) => {
      console.log('Opening thread creation modal for message:', message.id, 'at position:', position);
      setThreadCreationMessage(message);
      setThreadCreationPosition(position);
    },
    []
  );

  const handleCreateThread = useCallback(
    async (threadName: string) => {
      if (!threadCreationMessage) return;

      try {
        setIsCreatingThread(true);
        const newBranch = await createBranchFromMessage(
          threadCreationMessage.id,
          threadName || undefined
        );
        
        // Close modal and open branch panel (this will replace any currently open thread)
        setThreadCreationMessage(null);
        setThreadCreationPosition(null);
        setOpenBranchId(newBranch.id);
        
        // Refresh thread counts and list by triggering a reload
        // The useEffect that depends on openBranchId will handle this
      } catch (err) {
        console.error('Failed to create thread:', err);
      } finally {
        setIsCreatingThread(false);
      }
    },
    [threadCreationMessage, createBranchFromMessage]
  );

  const handleCloseThreadModal = useCallback(() => {
    if (!isCreatingThread) {
      setThreadCreationMessage(null);
      setThreadCreationPosition(null);
    }
  }, [isCreatingThread]);

  const handleNewChat = useCallback(() => {
    // Create a new conversation
    const newConversationId = uuidv4();
    setConversationId(newConversationId);
    setBranchId('main');
    setOpenBranchId(null);
    setOpenBranch(null);
  }, []);

  const handleSelectConversation = useCallback((newConversationId: string) => {
    setConversationId(newConversationId);
    setBranchId('main');
    setOpenBranchId(null);
    setOpenBranch(null);
  }, []);

  // Create new conversation if none selected (only after auth token is ready)
  // MUST be before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    if (user && authToken && !conversationId) {
      console.log('[App] Creating new conversation for authenticated user');
      const newConversationId = uuidv4();
      setConversationId(newConversationId);
      setBranchId('main');
      setOpenBranchId(null);
      setOpenBranch(null);
    }
  }, [user, authToken, conversationId]);

  // Show auth modal if not authenticated
  // All hooks must be called before conditional returns
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  // Show loading state while waiting for auth token
  if (user && !authToken) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Initializing session...</div>
      </div>
    );
  }

  return (
    <Layout onNewChat={handleNewChat}>
      <div className="flex h-full relative overflow-hidden">
        {/* Conversation List Sidebar */}
        <ConversationList
          currentConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewChat}
          authToken={authToken}
          isCollapsed={isConversationListCollapsed}
          onToggleCollapse={() => setIsConversationListCollapsed(!isConversationListCollapsed)}
        />
        
        {/* Branch Sidebar */}
        {conversationId && (
          <BranchSidebar
            conversationId={conversationId}
            currentBranchId={branchId}
            onSwitchBranch={handleSwitchBranch}
            onOpenBranch={handleOpenBranch}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}
        
        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${openBranchId ? 'mr-[400px]' : ''}`}>
          {conversationId ? (
            <ChatWindow
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
              isLoadingHistory={isLoadingHistory}
              error={error}
              onCreateThread={handleRequestThreadCreation}
              messageThreadCounts={messageThreadCounts}
              messageThreads={messageThreads}
              onOpenThread={handleOpenThread}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a conversation or create a new one
            </div>
          )}
        </div>
        
        {/* Branch Panel - Fixed on right side */}
        {openBranchId && openBranch && conversationId && (
          <div className="fixed right-0 top-0 bottom-0 z-40 branch-panel-enter" style={{ width: '400px', height: '100vh' }}>
            <BranchPanel
              conversationId={conversationId}
              branch={openBranch}
              onClose={handleCloseBranchPanel}
            />
          </div>
        )}

        {/* Thread Creation Modal */}
        {threadCreationMessage && threadCreationPosition && (
          <ThreadCreationModal
            message={threadCreationMessage}
            position={threadCreationPosition}
            onClose={handleCloseThreadModal}
            onCreate={handleCreateThread}
            isCreating={isCreatingThread}
          />
        )}
      </div>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;


