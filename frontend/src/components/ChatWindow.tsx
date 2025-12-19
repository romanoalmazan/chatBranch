import { Message } from '../types/chat';
import { Branch } from '../api/chat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useAuth } from '../contexts/AuthContext';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  isLoadingHistory?: boolean;
  error: string | null;
  onCreateThread?: (message: Message, position: { x: number; y: number }) => void;
  messageThreadCounts?: Record<string, number>;
  messageThreads?: Record<string, Branch[]>;
  onOpenThread?: (messageId: string, branchId?: string) => void;
}

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  isLoadingHistory,
  error,
  onCreateThread,
  messageThreadCounts = {},
  messageThreads = {},
  onOpenThread,
}: ChatWindowProps) {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-gray-950 overflow-hidden relative transition-colors duration-300">
      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 shadow-sm z-10 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading history indicator */}
      {isLoadingHistory && (
        <div className="px-6 py-2 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest flex-shrink-0 border-b border-blue-100 dark:border-blue-900/20 z-10 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
          Synchronizing History
        </div>
      )}

      {/* Messages area - scrollable */}
      <div id="messages-container" className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden relative scroll-smooth">
        {messages.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-2xl w-full animate-fade-in-up">
              <div className="mb-10 relative inline-block">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-blue-500/40 rotate-3 hover:rotate-0 transition-transform duration-500">
                  B
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg animate-bounce">
                  ✨
                </div>
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                Hi, <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">{firstName}</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-medium mb-12 leading-relaxed">
                Where should we take the conversation today?
              </p>
              <div className="w-full max-w-xl mx-auto transform hover:scale-[1.02] transition-transform duration-300">
                <MessageInput 
                  onSend={onSendMessage} 
                  disabled={isLoading || isLoadingHistory} 
                  variant="centered"
                />
              </div>
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            onCreateThread={onCreateThread}
            messageThreadCounts={messageThreadCounts}
            messageThreads={messageThreads}
            onOpenThread={onOpenThread}
          />
        )}
      </div>

      {/* Input area - always visible at bottom when there are messages */}
      {messages.length > 0 && (
        <div className="flex-shrink-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 transition-all duration-300 pb-safe">
          <MessageInput onSend={onSendMessage} disabled={isLoading || isLoadingHistory} />
        </div>
      )}
    </div>
  );
}


