import { useState, useEffect } from 'react';
import { CodeSuggestion, Comment, ApiReviewStats } from '../types';
import { saveCodingOrder } from '../services/codingApiService';

interface UseCodingStateProps {
  initialPrimarySuggestions?: CodeSuggestion[];
  initialSecondarySuggestions?: CodeSuggestion[];
  reviewStats?: ApiReviewStats | null;
  selectedEpisodeDocId?: string;
  initialComments?: Record<string, Comment[]>;
}

export const useCodingState = (props: UseCodingStateProps = {}) => {
  const { 
    initialPrimarySuggestions = [], 
    initialSecondarySuggestions = [], 
    reviewStats,
    selectedEpisodeDocId,
    initialComments = {}
  } = props;

  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [rejectedCodes, setRejectedCodes] = useState<Set<string>>(new Set());
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, Comment[]>>(initialComments);
  const [activeTab, setActiveTab] = useState<'all' | 'accepted' | 'rejected' | 'newly-added'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Primary promotion popup state
  const [showPrimaryPromotionPopup, setShowPrimaryPromotionPopup] = useState(false);
  const [pendingPromotionCodeId, setPendingPromotionCodeId] = useState<string | null>(null);

  // HIPPS Scoring State
  const [hippsScore, setHippsScore] = useState('1HGCF');
  const [caseMixPoints, setCaseMixPoints] = useState(0);
  const [caseMixGroup, setCaseMixGroup] = useState('1HGCF');
  const [baseRate] = useState(2000);
  const [paymentMultiplier, setPaymentMultiplier] = useState(1.0);
  const [finalPayment, setFinalPayment] = useState(2000);
  const [oasisScore] = useState(85);
  const [therapyMinutes] = useState(450);

  // State for suggestions - initialize with API data
  const [primarySuggestions, setPrimarySuggestions] = useState<CodeSuggestion[]>(initialPrimarySuggestions);
  const [secondarySuggestions, setSecondarySuggestions] = useState<CodeSuggestion[]>(initialSecondarySuggestions);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update suggestions when initial data changes
  useEffect(() => {
    setPrimarySuggestions(initialPrimarySuggestions);
    setSecondarySuggestions(initialSecondarySuggestions);
  }, [initialPrimarySuggestions, initialSecondarySuggestions]);

  // Update comments when initial comments change
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Initialize selected/rejected codes based on API status
  useEffect(() => {
    const allCodes = [...primarySuggestions, ...secondarySuggestions];
    const newSelectedCodes = new Set<string>();
    const newRejectedCodes = new Set<string>();

    allCodes.forEach(code => {
      if (code.status === 'accepted' || code.isManuallyAdded) {
        newSelectedCodes.add(code.id);
      } else if (code.status === 'rejected') {
        newRejectedCodes.add(code.id);
      }
    });

    setSelectedCodes(newSelectedCodes);
    setRejectedCodes(newRejectedCodes);
  }, [primarySuggestions, secondarySuggestions]);

  // HIPPS Case Mix Calculation Function
  const calculateHippsCaseMix = () => {
    const allCodes = [...primarySuggestions, ...secondarySuggestions];
    const activeCodes = allCodes.filter(code => 
      (selectedCodes.has(code.id) || code.isManuallyAdded) && code.isHippsContributor
    );

    // Calculate total HIPPS points from active codes
    const totalHippsPoints = activeCodes.reduce((sum, code) => sum + code.hippsPoints, 0);
    
    // Determine case mix group based on conditions and therapy
    let caseMixGroup = '1';
    let functionalLevel = 'H';
    let serviceLevel = 'G';
    let comorbidityLevel = 'C';
    let therapyLevel = 'F';

    // Clinical Severity (based on primary diagnosis complexity)
    const primaryCode = primarySuggestions.find(code => selectedCodes.has(code.id) || code.isManuallyAdded);
    if (primaryCode) {
      if (primaryCode.hippsPoints >= 25) caseMixGroup = '6';
      else if (primaryCode.hippsPoints >= 20) caseMixGroup = '5';
      else if (primaryCode.hippsPoints >= 15) caseMixGroup = '4';
      else if (primaryCode.hippsPoints >= 10) caseMixGroup = '3';
      else if (primaryCode.hippsPoints >= 5) caseMixGroup = '2';
      else caseMixGroup = '1';
    }

    // Functional Level (based on OASIS score)
    if (oasisScore >= 90) functionalLevel = 'H';
    else if (oasisScore >= 70) functionalLevel = 'M';
    else functionalLevel = 'L';

    // Service Utilization (based on total HIPPS points)
    if (totalHippsPoints >= 80) serviceLevel = 'K';
    else if (totalHippsPoints >= 60) serviceLevel = 'J';
    else if (totalHippsPoints >= 45) serviceLevel = 'I';
    else if (totalHippsPoints >= 30) serviceLevel = 'H';
    else if (totalHippsPoints >= 20) serviceLevel = 'G';
    else if (totalHippsPoints >= 15) serviceLevel = 'F';
    else if (totalHippsPoints >= 10) serviceLevel = 'E';
    else if (totalHippsPoints >= 5) serviceLevel = 'D';
    else serviceLevel = 'C';

    // Comorbidity Level (based on number of secondary diagnoses)
    const secondaryCount = secondarySuggestions.filter(code => 
      selectedCodes.has(code.id) || code.isManuallyAdded
    ).length;
    if (secondaryCount >= 5) comorbidityLevel = 'F';
    else if (secondaryCount >= 4) comorbidityLevel = 'E';
    else if (secondaryCount >= 3) comorbidityLevel = 'D';
    else if (secondaryCount >= 2) comorbidityLevel = 'C';
    else if (secondaryCount >= 1) comorbidityLevel = 'B';
    else comorbidityLevel = 'A';

    // Therapy Level (based on therapy minutes)
    if (therapyMinutes >= 600) therapyLevel = 'F';
    else if (therapyMinutes >= 480) therapyLevel = 'E';
    else if (therapyMinutes >= 360) therapyLevel = 'D';
    else if (therapyMinutes >= 240) therapyLevel = 'C';
    else if (therapyMinutes >= 120) therapyLevel = 'B';
    else therapyLevel = 'A';

    const finalCaseMixGroup = `${caseMixGroup}${functionalLevel}${serviceLevel}${comorbidityLevel}${therapyLevel}`;

    // Calculate payment multiplier based on case mix group
    let multiplier = 1.0;
    
    const severityMultipliers = { '1': 1.0, '2': 1.15, '3': 1.30, '4': 1.45, '5': 1.60, '6': 1.75 };
    multiplier *= severityMultipliers[caseMixGroup as keyof typeof severityMultipliers] || 1.0;

    const functionalMultipliers = { 'L': 1.25, 'M': 1.10, 'H': 1.0 };
    multiplier *= functionalMultipliers[functionalLevel as keyof typeof functionalMultipliers] || 1.0;

    const serviceMultipliers = { 
      'C': 0.85, 'D': 0.90, 'E': 0.95, 'F': 1.0, 'G': 1.05, 
      'H': 1.10, 'I': 1.15, 'J': 1.20, 'K': 1.25 
    };
    multiplier *= serviceMultipliers[serviceLevel as keyof typeof serviceMultipliers] || 1.0;

    const comorbidityMultipliers = { 
      'A': 1.0, 'B': 1.08, 'C': 1.16, 'D': 1.24, 'E': 1.32, 'F': 1.40 
    };
    multiplier *= comorbidityMultipliers[comorbidityLevel as keyof typeof comorbidityMultipliers] || 1.0;

    const therapyMultipliers = { 
      'A': 0.95, 'B': 1.0, 'C': 1.05, 'D': 1.10, 'E': 1.15, 'F': 1.20 
    };
    multiplier *= therapyMultipliers[therapyLevel as keyof typeof therapyMultipliers] || 1.0;

    // Calculate final payment
    const payment = Math.round(baseRate * multiplier);

    // Update state
    setCaseMixGroup(finalCaseMixGroup);
    setHippsScore(finalCaseMixGroup);
    setCaseMixPoints(totalHippsPoints);
    setPaymentMultiplier(multiplier);
    setFinalPayment(payment);
  };

  // Calculate HIPPS when codes change
  useEffect(() => {
    calculateHippsCaseMix();
  }, [selectedCodes, primarySuggestions, secondarySuggestions, oasisScore, therapyMinutes]);

  // Helper function to get all active primary codes
  const getActivePrimaryCodes = () => {
    return primarySuggestions.filter(code => 
      !rejectedCodes.has(code.id) && (selectedCodes.has(code.id) || code.isManuallyAdded)
    );
  };

  // Helper function to check if there's exactly one active primary code
  const hasExactlyOneActivePrimaryCode = () => {
    const activePrimaryCodes = getActivePrimaryCodes();
    return activePrimaryCodes.length === 1;
  };

  // Helper function to check if there's an active primary code
  const hasActivePrimaryCode = () => {
    return primarySuggestions.some(code => 
      !rejectedCodes.has(code.id) && (selectedCodes.has(code.id) || code.isManuallyAdded)
    );
  };

  // Helper function to get the current active primary code
  const getActivePrimaryCode = () => {
    return primarySuggestions.find(code => 
      !rejectedCodes.has(code.id) && (selectedCodes.has(code.id) || code.isManuallyAdded)
    );
  };

  // Helper function to normalize order properties
  const normalizeOrders = (codes: CodeSuggestion[]): CodeSuggestion[] => {
    return codes
      .sort((a, b) => a.order - b.order)
      .map((code, index) => ({ ...code, order: index }));
  };

  // Helper function to update code status in suggestions
  const updateCodeStatus = (codeId: string, newStatus: 'accepted' | 'rejected' | 'pending') => {
    setPrimarySuggestions(prev => 
      prev.map(code => 
        code.id === codeId ? { ...code, status: newStatus } : code
      )
    );
    
    setSecondarySuggestions(prev => 
      prev.map(code => 
        code.id === codeId ? { ...code, status: newStatus } : code
      )
    );
  };

  // Enhanced handleAccept with primary code limit enforcement
  const handleAccept = (codeId: string) => {
    const isPrimaryCode = primarySuggestions.some(code => code.id === codeId);
    
    if (isPrimaryCode) {
      const activePrimaryCodes = getActivePrimaryCodes();
      const isThisCodeAlreadyActive = activePrimaryCodes.some(code => code.id === codeId);
      
      if (!isThisCodeAlreadyActive && activePrimaryCodes.length >= 1) {
        setPendingPromotionCodeId(codeId);
        setShowPrimaryPromotionPopup(true);
        return;
      }
    }
    
    setSelectedCodes(prev => new Set([...prev, codeId]));
    setRejectedCodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(codeId);
      return newSet;
    });
    
    updateCodeStatus(codeId, 'accepted');
  };

  const handleReject = (codeId: string) => {
    setRejectedCodes(prev => new Set([...prev, codeId]));
    setSelectedCodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(codeId);
      return newSet;
    });
    
    updateCodeStatus(codeId, 'rejected');
  };

  const toggleExpanded = (codeId: string) => {
    setExpandedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(codeId)) {
        newSet.delete(codeId);
      } else {
        newSet.add(codeId);
      }
      return newSet;
    });
  };

  const undoAccept = (codeId: string) => {
    setSelectedCodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(codeId);
      return newSet;
    });
    
    updateCodeStatus(codeId, 'pending');
  };

  const undoReject = (codeId: string) => {
    setRejectedCodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(codeId);
      return newSet;
    });
    
    updateCodeStatus(codeId, 'pending');
  };

  const removeManuallyAdded = (codeId: string) => {
    setPrimarySuggestions(prev => {
      const filtered = prev.filter(code => code.id !== codeId);
      return normalizeOrders(filtered);
    });
    
    setSecondarySuggestions(prev => {
      const filtered = prev.filter(code => code.id !== codeId);
      return normalizeOrders(filtered);
    });
    
    setSelectedCodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(codeId);
      return newSet;
    });
    
    setRejectedCodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(codeId);
      return newSet;
    });
    
    setComments(prev => {
      const newComments = { ...prev };
      delete newComments[codeId];
      return newComments;
    });
  };

  const moveToSecondary = (codeId: string) => {
    const codeToMove = primarySuggestions.find(code => code.id === codeId);
    if (codeToMove) {
      const newCode = { ...codeToMove, order: 0 };
      setSecondarySuggestions(prev => {
        const newList = [newCode, ...prev];
        return normalizeOrders(newList);
      });
      
      setPrimarySuggestions(prev => {
        const filtered = prev.filter(code => code.id !== codeId);
        return normalizeOrders(filtered);
      });
    }
  };

  const moveToPrimary = (codeId: string) => {
    const activePrimaryCode = getActivePrimaryCode();
    
    if (activePrimaryCode) {
      setPendingPromotionCodeId(codeId);
      setShowPrimaryPromotionPopup(true);
      return;
    }
    
    const codeToMove = secondarySuggestions.find(code => code.id === codeId);
    if (codeToMove) {
      const newCode = { ...codeToMove, order: primarySuggestions.length };
      setPrimarySuggestions(prev => normalizeOrders([...prev, newCode]));
      
      setSecondarySuggestions(prev => {
        const filtered = prev.filter(code => code.id !== codeId);
        return normalizeOrders(filtered);
      });
    }
  };

  // Handle primary promotion popup actions
  const handleDemoteCurrentPrimary = () => {
    const activePrimaryCode = getActivePrimaryCode();
    if (activePrimaryCode && pendingPromotionCodeId) {
      moveToSecondary(activePrimaryCode.id);
      
      const codeToMove = secondarySuggestions.find(code => code.id === pendingPromotionCodeId);
      if (codeToMove) {
        const newCode = { ...codeToMove, order: 0 };
        setPrimarySuggestions(prev => normalizeOrders([newCode]));
        
        setSecondarySuggestions(prev => {
          const filtered = prev.filter(code => code.id !== pendingPromotionCodeId);
          return normalizeOrders(filtered);
        });
      }
    }
    
    setShowPrimaryPromotionPopup(false);
    setPendingPromotionCodeId(null);
  };

  const handleRejectCurrentPrimary = () => {
    const activePrimaryCode = getActivePrimaryCode();
    if (activePrimaryCode && pendingPromotionCodeId) {
      handleReject(activePrimaryCode.id);
      
      const codeToMove = secondarySuggestions.find(code => code.id === pendingPromotionCodeId);
      if (codeToMove) {
        const newCode = { ...codeToMove, order: 0 };
        setPrimarySuggestions(prev => {
          const filtered = prev.filter(code => code.id !== activePrimaryCode.id);
          return normalizeOrders([newCode, ...filtered]);
        });
        
        setSecondarySuggestions(prev => {
          const filtered = prev.filter(code => code.id !== pendingPromotionCodeId);
          return normalizeOrders(filtered);
        });
      }
    }
    
    setShowPrimaryPromotionPopup(false);
    setPendingPromotionCodeId(null);
  };

  const handleAcceptPendingPrimary = () => {
    const activePrimaryCode = getActivePrimaryCode();
    if (activePrimaryCode && pendingPromotionCodeId) {
      handleReject(activePrimaryCode.id);
      
      setSelectedCodes(prev => new Set([...prev, pendingPromotionCodeId]));
      setRejectedCodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(pendingPromotionCodeId);
        return newSet;
      });
      
      updateCodeStatus(pendingPromotionCodeId, 'accepted');
    }
    
    setShowPrimaryPromotionPopup(false);
    setPendingPromotionCodeId(null);
  };

  const handleCancelPromotion = () => {
    setShowPrimaryPromotionPopup(false);
    setPendingPromotionCodeId(null);
  };

  // Handle saving changes to the backend
  const handleSaveChanges = async () => {
    if (!selectedEpisodeDocId) {
      console.error('No episode document ID available for saving');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      // Save the current order and status to the backend
      await saveCodingOrder(selectedEpisodeDocId, primarySuggestions, secondarySuggestions, comments);
      
      setLastSaved(new Date());
      console.log('Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Statistics calculations
  const allCodes = [...primarySuggestions, ...secondarySuggestions];
  const aiCodes = allCodes.filter(code => !code.isManuallyAdded);
  const manualCodes = allCodes.filter(code => code.isManuallyAdded);
  
  const aiSuggestionsCount = aiCodes.length;
  const newlyAddedCount = manualCodes.length;
  const acceptedCount = aiCodes.filter(code => selectedCodes.has(code.id)).length;
  const rejectedCount = aiCodes.filter(code => rejectedCodes.has(code.id)).length;
  const pendingDecisions = aiCodes.filter(code => 
    !selectedCodes.has(code.id) && !rejectedCodes.has(code.id)
  ).length;
  
  const completedDecisions = acceptedCount + rejectedCount;
  const progressPercentage = aiSuggestionsCount > 0 ? (completedDecisions / aiSuggestionsCount) * 100 : 0;
  const totalSuggestions = allCodes.length;

  return {
    // State
    selectedCodes,
    setSelectedCodes,
    rejectedCodes,
    setRejectedCodes,
    expandedCodes,
    comments,
    setComments,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    primarySuggestions,
    setPrimarySuggestions,
    secondarySuggestions,
    setSecondarySuggestions,
    
    // Primary promotion popup state
    showPrimaryPromotionPopup,
    setShowPrimaryPromotionPopup,
    pendingPromotionCodeId,
    setPendingPromotionCodeId,
    
    // HIPPS Scoring Data
    hippsScore,
    caseMixPoints,
    caseMixGroup,
    baseRate,
    paymentMultiplier,
    finalPayment,
    oasisScore,
    therapyMinutes,
    
    // Primary Code Validation
    hasActivePrimaryCode: hasActivePrimaryCode(),
    hasExactlyOneActivePrimaryCode: hasExactlyOneActivePrimaryCode(),
    getActivePrimaryCode,
    getActivePrimaryCodes,
    
    // Actions
    handleAccept,
    handleReject,
    toggleExpanded,
    undoAccept,
    undoReject,
    removeManuallyAdded,
    moveToSecondary,
    moveToPrimary,
    
    // Primary promotion popup actions
    handleDemoteCurrentPrimary,
    handleRejectCurrentPrimary,
    handleAcceptPendingPrimary,
    handleCancelPromotion,
    
    // Save functionality
    handleSaveChanges,
    isSaving,
    saveError,
    lastSaved,
    
    // Statistics
    acceptedCount,
    rejectedCount,
    newlyAddedCount,
    totalSuggestions,
    aiSuggestionsCount,
    completedDecisions,
    pendingDecisions,
    progressPercentage
  };
};