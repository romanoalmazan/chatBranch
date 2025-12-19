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

  // Pre-process markdown to fix common AI formatting issues
  const preprocessMarkdown = (text: string): string => {
    if (!text) return '';
    
    // Fix case where AI puts a colon then immediately a list on the same line
    // e.g., "Step 1: * item" -> "Step 1:\n* item"
    let processed = text.replace(/([:?!])\s+(\*|\d+\.)/g, '$1\n$2');
    
    // Fix case where AI leaves an empty numbered list item before a heading/title
    // e.g., "1.\n\nCheck Your Passport" -> "1. **Check Your Passport**"
    processed = processed.replace(/^(\d+\.)\s*\n+\s*([^#\n*]+)/gm, '$1 **$2**');
    
    return processed;
  };
  
  return (
    <div ref={messageRef} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-8 group animate-fade-in`}>
      <div className={`flex items-start gap-4 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar placeholder */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform group-hover:scale-105 ${
          isUser 
            ? 'bg-blue-600 shadow-blue-500/20' 
            : 'bg-gradient-to-br from-purple-500 to-blue-600 shadow-purple-500/20'
        }`}>
          {isUser ? 'R' : 'AI'}
        </div>
        
        <div className={`flex-1 min-w-0 ${isUser ? 'flex justify-end' : ''}`}>
          <div
            className={`transition-all duration-200 ${
              isUser
                ? 'bg-blue-600 text-white rounded-2xl px-5 py-3 shadow-md max-w-[85%]'
                : 'bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 text-gray-900 dark:text-gray-100 rounded-2xl px-6 py-4 shadow-sm w-full'
            }`}
          >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">{message.content}</p>
          ) : isTyping ? (
            <div className="flex items-center gap-1.5 py-2">
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          ) : (
            <div className="prose prose-base dark:prose-invert max-w-none break-words leading-relaxed 
              prose-p:mb-4 prose-p:last:mb-0 
              prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
              prose-li:my-1 prose-ul:my-4 prose-ol:my-4
              prose-strong:text-blue-600 dark:prose-strong:text-blue-400
              prose-code:bg-gray-100 dark:prose-code:bg-gray-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-900 dark:prose-pre:bg-black prose-pre:border prose-pre:border-gray-800 prose-pre:p-4 prose-pre:rounded-xl
              [&_.katex]:text-[1.1em] [&_.katex-display]:my-6">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {preprocessMarkdown(message.content)}
              </ReactMarkdown>
            </div>
          )}
          </div>
          
          {/* Thread button and indicator */}
          {!isUser && (
            <div className="flex items-center gap-3 mt-3 px-2">
              {threadCount > 0 && onOpenThread && (
                <div className="relative" ref={menuRef}>
                  {threadCount === 1 && threads.length === 1 ? (
                    <button
                      onClick={() => onOpenThread(message.id, threads[0].id)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1.5 py-1 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 transition-all border border-blue-100 dark:border-blue-800/50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      1 Thread
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowThreadMenu(!showThreadMenu)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1.5 py-1 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 transition-all border border-blue-100 dark:border-blue-800/50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {threadCount} Threads
                        <svg className={`w-3 h-3 transition-transform ${showThreadMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showThreadMenu && (
                        <div className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 min-w-[220px] py-2 animate-fade-in">
                          {threads.map((thread) => (
                            <button
                              key={thread.id}
                              onClick={() => {
                                onOpenThread(message.id, thread.id);
                                setShowThreadMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                            >
                              <div className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                {getThreadDisplayName(thread.id)}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider font-medium">
                                {new Date(thread.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </div>
                            </button>
                          ))}
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
                  className={`text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${threadCount > 0 ? '' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {isCreatingBranch ? 'Branching...' : 'Branch Out'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
