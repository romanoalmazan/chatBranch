import { Message } from '../types/chat';
import { Branch } from '../api/chat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  isLoadingHistory?: boolean;
  error: string | null;
  onCreateThread?: (message: Message, position: { x: number; y: number }) => void;
  messageThreadCounts?: Record<string, number>;
  messageThreads?: Record<string, Branch[]>;
  onOpenThread?: (messageId: string, branchId?: string) => void;
}

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  isLoadingHistory,
  error,
  onCreateThread,
  messageThreadCounts = {},
  messageThreads = {},
  onOpenThread,
}: ChatWindowProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50 overflow-hidden">
      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 p-3 flex-shrink-0">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading history indicator */}
      {isLoadingHistory && (
        <div className="px-4 py-2 bg-blue-50 text-blue-700 text-sm flex-shrink-0 border-b border-blue-100">
          Loading conversation history...
        </div>
      )}

      {/* Messages area - scrollable */}
      <div id="messages-container" className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden">
        <MessageList
          messages={messages}
          onCreateThread={onCreateThread}
          messageThreadCounts={messageThreadCounts}
          messageThreads={messageThreads}
          onOpenThread={onOpenThread}
        />
      </div>

      {/* Input area - always visible at bottom */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        <MessageInput onSend={onSendMessage} disabled={isLoading || isLoadingHistory} />
      </div>
    </div>
  );
}


