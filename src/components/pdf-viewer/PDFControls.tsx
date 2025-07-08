import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PDFControlsProps {
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  pageInputValue: string;
  isEditingPage: boolean;
  isPageLoading: boolean;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPageInputClick: () => void;
  onPageInputChange: (value: string) => void;
  onPageInputKeyPress: (key: string) => void;
  onPageInputBlur: () => void;
}

export const PDFControls: React.FC<PDFControlsProps> = ({
  currentPage,
  totalPages,
  pageInputValue,
  isEditingPage,
  isPageLoading,
  onPageChange,
  onPageInputClick,
  onPageInputChange,
  onPageInputKeyPress,
  onPageInputBlur
}) => {
  const isDisabled = isPageLoading;

  return (
    <div className="flex items-center gap-3">
      {/* Page Navigation */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isDisabled}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        title="Previous page (↑)"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-gray-600">Page</span>
        {isEditingPage ? (
          <input
            type="number"
            value={pageInputValue}
            onChange={(e) => onPageInputChange(e.target.value)}
            onKeyDown={(e) => onPageInputKeyPress(e.key)}
            onBlur={onPageInputBlur}
            className="w-12 px-1 py-0.5 text-sm text-center border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
            min="1"
            max={totalPages}
            autoFocus
            disabled={isDisabled}
          />
        ) : (
          <button
            onClick={onPageInputClick}
            disabled={isDisabled}
            className={`px-2 py-0.5 text-sm font-bold rounded border border-transparent transition-colors ${
              isDisabled 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-600 hover:bg-blue-50 hover:border-blue-300'
            }`}
            title="Click to jump to page"
          >
            {currentPage}
          </button>
        )}
        <span className="text-sm font-medium text-gray-600">of {totalPages}</span>
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isDisabled}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        title="Next page (↓)"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};