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
    return null;
  }

  return (
    <div className="flex-1 w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-2">
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
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}
