import { useEffect, useRef } from 'react';
import { Message } from '../types/chat';
import { Branch } from '../api/chat';
import MessageComponent from './Message';

interface MessageListProps {
  messages: Message[];
  onCreateThread?: (message: Message, position: { x: number; y: number }) => void;
  messageThreadCounts?: Record<string, number>;
  messageThreads?: Record<string, Branch[]>;
  onOpenThread?: (messageId: string, branchId?: string) => void;
}

export default function MessageList({ messages, onCreateThread, messageThreadCounts = {}, messageThreads = {}, onOpenThread }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // Auto-scroll to bottom only when new messages are added and user is near bottom
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      // Find the scrollable container (parent with overflow-y-auto)
      const container = messagesEndRef.current?.closest('[class*="overflow-y-auto"]') as HTMLElement;
      
      if (container && messagesEndRef.current) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
        
        // Only auto-scroll if user is near the bottom (within 300px) or it's the first message
        if (isNearBottom || prevMessagesLengthRef.current === 0) {
          setTimeout(() => {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            });
          }, 100);
        }
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

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
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {messages.map((message) => (
          <MessageComponent
            key={message.id}
            message={message}
            onCreateThread={onCreateThread}
            threadCount={messageThreadCounts[message.id] || 0}
            threads={messageThreads[message.id] || []}
            onOpenThread={onOpenThread}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}


