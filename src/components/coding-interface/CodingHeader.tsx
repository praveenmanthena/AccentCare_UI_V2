import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Search,
  X,
} from "lucide-react";
import React from "react";
import { Document, SearchHighlight } from "../../types";
import { PDFControls } from "../pdf-viewer/PDFControls";

interface CodingHeaderProps {
  selectedEpisodeDocId: string;
  documents: Document[];
  selectedDocument: string;
  currentPage: number;
  currentDocument: Document | undefined;
  zoomLevel: number;
  pageInputValue: string;
  isEditingPage: boolean;
  isTransitioning: boolean;
  onDocumentChange: (documentId: string) => void;
  onReturnToDashboard: () => void;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPageInputClick: () => void;
  onPageInputChange: (value: string) => void;
  onPageInputKeyPress: (key: string) => void;
  onPageInputBlur: () => void;
  // PDF Search props
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearchSubmit: () => void;
  searchResults: SearchHighlight[];
  currentMatchIndex: number;
  totalMatches: number;
  isSearching: boolean;
  searchError: string | null;
  hasSearchResults: boolean;
  hasMultipleResults: boolean;
  isCurrentTermSearched: boolean;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onClearSearch: () => void;
}

export const CodingHeader: React.FC<CodingHeaderProps> = ({
  selectedEpisodeDocId,
  documents,
  selectedDocument,
  currentPage,
  currentDocument,
  zoomLevel,
  pageInputValue,
  isEditingPage,
  isTransitioning,
  onDocumentChange,
  onReturnToDashboard,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPageInputClick,
  onPageInputChange,
  onPageInputKeyPress,
  onPageInputBlur,
  // PDF Search props
  searchTerm,
  onSearchTermChange,
  onSearchSubmit,
  searchResults,
  currentMatchIndex,
  totalMatches,
  isSearching,
  searchError,
  hasSearchResults,
  hasMultipleResults,
  isCurrentTermSearched,
  onNextMatch,
  onPrevMatch,
  onClearSearch,
}) => {
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchTerm.trim()) {
        onSearchSubmit();
      }
    }
  };

  return (
    <div className="border-b border-gray-200 p-4">
      {/* Single Row Layout - Document Selector, Search Bar, Page Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Document Selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <FileText className="w-5 h-5 text-gray-600" />
          <div className="relative">
            <select
              value={selectedDocument}
              onChange={(e) => onDocumentChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded px-3 py-2 pr-8 text-sm font-semibold text-gray-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none max-w-[200px] truncate"
              title={
                documents.find((doc) => doc.id === selectedDocument)?.name || ""
              }
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name.length > 25
                    ? `${doc.name.substring(0, 25)}...`
                    : doc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Center: PDF Search Bar */}
        <div className="flex-1 max-w-sm">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                e.preventDefault();
                onSearchTermChange(e.target.value);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search in PDF (press Enter to search)..."
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium bg-white transition-all duration-200 ${
                searchError ? "border-red-300" : "border-gray-300"
              }`}
              autoComplete="off"
              spellCheck="false"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isSearching ? (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              ) : (
                <Search className="h-4 w-4 text-gray-400" />
              )}
            </div>

            {/* Clear Search Button */}
            {searchTerm && (
              <button
                onClick={onClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Status Indicator */}
          {searchTerm && !isCurrentTermSearched && !isSearching && (
            <div className="mt-1 text-xs text-orange-600 font-medium">
              Press Enter to search for "{searchTerm}"
            </div>
          )}

          {/* Search Results Info and Navigation */}
          {hasSearchResults && (
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-600 font-medium">
                {totalMatches} match{totalMatches !== 1 ? "es" : ""} found
                {hasMultipleResults && (
                  <span className="ml-2">
                    ({currentMatchIndex + 1} of {searchResults.length})
                  </span>
                )}
              </span>

              {/* Navigation Buttons */}
              {hasMultipleResults && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={onPrevMatch}
                    className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors search-nav-button"
                    title="Previous match"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <button
                    onClick={onNextMatch}
                    className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors search-nav-button"
                    title="Next match"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Search Error */}
          {searchError && (
            <div className="mt-2 text-xs text-gray-500 font-medium">
              No matches found for "{searchTerm}"
            </div>
          )}

          {/* No Results Message */}
          {searchTerm &&
            isCurrentTermSearched &&
            !isSearching &&
            !hasSearchResults &&
            !searchError && (
              <div className="mt-2 text-xs text-gray-500 font-medium">
                No matches found for "{searchTerm}"
              </div>
            )}
        </div>

        {/* Right: PDF Controls */}
        <div className="flex-shrink-0">
          <PDFControls
            currentPage={currentPage}
            totalPages={currentDocument?.pages || 1}
            zoomLevel={zoomLevel}
            pageInputValue={pageInputValue}
            isEditingPage={isEditingPage}
            isPageLoading={isTransitioning}
            onPageChange={onPageChange}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onZoomReset={onZoomReset}
            onPageInputClick={onPageInputClick}
            onPageInputChange={onPageInputChange}
            onPageInputKeyPress={onPageInputKeyPress}
            onPageInputBlur={onPageInputBlur}
          />
        </div>
      </div>
    </div>
  );
};
