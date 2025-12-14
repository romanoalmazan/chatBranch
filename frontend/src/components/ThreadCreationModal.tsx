import { useState, useEffect, useRef } from 'react';
import { Message } from '../types/chat';

interface ThreadCreationModalProps {
  message: Message;
  position: { x: number; y: number };
  onClose: () => void;
  onCreate: (threadName: string) => void;
  isCreating?: boolean;
}

export default function ThreadCreationModal({
  message,
  position,
  onClose,
  onCreate,
  isCreating = false,
}: ThreadCreationModalProps) {
  const [threadName, setThreadName] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-generate thread name if empty
  const handleCreate = () => {
    const name = threadName.trim() || `Thread from ${new Date().toLocaleTimeString()}`;
    onCreate(name);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    // Use a flag to prevent immediate closing when modal first opens
    let isInitialMount = true;
    const timeoutId = setTimeout(() => {
      isInitialMount = false;
    }, 100);

    const handleClickOutside = (e: MouseEvent) => {
      if (isInitialMount) return;
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Position modal near the message
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${Math.min(Math.max(position.x - 160, 10), window.innerWidth - 330)}px`,
    top: `${Math.min(Math.max(position.y + 10, 10), window.innerHeight - 300)}px`,
    zIndex: 1000,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-[999]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        style={modalStyle}
        className="bg-white rounded-lg shadow-xl w-80 border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Create Thread</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isCreating}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message preview */}
          <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Replying to:</div>
            <div className="text-sm text-gray-700 line-clamp-2">
              {message.content.substring(0, 100)}
              {message.content.length > 100 ? '...' : ''}
            </div>
          </div>

          {/* Thread name input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Thread Name (optional)
            </label>
            <input
              type="text"
              value={threadName}
              onChange={(e) => setThreadName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="New thread"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCreating}
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              A name will be auto-generated if left empty
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

