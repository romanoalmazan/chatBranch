import { ReactNode, useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  onNewChat?: () => void;
}

export default function Layout({ children, onNewChat }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 w-full">
        {/* Header */}
        <header className="bg-gray-800 text-white px-6 py-4 shadow-md flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl font-semibold">BranchMind – LLM Chat (MVP)</h1>
          <div className="flex items-center gap-4">
            {onNewChat && (
              <button
                onClick={onNewChat}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                title="Start a new conversation"
              >
                + New Chat
              </button>
            )}
            
            {/* User Menu */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  title="User menu"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm hidden md:block truncate max-w-[150px]">
                    {user.email || 'User'}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                      {user.displayName && (
                        <p className="text-xs text-gray-500 truncate">{user.displayName}</p>
                      )}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}


