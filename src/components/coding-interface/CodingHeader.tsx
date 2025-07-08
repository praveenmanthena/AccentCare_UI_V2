import React from 'react';
import { 
  FileText, ChevronDown, Search 
} from 'lucide-react';
import { PDFControls } from '../pdf-viewer/PDFControls';
import { Document } from '../../types';

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
  onPageInputBlur
}) => {
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
              title={documents.find(doc => doc.id === selectedDocument)?.name || ''}
            >
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.name.length > 25 ? `${doc.name.substring(0, 25)}...` : doc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Center: PDF Search Bar */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="Search in PDF..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium bg-white"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
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