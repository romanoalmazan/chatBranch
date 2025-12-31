import { useState } from 'react';
import AuthModal from './AuthModal';
import { useTheme } from '../contexts/ThemeContext';

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-gray-50 dark:bg-gray-950 flex flex-col h-full w-full overflow-y-auto transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="BranchAI Logo" 
            className="w-8 h-8 rounded-lg shadow-lg shadow-blue-500/20 object-contain"
          />
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">BranchAI</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center px-6 py-12 text-center w-full">
        <div className="max-w-3xl mb-24">
          <div className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/30 rounded-full">
            AI-Powered Branching Conversations
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
            Explore every path with <span className="text-blue-600 dark:text-blue-400">BranchAI</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            The next generation of LLM chat that <span className="font-semibold text-gray-900 dark:text-gray-100">reduces contextual hallucinations</span> and <span className="font-semibold text-gray-900 dark:text-gray-100">keeps your conversations organized</span>. 
            Create independent conversation branches to explore alternate ideas, test different scenarios, and maintain clear context separation.
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-500 mb-10 leading-relaxed">
            Each branch maintains its own isolated context, preventing AI confusion and ensuring more accurate, focused responses.
          </p>
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full sm:w-auto px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1"
            >
              Start Chatting Now
            </button>
          </div>
        </div>

        {/* Feature Preview Section */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-left transition-colors">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Reduce Contextual Hallucinations</h3>
            <p className="text-gray-600 dark:text-gray-400">Each branch maintains isolated context, preventing AI confusion from mixing unrelated topics. This dramatically reduces hallucinations and ensures more accurate, focused responses.</p>
          </div>
          <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-left transition-colors">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Organized Conversations</h3>
            <p className="text-gray-600 dark:text-gray-400">Keep your chats organized with clear separation between topics. Each branch is self-contained, making it easy to track different ideas, compare responses, and maintain structured conversations.</p>
          </div>
          <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-left transition-colors">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Instant Switching</h3>
            <p className="text-gray-600 dark:text-gray-400">Seamlessly jump between branches to compare AI responses and explore different creative or technical directions without losing context or clarity.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-8 px-6 text-center transition-colors">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          © 2025 BranchAI.
        </p>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

