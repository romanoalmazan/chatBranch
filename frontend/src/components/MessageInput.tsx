import { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'centered';
}

export default function MessageInput({ onSend, disabled, variant = 'default' }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isCentered = variant === 'centered';

  return (
    <div className={isCentered ? '' : 'p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800'}>
      <div className={`flex gap-3 items-end ${isCentered ? 'w-full' : 'max-w-4xl mx-auto'}`}>
        <div className="flex-1 relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isCentered ? "What's on your mind?" : "Ask BranchAI anything..."}
            className={`w-full px-5 py-4 pr-14 border border-gray-200 dark:border-gray-700 rounded-[28px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-transparent resize-none bg-gray-50 dark:bg-gray-800 dark:text-gray-100 transition-all hover:bg-white dark:hover:bg-gray-700/50 ${isCentered ? 'shadow-md' : 'shadow-sm'}`}
            rows={1}
            disabled={disabled}
            style={{ 
              minHeight: '60px',
              maxHeight: '200px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
            }}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={disabled || !input.trim()}
              className={`p-2 rounded-full transition-all ${
                input.trim() 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
