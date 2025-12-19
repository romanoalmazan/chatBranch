import { useEffect, useState } from 'react';
import { getBranches, Branch } from '../api/chat';

interface BranchSidebarProps {
  conversationId: string;
  currentBranchId: string;
  onSwitchBranch: (branchId: string) => void;
  onOpenBranch?: (branchId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function BranchSidebar({
  conversationId,
  currentBranchId,
  onSwitchBranch,
  onOpenBranch,
  isCollapsed = false,
  onToggleCollapse,
}: BranchSidebarProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (conversationId) {
      loadBranches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // Only reload when conversationId changes, not on every branch switch

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedBranches = await getBranches(conversationId);
      setBranches(loadedBranches);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBranchDisplayName = (branch: Branch) => {
    if (branch.id === 'main') {
      return 'Main Branch';
    }
    
    // Extract thread name from branch ID
    // Format: thread-{timestamp}-{name} or just the name if it doesn't match the pattern
    const match = branch.id.match(/^thread-\d+-(.+)$/);
    if (match) {
      // Extract the name part and replace dashes with spaces, capitalize words
      const name = match[1].replace(/-/g, ' ');
      return name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    // If it doesn't match the pattern, return as is (truncated if too long)
    return branch.id.length > 20 ? `${branch.id.substring(0, 20)}...` : branch.id;
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-800 flex flex-col items-center py-4 h-full flex-shrink-0 transition-colors duration-300">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors mb-4"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1 flex flex-col items-center gap-2">
          {branches.slice(0, 5).map((branch) => {
            const isActive = branch.id === currentBranchId;
            return (
              <button
                key={branch.id}
                onClick={() => {
                  if (branch.id === 'main') {
                    onSwitchBranch(branch.id);
                  } else if (onOpenBranch) {
                    onOpenBranch(branch.id);
                  } else {
                    onSwitchBranch(branch.id);
                  }
                }}
                className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-800'
                }`}
                title={branch.id === 'main' ? 'Main Branch' : branch.id}
              >
                {branch.id === 'main' ? 'M' : branch.id.charAt(0).toUpperCase()}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-800 p-4 hidden md:block overflow-y-auto h-full flex-shrink-0 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Branches</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBranches}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            title="Refresh branches"
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

      {isLoading && branches.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      )}

      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</div>
      )}

      {branches.length === 0 && !isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No branches yet.
        </div>
      )}

      <div className="space-y-1">
        {branches.map((branch) => {
          const isActive = branch.id === currentBranchId;
          const isMain = branch.id === 'main';
          
          return (
            <button
              key={branch.id}
              onClick={() => {
                if (branch.id === 'main') {
                  onSwitchBranch(branch.id);
                } else if (onOpenBranch) {
                  onOpenBranch(branch.id);
                } else {
                  onSwitchBranch(branch.id);
                }
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    <span className="text-lg">{isMain ? '🌿' : '🌱'}</span>
                    <span className="truncate">{getBranchDisplayName(branch)}</span>
                  </div>
                  {branch.parentBranchId && (
                    <div className={`text-[10px] mt-1 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                      from {branch.parentBranchId === 'main' ? 'main' : branch.parentBranchId.substring(0, 10)}...
                    </div>
                  )}
                  <div className={`text-[10px] mt-1 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                    {formatDate(branch.updatedAt)}
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


