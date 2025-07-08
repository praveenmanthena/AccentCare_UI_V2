import React from 'react';

interface CodingFooterProps {
  pendingDecisions: number;
  onReturnToDashboard: () => void;
}

export const CodingFooter: React.FC<CodingFooterProps> = ({
  pendingDecisions,
  onReturnToDashboard
}) => {
  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex gap-3 justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold">
          Save Changes
        </button>
        <button 
          className={`px-6 py-2 rounded-lg font-bold transition-colors ${
            pendingDecisions === 0 
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          disabled={pendingDecisions > 0}
          onClick={pendingDecisions === 0 ? onReturnToDashboard : undefined}
        >
          Complete & Return to Dashboard
        </button>
      </div>
    </div>
  );
};