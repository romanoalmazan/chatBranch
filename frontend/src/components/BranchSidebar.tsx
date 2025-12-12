import React from 'react';

/**
 * Placeholder sidebar component for future branch navigation.
 * 
 * TODO: Implement branch navigation UI:
 * - Display list of conversation branches
 * - Allow switching between branches
 * - Show branch hierarchy/relationships
 * - Add "Create Branch" functionality
 */
export default function BranchSidebar() {
  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-300 p-4 hidden md:block">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Branches</h2>
      <div className="text-sm text-gray-500">
        <p>Branch navigation coming soon...</p>
        {/* TODO: Add branch list component here */}
      </div>
    </aside>
  );
}


