import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Message as MessageType } from '../types/chat';

interface MessageProps {
  message: MessageType;
  onBranch?: (messageId: string) => void;
  isCreatingBranch?: boolean;
}

export default function Message({ message, onBranch, isCreatingBranch = false }: MessageProps) {
  const isUser = message.role === 'user';

  const handleBranch = () => {
    if (onBranch && message.id) {
      onBranch(message.id);
    }
  };

  // Check if message is being typed (empty or ends with cursor)
  const isTyping = !isUser && message.content === '';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className={`flex items-start gap-3 max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar placeholder */}
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            AI
          </div>
        )}
        
        <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
          <div
            className={`rounded-2xl px-4 py-3 shadow-sm transition-all ${
              isUser
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ml-auto max-w-[85%]'
                : 'bg-white border border-gray-200 text-gray-900 max-w-full'
            }`}
          >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          ) : isTyping ? (
            <div className="flex items-center gap-1 text-gray-400">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none break-words leading-relaxed [&_.katex]:text-base [&_.katex-display]:my-4">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  // Style markdown elements
                  p: ({ children }) => <p className="mb-2 last:mb-0 [&_.katex]:inline-block">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ inline, children, className, ...props }: any) => {
                    if (inline) {
                      return (
                        <code className="bg-gray-300 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }: any) => {
                    return (
                      <pre className="bg-gray-300 p-3 rounded text-sm font-mono overflow-x-auto mb-2 whitespace-pre-wrap">
                        {children}
                      </pre>
                    );
                  },
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="ml-2">{children}</li>,
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-400 pl-4 italic my-2">{children}</blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          </div>
          
          {/* Branch button - more subtle */}
          {!isUser && onBranch && (
            <button
              onClick={handleBranch}
              disabled={isCreatingBranch}
              className="text-xs text-gray-500 hover:text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1"
              title="Create a new branch from this message"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {isCreatingBranch ? 'Creating branch...' : 'Branch from here'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

