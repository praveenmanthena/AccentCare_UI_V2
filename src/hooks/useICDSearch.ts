import { useState, useRef } from 'react';
import { ICDCode, SelectedArea } from '../types';
import { apiClient } from '../services/apiClient';

export const useICDSearch = () => {
  const [showICDModal, setShowICDModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null);
  const [icdSearchTerm, setIcdSearchTerm] = useState('');
  const [selectedIcdType, setSelectedIcdType] = useState<'primary' | 'secondary'>('primary');
  const [codingReason, setCodingReason] = useState('');
  const [selectedIcdCode, setSelectedIcdCode] = useState<ICDCode | null>(null);
  const [isAddingICD, setIsAddingICD] = useState(false);
  const [filteredICDCodes, setFilteredICDCodes] = useState<ICDCode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Primary code conflict popup state
  const [showPrimaryConflictPopup, setShowPrimaryConflictPopup] = useState(false);
  
  // Track if user has made a selection to prevent unnecessary searches
  const [hasUserSelection, setHasUserSelection] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const searchICDCodes = async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setFilteredICDCodes([]);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      const data = await apiClient.get(`/search_icd_codes?search_string=${encodeURIComponent(searchTerm)}`);
      
      // Transform API response to ICDCode format
      const transformedCodes: ICDCode[] = data.map((item: any) => ({
        code: item.Code,
        description: item.Description
      }));

      setFilteredICDCodes(transformedCodes);
    } catch (error) {
      console.error('Error searching ICD codes:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search ICD codes');
      setFilteredICDCodes([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search to avoid too many API calls
  const debouncedSearch = (searchTerm: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchICDCodes(searchTerm);
    }, 300); // 300ms delay
  };

  const handleSearchTermChange = (term: string) => {
    setIcdSearchTerm(term);
    
    // If user starts typing and we have a selection, clear it and enable searching again
    if (hasUserSelection && selectedIcdCode) {
      // Check if the user is modifying the selected text
      const expectedText = `${selectedIcdCode.code} - ${selectedIcdCode.description}`;
      if (term !== expectedText) {
        // User is typing something different, clear selection
        setSelectedIcdCode(null);
        setHasUserSelection(false);
        setFilteredICDCodes([]);
      }
    }
    
    // Only search if we don't have a user selection and term is 3+ characters
    if (!hasUserSelection && term.length >= 3) {
      debouncedSearch(term);
    } else if (term.length < 3) {
      setFilteredICDCodes([]);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  };

  const handleICDSelection = (code: ICDCode) => {
    setSelectedIcdCode(code);
    setIcdSearchTerm(`${code.code} - ${code.description}`);
    setFilteredICDCodes([]); // Hide dropdown after selection
    setHasUserSelection(true); // Mark that user has made a selection
    
    // Clear any pending search timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // UPDATED: Enhanced startAddingICD with primary code conflict check
  const startAddingICD = (diagnosisType: 'primary' | 'secondary' = 'primary', hasActivePrimaryCode?: boolean) => {
    // Check for primary code conflict
    if (diagnosisType === 'primary' && hasActivePrimaryCode) {
      setShowPrimaryConflictPopup(true);
      return;
    }
    
    setIsAddingICD(true);
    setSelectedIcdType(diagnosisType);
  };

  const cancelICDAddition = () => {
    setShowICDModal(false);
    setIsAddingICD(false);
    setSelectedArea(null);
    setIcdSearchTerm('');
    setSelectedIcdCode(null);
    setCodingReason('');
    setSelectedIcdType('primary');
    setFilteredICDCodes([]);
    setSearchError(null);
    setHasUserSelection(false);
    
    // Clear any pending search timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // UPDATED: Reset modal state and automatically disable ICD adding mode
  const resetModalState = () => {
    setShowICDModal(false);
    setIsAddingICD(false); // UPDATED: Automatically disable ICD adding mode
    setSelectedArea(null);
    setIcdSearchTerm('');
    setSelectedIcdCode(null);
    setCodingReason('');
    setSelectedIcdType('primary');
    setFilteredICDCodes([]);
    setSearchError(null);
    setHasUserSelection(false);
    
    // Clear any pending search timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Handle primary conflict popup actions
  const handleClosePrimaryConflictPopup = () => {
    setShowPrimaryConflictPopup(false);
  };

  return {
    showICDModal,
    setShowICDModal,
    selectedArea,
    setSelectedArea,
    icdSearchTerm,
    setIcdSearchTerm: handleSearchTermChange,
    selectedIcdType,
    setSelectedIcdType,
    codingReason,
    setCodingReason,
    selectedIcdCode,
    setSelectedIcdCode,
    isAddingICD,
    setIsAddingICD,
    filteredICDCodes,
    isSearching,
    searchError,
    hasUserSelection,
    
    // Primary conflict popup state
    showPrimaryConflictPopup,
    
    handleICDSelection,
    startAddingICD,
    cancelICDAddition,
    resetModalState,
    
    // Primary conflict popup actions
    handleClosePrimaryConflictPopup
  };
};