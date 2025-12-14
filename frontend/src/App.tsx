import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Layout from './components/Layout';
import ChatWindow from './components/ChatWindow';
import BranchSidebar from './components/BranchSidebar';
import BranchPanel from './components/BranchPanel';
import ThreadCreationModal from './components/ThreadCreationModal';
import { useChat } from './hooks/useChat';
import { getBranches, Branch } from './api/chat';
import { Message } from './types/chat';

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

  // Branch panel state
  const [openBranchId, setOpenBranchId] = useState<string | null>(null);
  const [openBranch, setOpenBranch] = useState<Branch | null>(null);
  
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Thread creation modal state
  const [threadCreationMessage, setThreadCreationMessage] = useState<Message | null>(null);
  const [threadCreationPosition, setThreadCreationPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  // Track branches per message for thread indicators
  const [messageThreadCounts, setMessageThreadCounts] = useState<Record<string, number>>({});

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
          console.error('Failed to load branch:', err);
          setOpenBranchId(null);
          setOpenBranch(null);
        });
    } else {
      setOpenBranch(null);
    }
  }, [openBranchId, conversationId]);

  // Load branches and calculate thread counts per message, and store branches per message
  const [messageThreads, setMessageThreads] = useState<Record<string, Branch[]>>({});
  
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
          console.error('Failed to load branches for thread counts:', err);
        });
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
    // Clear localStorage will happen automatically via useEffect
  }, []);

  return (
    <Layout onNewChat={handleNewChat}>
      <div className="flex h-full relative overflow-hidden">
        <BranchSidebar
          conversationId={conversationId}
          currentBranchId={branchId}
          onSwitchBranch={handleSwitchBranch}
          onOpenBranch={handleOpenBranch}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${openBranchId ? 'mr-[400px]' : ''}`}>
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
        </div>
        
        {/* Branch Panel - Fixed on right side */}
        {openBranchId && openBranch && (
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

export default App;


