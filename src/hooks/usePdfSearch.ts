import { useState, useRef } from 'react';
import { PdfSearchApiResponse, PdfSearchMatch, SearchHighlight, BoundingBox } from '../types';
import { apiClient } from '../services/apiClient';

export const usePdfSearch = (docId: string | null) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSearchedTerm, setLastSearchedTerm] = useState(''); // Track what was last searched
  const [searchResults, setSearchResults] = useState<SearchHighlight[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [totalMatches, setTotalMatches] = useState(0);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to convert 8-element bbox array to BoundingBox
  const convertBboxToBoundingBox = (bbox: number[]): BoundingBox => {
    if (!bbox || bbox.length !== 8) {
      console.warn('Invalid bbox array, expected 8 elements:', bbox);
      return { x_min: 0, y_min: 0, x_max: 1, y_max: 1 };
    }

    // bbox = [min_x, min_y, max_x, min_y, max_x, max_y, min_x, max_y]
    const xCoords = [bbox[0], bbox[2], bbox[4], bbox[6]];
    const yCoords = [bbox[1], bbox[3], bbox[5], bbox[7]];

    return {
      x_min: Math.min(...xCoords),
      y_min: Math.min(...yCoords),
      x_max: Math.max(...xCoords),
      y_max: Math.max(...yCoords)
    };
  };

  // Transform API search results to SearchHighlight format
  const transformSearchResults = (apiResults: PdfSearchMatch[]): SearchHighlight[] => {
    return apiResults.map((result, index) => ({
      id: `search-${index}`,
      boundingBox: convertBboxToBoundingBox(result.bbox[0]), // Take first bbox if multiple
      document: result.document_name,
      page: result.page_number,
      textSnippet: result.text_snippet,
      matchScore: result.match_score
    }));
  };

  // Perform PDF search - only called on Enter
  const performPdfSearch = async (searchString: string) => {
    if (!docId || !searchString.trim()) {
      clearSearchResults();
      return;
    }

    // Don't search if we already searched for this exact term
    if (searchString.trim() === lastSearchedTerm) {
      console.log('Already searched for this term, skipping API call');
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      const requestBody = {
        search_string: searchString.trim()
      };

      console.log('Performing PDF search for:', searchString.trim());

      const data: PdfSearchApiResponse = await apiClient.post(
        `/search_document/${docId}`,
        requestBody
      );

      const transformedResults = transformSearchResults(data.results);
      setSearchResults(transformedResults);
      setTotalMatches(data.total_matches);
      setCurrentMatchIndex(0);
      setLastSearchedTerm(searchString.trim()); // Update last searched term

      console.log(`Found ${data.total_matches} matches for "${searchString.trim()}"`);

    } catch (error) {
      console.error('Error performing PDF search:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search PDF');
      setSearchResults([]);
      setTotalMatches(0);
      setCurrentMatchIndex(0);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search term change - no automatic searching
  const handleSearchTermChange = (term: string) => {
    console.log('Search term changing to:', term);
    setSearchTerm(term);
    
    // If the term is cleared, clear results immediately
    if (!term.trim()) {
      clearSearch();
    } else if (term.trim() !== lastSearchedTerm) {
      // If the term is different from what was last searched, clear results but keep the term
      // This gives visual feedback that the results are no longer valid
      setSearchResults([]);
      setCurrentMatchIndex(0);
      setTotalMatches(0);
      setSearchError(null);
    }
  };

  // Clear search results but keep the search term
  const clearSearchResults = () => {
    setSearchResults([]);
    setCurrentMatchIndex(0);
    setTotalMatches(0);
    setSearchError(null);
  };

  // Navigate to next match
  const goToNextMatch = () => {
    if (searchResults.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % searchResults.length);
    }
  };

  // Navigate to previous match
  const goToPrevMatch = () => {
    if (searchResults.length > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }
  };

  // Clear search completely
  const clearSearch = () => {
    setSearchTerm('');
    setLastSearchedTerm('');
    setSearchResults([]);
    setCurrentMatchIndex(0);
    setTotalMatches(0);
    setSearchError(null);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Get current search highlight
  const currentSearchHighlight = searchResults.length > 0 ? searchResults[currentMatchIndex] : null;

  // Check if current term matches last searched term
  const isCurrentTermSearched = searchTerm.trim() === lastSearchedTerm;

  return {
    searchTerm,
    setSearchTerm: handleSearchTermChange,
    searchResults,
    currentMatchIndex,
    currentSearchHighlight,
    totalMatches,
    isSearching,
    searchError,
    lastSearchedTerm,
    isCurrentTermSearched,
    performPdfSearch,
    goToNextMatch,
    goToPrevMatch,
    clearSearch,
    clearSearchResults,
    hasResults: searchResults.length > 0,
    hasMultipleResults: searchResults.length > 1
  };
};