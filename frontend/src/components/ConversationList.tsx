import { useEffect, useState } from 'react';

export interface Conversation {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
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
  authToken,
  isCollapsed = false,
  onToggleCollapse,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-gray-50 border-r border-gray-300 flex flex-col items-center py-4 h-full flex-shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors mb-4"
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
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
    <aside className="w-64 bg-gray-50 border-r border-gray-300 p-4 overflow-y-auto h-full flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Conversations</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewConversation}
            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="New conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={loadConversations}
            className="text-xs text-blue-600 hover:text-blue-800"
            title="Refresh conversations"
            disabled={!authToken}
          >
            ↻
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
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
        <div className="text-sm text-gray-500">Loading conversations...</div>
      )}

      {error && (
        <div className="text-xs text-red-600 mb-2">{error}</div>
      )}

      {conversations.length === 0 && !isLoading && (
        <div className="text-sm text-gray-500 mb-4">
          No conversations yet. Start a new chat!
        </div>
      )}

      <div className="space-y-1">
        {conversations.map((conv) => {
          const isActive = conv.id === currentConversationId;
          
          return (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    💬 Conversation
                  </div>
                  <div className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                    {formatDate(conv.updatedAt)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

