import { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Message as MessageType } from '../types/chat';
import { Branch } from '../api/chat';

interface MessageProps {
  message: MessageType;
  onCreateThread?: (message: MessageType, position: { x: number; y: number }) => void;
  isCreatingBranch?: boolean;
  threadCount?: number;
  threads?: Branch[];
  onOpenThread?: (messageId: string, branchId?: string) => void;
}

export default function Message({ message, onCreateThread, isCreatingBranch = false, threadCount = 0, threads = [], onOpenThread }: MessageProps) {
  const isUser = message.role === 'user';
  const messageRef = useRef<HTMLDivElement>(null);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Extract thread name from branch ID
  // Format: thread-{timestamp}-{name} or just the name if it doesn't match the pattern
  const getThreadDisplayName = (branchId: string): string => {
    if (branchId === 'main') {
      return 'Main Branch';
    }
    
    // Check if it matches the pattern: thread-{timestamp}-{name}
    const match = branchId.match(/^thread-\d+-(.+)$/);
    if (match) {
      // Extract the name part and replace dashes with spaces, capitalize words
      const name = match[1].replace(/-/g, ' ');
      return name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    // If it doesn't match the pattern, return as is (truncated if too long)
    return branchId.length > 30 ? `${branchId.substring(0, 30)}...` : branchId;
  };

  const handleCreateThread = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreateThread && message.id && messageRef.current) {
      const rect = messageRef.current.getBoundingClientRect();
      onCreateThread(message, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height,
      });
    }
  };

  // Add click outside listener
  useEffect(() => {
    if (!showThreadMenu) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThreadMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showThreadMenu]);

  // Check if message is being typed (empty or ends with cursor)
  const isTyping = !isUser && message.content === '';
  
  return (
    <div ref={messageRef} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
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
          
          {/* Thread button and indicator - Discord style */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-2 relative">
              {threadCount > 0 && onOpenThread && (
                <div className="relative" ref={menuRef}>
                  {threadCount === 1 && threads.length === 1 ? (
                    // Single thread - open directly
                    <button
                      onClick={() => onOpenThread(message.id, threads[0].id)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-blue-50 transition-all"
                      title="Open thread"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-medium">1 thread</span>
                    </button>
                  ) : (
                    // Multiple threads - show dropdown
                    <>
                      <button
                        onClick={() => setShowThreadMenu(!showThreadMenu)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-blue-50 transition-all"
                        title={`${threadCount} threads - Click to view`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="font-medium">{threadCount} threads</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showThreadMenu && (
                        <div className="absolute left-0 bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                          <div className="py-1">
                            {threads.map((thread) => (
                              <button
                                key={thread.id}
                                onClick={() => {
                                  onOpenThread(message.id, thread.id);
                                  setShowThreadMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <div className="font-medium truncate">
                                  {getThreadDisplayName(thread.id)}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {new Date(thread.createdAt).toLocaleDateString()}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {onCreateThread && (
                <button
                  onClick={handleCreateThread}
                  disabled={isCreatingBranch}
                  className={`text-xs text-gray-500 hover:text-blue-600 transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 ${threadCount > 0 ? '' : 'opacity-0 group-hover:opacity-100'}`}
                  title="Create a thread from this message"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {isCreatingBranch ? 'Creating thread...' : 'Create thread'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

