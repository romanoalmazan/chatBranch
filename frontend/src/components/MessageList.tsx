import React, { useEffect, useRef } from 'react';
import { Message } from '../types/chat';
import MessageComponent from './Message';

interface MessageListProps {
  messages: Message[];
  onBranch?: (messageId: string) => void;
  isCreatingBranch?: boolean;
}

export default function MessageList({ messages, onBranch, isCreatingBranch }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
        <div className="text-center max-w-lg">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-2xl shadow-lg mb-4">
              AI
            </div>
          </div>
          <h2 className="text-3xl font-light text-gray-700 mb-3">How can I help you today?</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Start a conversation or create branches from any response to explore different paths.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {messages.map((message) => (
          <MessageComponent
            key={message.id}
            message={message}
            onBranch={onBranch}
            isCreatingBranch={isCreatingBranch}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}


