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
    <div className="flex flex-col h-full min-h-0 bg-gray-50">
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
      <div className="flex-1 overflow-y-auto min-h-0">
        <MessageList
          messages={messages}
          onBranch={onBranch}
          isCreatingBranch={isCreatingBranch}
        />
      </div>

      {/* Input area - always visible at bottom */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        <MessageInput onSend={onSendMessage} disabled={isLoading || isLoadingHistory} />
      </div>
    </div>
  );
}


