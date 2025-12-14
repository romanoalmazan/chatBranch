import ChatWindow from './ChatWindow';
import { useChat } from '../hooks/useChat';
import { Branch } from '../api/chat';

interface BranchPanelProps {
  conversationId: string;
  branch: Branch;
  onClose: () => void;
}

export default function BranchPanel({
  conversationId,
  branch,
  onClose,
}: BranchPanelProps) {
  const {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
  } = useChat(conversationId, branch.id);

  const getBranchDisplayName = () => {
    if (branch.id === 'main') {
      return 'Main Branch';
    }
    
    // Extract thread name from branch ID
    // Format: thread-{timestamp}-{name} or just the name if it doesn't match the pattern
    const match = branch.id.match(/^thread-\d+-(.+)$/);
    if (match) {
      // Extract the name part and replace dashes with spaces, capitalize words
      const name = match[1].replace(/-/g, ' ');
      return name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    // If it doesn't match the pattern, return as is (truncated if too long)
    return branch.id.length > 30 ? `${branch.id.substring(0, 30)}...` : branch.id;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-[400px] flex-shrink-0 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {getBranchDisplayName()}
            </h2>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Started {formatDate(branch.createdAt)}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
          title="Close thread"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Chat Window */}
      <div className="flex-1 min-h-0">
        <ChatWindow
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          isLoadingHistory={isLoadingHistory}
          error={error}
        />
      </div>
    </div>
  );
}

