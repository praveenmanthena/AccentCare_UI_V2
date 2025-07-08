import { useState, useRef, useEffect } from 'react';
import { Document, DocumentContent, HighlightedEvidence } from '../types';
import { useImagePreloader } from './useImagePreloader';

export const useDocumentViewer = (
  documents: Document[], 
  documentContent: Record<string, Record<number, DocumentContent>>
) => {
  const [selectedDocument, setSelectedDocument] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100); // Set to 100% by default
  const [targetPage, setTargetPage] = useState(1); // Track the page we want to navigate to
  const [pageInputValue, setPageInputValue] = useState('');
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [highlightedEvidence, setHighlightedEvidence] = useState<HighlightedEvidence | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [actualCurrentPage, setActualCurrentPage] = useState(1);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const scrollToPageRef = useRef<((page: number) => void) | null>(null);
  const [visiblePageRange, setVisiblePageRange] = useState({ start: 1, end: 1 });
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showHighlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use image preloader
  const { isImagePreloaded, preloadProgress, isPreloading, allImagesLoaded } = useImagePreloader(documents, documentContent);

  // Initialize selectedDocument when documents change
  useEffect(() => {
    if (documents.length > 0 && !selectedDocument) {
      setSelectedDocument(documents[0].id);
      setCurrentPage(1);
      setTargetPage(1);
      setActualCurrentPage(1);
      // Set initial visible range
      const totalPages = documents[0]?.pages || 1;
      setVisiblePageRange({ start: 1, end: totalPages });
    }
  }, [documents, selectedDocument]);

  const currentDocument = documents.find(doc => doc.id === selectedDocument);

  // Keyboard navigation effect
  useEffect(() => {
    // Keyboard navigation is now handled directly in PDFViewer for smooth scrolling
    // This effect is kept for compatibility but functionality moved to PDFViewer
  }, [currentPage, currentDocument, isEditingPage]);

  // Clear timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      if (showHighlightTimeoutRef.current) {
        clearTimeout(showHighlightTimeoutRef.current);
      }
    };
  }, []);

  const clearAllHighlightTimeouts = () => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
    if (showHighlightTimeoutRef.current) {
      clearTimeout(showHighlightTimeoutRef.current);
      showHighlightTimeoutRef.current = null;
    }
  };

  const clearHighlight = () => {
    clearAllHighlightTimeouts();
    setShowHighlight(false);
    setHighlightedEvidence(null);
  };

  const setHighlightWithTimeout = (evidence: HighlightedEvidence) => {
    clearAllHighlightTimeouts();
    
    // Wait 500ms after transition completes before showing highlight
    showHighlightTimeoutRef.current = setTimeout(() => {
      setHighlightedEvidence(evidence);
      setShowHighlight(true);
      showHighlightTimeoutRef.current = null;
      
      // Set 30-second timeout to clear highlight
      highlightTimeoutRef.current = setTimeout(() => {
        setShowHighlight(false);
        setHighlightedEvidence(null);
        highlightTimeoutRef.current = null;
      }, 30000);
    }, 500);
  };

  const calculateTransitionDelay = (targetUrl: string): number => {
    // Reduced base delay for smoother transitions
    const baseDelay = 150;
    
    // If image is preloaded, use minimum delay
    if (isImagePreloaded(targetUrl)) {
      return baseDelay;
    }
    
    // If not preloaded, add extra time for loading
    return baseDelay + 600; // Total 750ms for non-preloaded images
  };

  const goToPage = async (page: number) => {
    if (currentDocument && page >= 1 && page <= currentDocument.pages && page !== targetPage) {
      // Clear any existing highlight immediately before starting transition
      clearHighlight();
      
      // Set target page for navigation
      setTargetPage(page);
      
      // Use the scroll function from PDFViewer if available
      if (scrollToPageRef.current) {
        scrollToPageRef.current(page);
      }
      
      setCurrentPage(page);
      setActualCurrentPage(page);
    }
  };

  // Handle page change from PDF viewer (when scrolling)
  const handlePageChangeFromViewer = (page: number) => {
    setActualCurrentPage(page);
    setTargetPage(page); // Update target page when scrolling naturally
    // Don't update currentPage here as it's used for navigation
  };

  const switchDocument = async (documentId: string, targetPage: number = 1) => {
    if (documentId === selectedDocument) return;
    
    const targetDocument = documents.find(doc => doc.id === documentId);
    if (!targetDocument) return;

    // Clear any existing highlight immediately before starting transition
    clearHighlight();
    
    // Brief transition for document switching
    setIsTransitioning(true);
    
    // Short delay for document switching
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setSelectedDocument(documentId);
    setCurrentPage(targetPage);
    setTargetPage(targetPage);
    setActualCurrentPage(targetPage);
    
    // Update visible page range for new document
    setVisiblePageRange({ start: 1, end: targetDocument.pages });
    
    setIsTransitioning(false);
  };

  // Remove zoom functions - no longer needed
  const handleZoomIn = () => {
    // Function kept for compatibility but does nothing
  };

  const handleZoomOut = () => {
    // Function kept for compatibility but does nothing
  };

  const handleZoomReset = () => {
    // Function kept for compatibility but does nothing
  };

  const navigateToEvidence = async (evidence: { document: string; page: number; id: string; boundingBox?: any }) => {
    // Clear any existing highlight timeouts immediately
    clearHighlight();

    // Create the highlighted evidence object
    const highlightEvidence: HighlightedEvidence = {
      id: evidence.id,
      boundingBox: evidence.boundingBox || { x_min: 0, y_min: 0, x_max: 1, y_max: 1 },
      document: evidence.document,
      page: evidence.page
    };

    // Check if we're already on the correct document and page
    if (evidence.document === selectedDocument && evidence.page === currentPage && !isTransitioning) {
      // Same document and page - highlight with delay (no navigation needed)
      setHighlightWithTimeout(highlightEvidence);
      return;
    }

    // Different document or page - need transition
    // Navigate to the target document/page first
    if (evidence.document !== selectedDocument) {
      // Switch document directly to target page
      await switchDocument(evidence.document, evidence.page);
    } else {
      // Same document, different page
      await goToPage(evidence.page);
      setTargetPage(evidence.page);
    }
    
    // After navigation is complete, set highlight with delay
    setHighlightWithTimeout(highlightEvidence);
  };

  const handlePageInputClick = () => {
    setIsEditingPage(true);
    setPageInputValue(currentPage.toString());
  };

  const handlePageInputChange = (value: string) => {
    setPageInputValue(value);
  };

  const handlePageInputKeyPress = (key: string) => {
    if (key === 'Enter') {
      const pageNum = parseInt(pageInputValue);
      if (!isNaN(pageNum)) {
        goToPage(pageNum);
      }
      setIsEditingPage(false);
      setPageInputValue('');
    } else if (key === 'Escape') {
      setIsEditingPage(false);
      setPageInputValue('');
    }
  };

  const handlePageInputBlur = () => {
    const pageNum = parseInt(pageInputValue);
    if (!isNaN(pageNum)) {
      goToPage(pageNum);
    }
    setIsEditingPage(false);
    setPageInputValue('');
  };

  // Function to register scroll callback from PDFViewer
  const registerScrollToPage = (scrollFn: (page: number) => void) => {
    scrollToPageRef.current = scrollFn;
  };

  return {
    selectedDocument,
    setSelectedDocument: (docId: string) => switchDocument(docId),
    currentPage: actualCurrentPage, // Return the actual current page from viewer
    setCurrentPage,
    zoomLevel, // Always 100%
    currentDocument,
    targetPage,
    pageInputValue,
    isEditingPage,
    highlightedEvidence,
    showHighlight,
    isTransitioning,
    imageRef,
    preloadProgress,
    isPreloading,
    allImagesLoaded,
    goToPage,
    handleZoomIn, // Kept for compatibility
    handleZoomOut, // Kept for compatibility
    handleZoomReset, // Kept for compatibility
    navigateToEvidence,
    handlePageInputClick,
    handlePageInputChange,
    handlePageInputKeyPress,
    handlePageInputBlur,
    handlePageChangeFromViewer,
    registerScrollToPage
  };
};