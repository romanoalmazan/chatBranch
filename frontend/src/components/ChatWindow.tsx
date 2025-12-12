import React from 'react';
import { Message } from '../types/chat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  isLoadingHistory?: boolean;
  error: string | null;
  onBranch?: (messageId: string) => void;
  isCreatingBranch?: boolean;
}

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  isLoadingHistory,
  error,
  onBranch,
  isCreatingBranch,
}: ChatWindowProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Error banner */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 flex-shrink-0">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Loading history indicator */}
      {isLoadingHistory && (
        <div className="px-4 py-2 bg-blue-100 text-blue-700 text-sm flex-shrink-0">
          Loading conversation history...
        </div>
      )}

      {/* Messages area - scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <MessageList
          messages={messages}
          onBranch={onBranch}
          isCreatingBranch={isCreatingBranch}
        />
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm flex-shrink-0">
          AI is thinking...
        </div>
      )}

      {/* Input area - always visible at bottom */}
      <div className="flex-shrink-0 border-t-2 border-gray-300 bg-white shadow-lg">
        <MessageInput onSend={onSendMessage} disabled={isLoading || isLoadingHistory} />
      </div>
    </div>
  );
}


