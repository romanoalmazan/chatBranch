import React from 'react';
import { Message } from '../types/chat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  error,
}: ChatWindowProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Error banner */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm">
          AI is thinking...
        </div>
      )}

      {/* Input area */}
      <MessageInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}


