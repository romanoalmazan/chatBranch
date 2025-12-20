import { useEffect, useState } from 'react';

export interface Conversation {
  id: string;
  userId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  authToken: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function getConversations(token: string): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in again');
    }
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const conversations = await response.json();
  // Convert Date objects to strings
  return conversations.map((conv: Conversation) => ({
    ...conv,
    createdAt: conv.createdAt ? new Date(conv.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: conv.updatedAt ? new Date(conv.updatedAt).toISOString() : new Date().toISOString(),
  }));
}

export default function ConversationList({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  authToken,
  isCollapsed = false,
  onToggleCollapse,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authToken) {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, currentConversationId]); // Reload when conversation changes

  const loadConversations = async () => {
    if (!authToken) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const loadedConversations = await getConversations(authToken);
      setConversations(loadedConversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering conversation selection
    
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    if (!authToken) return;

    try {
      setDeletingId(conversationId);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - please sign in again');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to delete this conversation');
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Notify parent if callback provided
      if (onDeleteConversation) {
        onDeleteConversation(conversationId);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-gray-50 dark:bg-gray-950 border-r border-gray-300 dark:border-gray-800 flex flex-col items-center py-4 h-full flex-shrink-0 transition-colors duration-300">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors mb-4"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={onNewConversation}
          className="mb-4 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          title="New conversation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto">
          {conversations.slice(0, 10).map((conv) => {
            const isActive = conv.id === currentConversationId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
                }`}
                title={formatDate(conv.updatedAt)}
              >
                {conv.id.charAt(0).toUpperCase()}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-950 border-r border-gray-300 dark:border-gray-800 p-4 overflow-y-auto h-full flex-shrink-0 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conversations</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewConversation}
            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
            title="New conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={loadConversations}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            title="Refresh conversations"
            disabled={!authToken}
          >
            ↻
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
              title="Collapse sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {isLoading && conversations.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      )}

      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</div>
      )}

      {conversations.length === 0 && !isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          No conversations yet.
        </div>
      )}

      <div className="space-y-1">
        {conversations.map((conv) => {
          const isActive = conv.id === currentConversationId;
          const isDeleting = deletingId === conv.id;
          
          return (
            <div
              key={conv.id}
              className={`group relative w-full px-3 py-2 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-900'
              }`}
            >
              <button
                onClick={() => !isDeleting && onSelectConversation(conv.id)}
                disabled={isDeleting}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-2">
                      <span className="text-lg">💬</span>
                      <span className="truncate">{conv.title || 'New Conversation'}</span>
                    </div>
                    <div className={`text-[10px] mt-1 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                      {formatDate(conv.updatedAt)}
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => handleDeleteConversation(conv.id, e)}
                disabled={isDeleting}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDeleting
                    ? 'opacity-100 cursor-wait'
                    : ''
                } ${
                  isActive
                    ? 'text-blue-100 hover:text-white hover:bg-blue-700'
                    : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Delete conversation"
              >
                {isDeleting ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

