import React from 'react';
import { Message as MessageType } from '../types/chat';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-[80%] md:max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
        {/* TODO: Add "Branch from here" button next to assistant messages */}
        {!isUser && (
          <button
            className="text-xs text-blue-600 hover:text-blue-800 mt-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
            disabled
            title="Branch from here (coming soon)"
          >
            Branch from here
          </button>
        )}
      </div>
    </div>
  );
}

