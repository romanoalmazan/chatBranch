
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  onNewChat?: () => void;
}

export default function Layout({ children, onNewChat }: LayoutProps) {
  return (
    <div className="flex h-full w-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 w-full">
        {/* Header */}
        <header className="bg-gray-800 text-white px-6 py-4 shadow-md flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl font-semibold">BranchMind – LLM Chat (MVP)</h1>
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              title="Start a new conversation"
            >
              + New Chat
            </button>
          )}
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}


