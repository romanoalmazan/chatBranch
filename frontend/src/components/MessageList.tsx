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
      <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to BranchMind</h2>
          <p className="text-gray-600 mb-4">
            Start a conversation by typing a message in the input box below.
          </p>
          <p className="text-sm text-gray-500">
            You can create conversation branches from any assistant response to explore different conversation paths.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
  );
}


