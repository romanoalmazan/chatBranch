import { useEffect, useState } from 'react';
import { getBranches, Branch } from '../api/chat';

interface BranchSidebarProps {
  conversationId: string;
  currentBranchId: string;
  onSwitchBranch: (branchId: string) => void;
  onOpenBranch?: (branchId: string) => void;
}

export default function BranchSidebar({
  conversationId,
  currentBranchId,
  onSwitchBranch,
  onOpenBranch,
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

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-300 p-4 hidden md:block overflow-y-auto h-full flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Branches</h2>
        <button
          onClick={loadBranches}
          className="text-xs text-blue-600 hover:text-blue-800"
          title="Refresh branches"
        >
          ↻
        </button>
      </div>

      {isLoading && branches.length === 0 && (
        <div className="text-sm text-gray-500">Loading branches...</div>
      )}

      {error && (
        <div className="text-xs text-red-600 mb-2">{error}</div>
      )}

      {branches.length === 0 && !isLoading && (
        <div className="text-sm text-gray-500">
          No branches yet. Create a branch from a message.
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
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {isMain ? '🌿' : '🌱'} {getBranchDisplayName(branch)}
                  </div>
                  {branch.parentBranchId && (
                    <div className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                      from {branch.parentBranchId === 'main' ? 'main' : branch.parentBranchId.substring(0, 10)}...
                    </div>
                  )}
                  <div className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
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


