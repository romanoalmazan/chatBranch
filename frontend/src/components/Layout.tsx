import { ReactNode, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  onNewChat?: () => void;
}

export default function Layout({ children, onNewChat }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ... (handleClickOutside remains same)

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 w-full">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0 transition-all duration-300 sticky top-0 z-50">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img 
              src="/logo.png" 
              alt="BranchAI Logo" 
              className="w-9 h-9 rounded-xl shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform object-contain"
            />
            <div>
              <span className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">BranchAI</span>
              <span className="ml-2 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-black rounded uppercase tracking-widest border border-blue-100 dark:border-blue-800">MVP</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 18v1m9-9h1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {onNewChat && (
              <button
                onClick={onNewChat}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-md shadow-blue-500/20"
                title="Start a new conversation"
              >
                <span className="hidden sm:inline">+ New Chat</span>
                <span className="sm:hidden">+</span>
              </button>
            )}
            
            {/* User Menu */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-2 sm:px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                  title="User menu"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium text-white ring-2 ring-white dark:ring-gray-800">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm hidden lg:block truncate max-w-[150px]">
                    {user.email || 'User'}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-xl py-1 z-50 border border-gray-200 dark:border-gray-800">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.email}</p>
                      {user.displayName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.displayName}</p>
                      )}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
        <main className="flex-1 overflow-hidden flex flex-col min-h-0 w-full dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}


