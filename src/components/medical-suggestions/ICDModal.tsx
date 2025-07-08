import React, { useState } from 'react';
import { X, Search, Loader2, AlertCircle, Info } from 'lucide-react';
import { ICDCode, SelectedArea } from '../../types';

interface ICDModalProps {
  isOpen: boolean;
  selectedArea: SelectedArea | null;
  icdSearchTerm: string;
  setIcdSearchTerm: (term: string) => void;
  selectedIcdType: 'primary' | 'secondary';
  setSelectedIcdType: (type: 'primary' | 'secondary') => void;
  codingReason: string;
  setCodingReason: (reason: string) => void;
  selectedIcdCode: ICDCode | null;
  filteredICDCodes: ICDCode[];
  isSearching?: boolean;
  searchError?: string | null;
  hasUserSelection?: boolean;
  onICDSelection: (code: ICDCode) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ICDModal: React.FC<ICDModalProps> = ({
  isOpen,
  selectedArea,
  icdSearchTerm,
  setIcdSearchTerm,
  selectedIcdType,
  setSelectedIcdType,
  codingReason,
  setCodingReason,
  selectedIcdCode,
  filteredICDCodes,
  isSearching = false,
  searchError = null,
  hasUserSelection = false,
  onICDSelection,
  onSubmit,
  onCancel
}) => {
  // State for showing bounding box details
  const [showBoundingBoxInfo, setShowBoundingBoxInfo] = useState(false);

  if (!isOpen) return null;

  // Show dropdown only if we have results and no user selection has been made
  const showDropdown = icdSearchTerm.length >= 3 && filteredICDCodes.length > 0 && !hasUserSelection;
  const showNoResults = icdSearchTerm.length >= 3 && filteredICDCodes.length === 0 && !isSearching && !searchError && !hasUserSelection;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-sans">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full m-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            Add New {selectedIcdType === 'primary' ? 'Primary' : 'Secondary'} ICD Code
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Location Reference with Collapsible Bounding Box Info */}
          <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-green-800 font-semibold">
                  ✓ Bounding box drawn on {selectedArea?.document}, page {selectedArea?.page}
                </p>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  Document: {selectedArea?.document}
                </p>
              </div>
              
              {/* Info Button for Bounding Box Details */}
              <button
                onClick={() => setShowBoundingBoxInfo(!showBoundingBoxInfo)}
                className="ml-3 p-1.5 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition-all duration-200 flex items-center justify-center"
                title="Show technical details"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            
            {/* Collapsible Bounding Box Technical Details */}
            {showBoundingBoxInfo && selectedArea && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="bg-white rounded border p-3">
                  <h4 className="text-xs font-bold text-gray-700 mb-2">Technical Coordinates (Normalized 0-1):</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="font-semibold text-gray-600">x_min:</span>
                      <span className="ml-2 text-gray-800">{selectedArea.x_min?.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">y_min:</span>
                      <span className="ml-2 text-gray-800">{selectedArea.y_min?.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">x_max:</span>
                      <span className="ml-2 text-gray-800">{selectedArea.x_max?.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">y_max:</span>
                      <span className="ml-2 text-gray-800">{selectedArea.y_max?.toFixed(4)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    These coordinates are used for precise highlighting and evidence linking.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Search & Select ICD */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3">Search & Select ICD Code</h3>
            <p className="text-sm text-gray-600 mb-2 font-medium">Search by ICD Code or Description</p>
            
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={icdSearchTerm}
                  onChange={(e) => setIcdSearchTerm(e.target.value)}
                  placeholder="e.g., I44, atrioventricular, E66.9, obesity, diabetes..."
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
              
              {/* Search Error */}
              {searchError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{searchError}</p>
                </div>
              )}
              
              {/* Search Results Dropdown - Only show when no user selection */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-auto z-10 shadow-lg">
                  <div className="p-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold">
                      {filteredICDCodes.length} results found
                    </p>
                  </div>
                  {filteredICDCodes.map((code) => (
                    <button
                      key={code.code}
                      onClick={() => onICDSelection(code)}
                      className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-bold text-gray-800">{code.code}</div>
                      <div className="text-sm text-gray-600 font-medium mt-1">{code.description}</div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No Results Message - Only show when no user selection */}
              {showNoResults && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 p-4 z-10 shadow-lg">
                  <p className="text-sm text-gray-500 text-center font-medium">
                    No ICD codes found for "{icdSearchTerm}"
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-2 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-sm text-blue-800 font-medium">
                💡 <strong>Tip:</strong> Type at least 3 characters to search by either ICD code (e.g., "I44") or description (e.g., "atrioventricular"). Select from the dropdown to auto-fill both fields.
              </p>
            </div>

            {/* Selected Code Display */}
            {selectedIcdCode && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-semibold mb-1">✓ Selected ICD Code:</p>
                <div className="font-bold text-green-900">{selectedIcdCode.code} - {selectedIcdCode.description}</div>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  You can edit the text above to search for a different code
                </p>
              </div>
            )}
          </div>

          {/* Reason for Coding */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3">Reason for Coding *</h3>
            <textarea
              value={codingReason}
              onChange={(e) => setCodingReason(e.target.value)}
              placeholder="Explain why this ICD code should be included..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none font-medium"
              rows={4}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!selectedIcdCode || !codingReason.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Add {selectedIcdType === 'primary' ? 'Primary' : 'Secondary'} ICD Code
          </button>
        </div>
      </div>
    </div>
  );
};