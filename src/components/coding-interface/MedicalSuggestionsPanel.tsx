import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle,
  ChevronDown,
  Info,
  MessageSquare,
  Plus,
  Save,
  Search,
  Shield,
  Star,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { CodeSuggestion as CodeSuggestionType } from "../../types";
import { HippsDetailsModal } from "../hipps/HippsDetailsModal";
import { CodeSuggestion } from "../medical-suggestions/CodeSuggestion";
import { DraggableCodeSuggestion } from "../medical-suggestions/DraggableCodeSuggestion";

interface MedicalSuggestionsPanelProps {
  codingState: any; // Type this properly based on your useCodingState return type
  icdSearch: any; // Type this properly based on your useICDSearch return type
  getFilteredCodes: () => CodeSuggestionType[];
  commentEditMode: Set<string>;
  tempComments: Record<string, string>;
  isAddingComment: Set<string>;
  onStartAddingComment: (codeId: string) => void;
  onStartEditingComment: (codeId: string, commentId: string) => void;
  onSubmitNewComment: (codeId: string) => void;
  onSubmitEditComment: (codeId: string, commentId: string) => void;
  onCancelNewComment: (codeId: string) => void;
  onCancelEditComment: (codeId: string, commentId: string) => void;
  onCommentChange: (key: string, value: string, cursorPosition: number) => void;
  onNavigateToEvidence: (evidence: any) => void;
  onReturnToDashboard: () => void;
}

export const MedicalSuggestionsPanel: React.FC<
  MedicalSuggestionsPanelProps
> = ({
  codingState,
  icdSearch,
  getFilteredCodes,
  commentEditMode,
  tempComments,
  isAddingComment,
  onStartAddingComment,
  onStartEditingComment,
  onSubmitNewComment,
  onSubmitEditComment,
  onCancelNewComment,
  onCancelEditComment,
  onCommentChange,
  onNavigateToEvidence,
  onReturnToDashboard,
}) => {
  // State for HIPPS modal
  const [showHippsModal, setShowHippsModal] = useState(false);

  // State for drag and drop info tooltip
  const [showDragDropInfo, setShowDragDropInfo] = useState(false);

  // dnd-kit state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedSuggestion, setDraggedSuggestion] =
    useState<CodeSuggestionType | null>(null);

  // Configure sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
      },
    })
  );

  // Get current active primary codes for popup display
  const activePrimaryCodes = codingState.getActivePrimaryCodes();
  const activePrimaryCode = activePrimaryCodes[0]; // Get the first (should be only one)
  const pendingCode = codingState.secondarySuggestions.find(
    (code: any) => code.id === codingState.pendingPromotionCodeId
  );

  // Helper function to find suggestion by ID
  const findSuggestion = (id: string) => {
    const primary = codingState.primarySuggestions.find(
      (s: any) => s.id === id
    );
    if (primary) return { suggestion: primary, container: "primary" };

    const secondary = codingState.secondarySuggestions.find(
      (s: any) => s.id === id
    );
    if (secondary) return { suggestion: secondary, container: "secondary" };

    return null;
  };

  // dnd-kit drag start handler
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    const found = findSuggestion(active.id as string);
    if (found) {
      setDraggedSuggestion(found.suggestion);
    }
  };

  // dnd-kit drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setDraggedSuggestion(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
      setActiveId(null);
      setDraggedSuggestion(null);
      return;
    }

    // Find the containers for both items
    const activeContainer = codingState.primarySuggestions.find(
      (s: any) => s.id === activeId
    )
      ? "primary"
      : "secondary";
    const overContainer = codingState.primarySuggestions.find(
      (s: any) => s.id === overId
    )
      ? "primary"
      : "secondary";

    if (activeContainer === overContainer) {
      // Same container reordering
      if (activeContainer === "primary") {
        codingState.setPrimarySuggestions((prev: any) => {
          const oldIndex = prev.findIndex((item: any) => item.id === activeId);
          const newIndex = prev.findIndex((item: any) => item.id === overId);
          const reordered = arrayMove(prev, oldIndex, newIndex);
          return reordered.map((code: any, index: number) => ({
            ...code,
            order: index,
          }));
        });
      } else {
        codingState.setSecondarySuggestions((prev: any) => {
          const oldIndex = prev.findIndex((item: any) => item.id === activeId);
          const newIndex = prev.findIndex((item: any) => item.id === overId);
          const reordered = arrayMove(prev, oldIndex, newIndex);
          return reordered.map((code: any, index: number) => ({
            ...code,
            order: index,
          }));
        });
      }
    } else {
      // Cross-container movement
      const sourceList =
        activeContainer === "primary"
          ? codingState.primarySuggestions
          : codingState.secondarySuggestions;
      const targetList =
        overContainer === "primary"
          ? codingState.primarySuggestions
          : codingState.secondarySuggestions;
      const setSourceList =
        activeContainer === "primary"
          ? codingState.setPrimarySuggestions
          : codingState.setSecondarySuggestions;
      const setTargetList =
        overContainer === "primary"
          ? codingState.setPrimarySuggestions
          : codingState.setSecondarySuggestions;

      const activeItem = sourceList.find((item: any) => item.id === activeId);
      if (!activeItem) {
        setActiveId(null);
        setDraggedSuggestion(null);
        return;
      }

      // Check for primary code conflicts when moving to primary
      if (overContainer === "primary" && codingState.hasActivePrimaryCode) {
        // Show popup for conflict resolution
        codingState.setPendingPromotionCodeId(activeId);
        codingState.setShowPrimaryPromotionPopup(true);
        setActiveId(null);
        setDraggedSuggestion(null);
        return;
      }

      // Remove from source
      const newSourceList = sourceList.filter(
        (item: any) => item.id !== activeId
      );

      // Add to target at the position of the over item
      const overIndex = targetList.findIndex((item: any) => item.id === overId);
      const newTargetList = [...targetList];
      newTargetList.splice(overIndex, 0, activeItem);

      setSourceList(
        newSourceList.map((code: any, index: number) => ({
          ...code,
          order: index,
        }))
      );
      setTargetList(
        newTargetList.map((code: any, index: number) => ({
          ...code,
          order: index,
        }))
      );
    }

    setActiveId(null);
    setDraggedSuggestion(null);
  };

  // Check if saving and completing is allowed
  const canSave = true; // Always allow saving
  const canComplete =
    codingState.pendingDecisions === 0 &&
    codingState.hasExactlyOneActivePrimaryCode;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-800">
              Medical Suggestions
            </h2>

            {/* Drag & Drop Info Button */}
            <div className="relative">
              <button
                onClick={() => setShowDragDropInfo(!showDragDropInfo)}
                className="p-1.5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all duration-200 flex items-center justify-center"
                title="Drag & Drop Information"
              >
                <Info className="w-4 h-4" />
              </button>

              {/* Drag & Drop Info Tooltip */}
              {showDragDropInfo && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      Drag & Drop Re-ranking
                    </h3>
                    <button
                      onClick={() => setShowDragDropInfo(false)}
                      className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <ChevronDown className="w-3 h-3 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          Reordering
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                          Drag codes to reorder them within Primary or Secondary
                          sections.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          Cross-Section Movement
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                          Drag codes between <strong>Primary</strong> and{" "}
                          <strong>Secondary</strong> sections to change their
                          classification.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">
                        💡 <strong>Tip:</strong> Use the grip handle (⋮⋮) to
                        drag codes around.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* HIPPS Details and Save Button */}
          <div className="flex items-center gap-3">
            {/* HIPPS Details Button */}

            {/* Save Button - Always Enabled */}
            <button
              onClick={codingState.handleSaveChanges}
              disabled={codingState.isSaving}
              className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${
                codingState.isSaving
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <Save
                className={`w-4 h-4 ${
                  codingState.isSaving ? "animate-spin" : ""
                }`}
              />
              {codingState.isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Decision Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500">
              Decision Progress
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {codingState.completedDecisions} of{" "}
                {codingState.aiSuggestionsCount} recommendations completed
              </span>
              {codingState.lastSaved && (
                <span className="text-xs text-green-600 font-medium">
                  Last saved: {codingState.lastSaved.toLocaleTimeString()}
                </span>
              )}
              {codingState.saveError && (
                <span className="text-xs text-red-600 font-medium">
                  Save failed: {codingState.saveError}
                </span>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${codingState.progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Search Box */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search ICD codes"
              value={codingState.searchTerm}
              onChange={(e) => codingState.setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* 4-Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => codingState.setActiveTab("all")}
            className={`flex-1 px-3 py-2 text-sm font-bold rounded-md transition-colors ${
              codingState.activeTab === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ICD List
            <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">
              {codingState.primarySuggestions.filter(
                (code: any) => !codingState.rejectedCodes.has(code.id)
              ).length +
                codingState.secondarySuggestions.filter(
                  (code: any) => !codingState.rejectedCodes.has(code.id)
                ).length}
            </span>
          </button>
          <button
            onClick={() => codingState.setActiveTab("accepted")}
            className={`flex-1 px-3 py-2 text-sm font-bold rounded-md transition-colors ${
              codingState.activeTab === "accepted"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Accepted
            <span className="ml-1 px-2 py-0.5 bg-green-200 text-green-700 rounded-full text-xs font-bold">
              {codingState.acceptedCount}
            </span>
          </button>
          <button
            onClick={() => codingState.setActiveTab("rejected")}
            className={`flex-1 px-3 py-2 text-sm font-bold rounded-md transition-colors ${
              codingState.activeTab === "rejected"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Rejected
            <span className="ml-1 px-2 py-0.5 bg-red-200 text-red-700 rounded-full text-xs font-bold">
              {codingState.rejectedCount}
            </span>
          </button>
          <button
            onClick={() => codingState.setActiveTab("newly-added")}
            className={`flex-1 px-3 py-2 text-sm font-bold rounded-md transition-colors ${
              codingState.activeTab === "newly-added"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Newly Added
            <span className="ml-1 px-2 py-0.5 bg-blue-200 text-blue-700 rounded-full text-xs font-bold">
              {codingState.newlyAddedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Legend Section */}
      <div className="mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mt-2">
        <div className="flex items-center justify-between">
          {/* Right side: Status Legend */}
          <div className="flex items-center gap-4 ">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                {codingState.primarySuggestions.filter(
                  (code: any) => !codingState.rejectedCodes.has(code.id)
                ).length +
                  codingState.secondarySuggestions.filter(
                    (code: any) => !codingState.rejectedCodes.has(code.id)
                  ).length}{" "}
                AI recommendations
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  {codingState.acceptedCount} Accepted
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  {codingState.rejectedCount} Rejected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  {codingState.newlyAddedCount} Newly Added
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {/* Render suggestions based on active tab */}
        {codingState.activeTab === "all" &&
        codingState.searchTerm.length < 2 ? (
          <>
            {/* Primary Suggestions - Green Background Section */}
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-green-800">
                    Primary ICD Suggestions (
                    {
                      codingState.primarySuggestions.filter(
                        (code: any) => !codingState.rejectedCodes.has(code.id)
                      ).length
                    }
                    )
                  </h3>
                </div>
                <button
                  onClick={() =>
                    icdSearch.startAddingICD(
                      "primary",
                      codingState.hasActivePrimaryCode
                    )
                  }
                  className={`px-4 py-2 text-sm font-bold transition-all duration-200 flex items-center gap-2 rounded-lg ${
                    codingState.hasActivePrimaryCode
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : icdSearch.isAddingICD
                      ? "bg-green-500 text-white opacity-50 scale-95"
                      : "bg-green-600 text-white hover:bg-green-700 opacity-100 scale-100"
                  }`}
                  disabled={
                    icdSearch.isAddingICD || codingState.hasActivePrimaryCode
                  }
                  title={
                    codingState.hasActivePrimaryCode
                      ? "Cannot add multiple primary codes. Demote or reject the current primary code first."
                      : "Add new primary ICD code"
                  }
                >
                  <Plus className="w-4 h-4" />
                  Add ICD Code
                </button>
              </div>

              <SortableContext
                items={codingState.primarySuggestions
                  .filter(
                    (code: any) => !codingState.rejectedCodes.has(code.id)
                  )
                  .map((code: any) => code.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {codingState.primarySuggestions
                    .filter(
                      (code: any) => !codingState.rejectedCodes.has(code.id)
                    )
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((suggestion: any, index: number) => (
                      <DraggableCodeSuggestion
                        key={suggestion.id}
                        suggestion={suggestion}
                        index={index}
                        isPrimary={true}
                        showUndo={false}
                        undoAction={null}
                        showMoveActions={true}
                        isAccepted={codingState.selectedCodes.has(
                          suggestion.id
                        )}
                        isRejected={codingState.rejectedCodes.has(
                          suggestion.id
                        )}
                        isExpanded={codingState.expandedCodes.has(
                          suggestion.id
                        )}
                        existingComments={
                          codingState.comments[suggestion.id] || []
                        }
                        isAddingNewComment={isAddingComment.has(suggestion.id)}
                        commentEditMode={commentEditMode}
                        tempComments={tempComments}
                        onAccept={codingState.handleAccept}
                        onReject={codingState.handleReject}
                        onToggleExpanded={codingState.toggleExpanded}
                        onStartAddingComment={onStartAddingComment}
                        onStartEditingComment={onStartEditingComment}
                        onSubmitNewComment={onSubmitNewComment}
                        onSubmitEditComment={onSubmitEditComment}
                        onCancelNewComment={onCancelNewComment}
                        onCancelEditComment={onCancelEditComment}
                        onCommentChange={onCommentChange}
                        onNavigateToEvidence={onNavigateToEvidence}
                        onMoveToSecondary={codingState.moveToSecondary}
                      />
                    ))}
                </div>
              </SortableContext>
            </div>

            {/* Secondary Suggestions - Blue Background Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-blue-800">
                    Secondary ICD Suggestions (
                    {
                      codingState.secondarySuggestions.filter(
                        (code: any) => !codingState.rejectedCodes.has(code.id)
                      ).length
                    }
                    )
                  </h3>
                </div>
                <button
                  onClick={() => icdSearch.startAddingICD("secondary")}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                    icdSearch.isAddingICD
                      ? "opacity-50 scale-95"
                      : "opacity-100 scale-100"
                  }`}
                  disabled={icdSearch.isAddingICD}
                >
                  <Plus className="w-4 h-4" />
                  Add ICD Code
                </button>
              </div>

              <SortableContext
                items={codingState.secondarySuggestions
                  .filter(
                    (code: any) => !codingState.rejectedCodes.has(code.id)
                  )
                  .map((code: any) => code.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {codingState.secondarySuggestions
                    .filter(
                      (code: any) => !codingState.rejectedCodes.has(code.id)
                    )
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((suggestion: any, index: number) => (
                      <DraggableCodeSuggestion
                        key={suggestion.id}
                        suggestion={suggestion}
                        index={index}
                        isPrimary={false}
                        showUndo={false}
                        undoAction={null}
                        showMoveActions={true}
                        isAccepted={codingState.selectedCodes.has(
                          suggestion.id
                        )}
                        isRejected={codingState.rejectedCodes.has(
                          suggestion.id
                        )}
                        isExpanded={codingState.expandedCodes.has(
                          suggestion.id
                        )}
                        existingComments={
                          codingState.comments[suggestion.id] || []
                        }
                        isAddingNewComment={isAddingComment.has(suggestion.id)}
                        commentEditMode={commentEditMode}
                        tempComments={tempComments}
                        onAccept={codingState.handleAccept}
                        onReject={codingState.handleReject}
                        onToggleExpanded={codingState.toggleExpanded}
                        onStartAddingComment={onStartAddingComment}
                        onStartEditingComment={onStartEditingComment}
                        onSubmitNewComment={onSubmitNewComment}
                        onSubmitEditComment={onSubmitEditComment}
                        onCancelNewComment={onCancelNewComment}
                        onCancelEditComment={onCancelEditComment}
                        onCommentChange={onCommentChange}
                        onNavigateToEvidence={onNavigateToEvidence}
                        onMoveToPrimary={codingState.moveToPrimary}
                      />
                    ))}
                </div>
              </SortableContext>

              {/* Complete Episode Button - After Secondary Codes */}
              <div className="mt-6 pt-4 border-t border-blue-200">
                {/* Primary Code Warning - Show when no primary code OR multiple primary codes */}
                {!codingState.hasExactlyOneActivePrimaryCode && (
                  <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <p className="text-sm text-orange-800 font-medium">
                      {!codingState.hasActivePrimaryCode
                        ? "A primary diagnosis code is required before completing the episode."
                        : "Only one primary diagnosis code is allowed. Please ensure exactly one primary code is accepted."}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    className={`px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${
                      canComplete
                        ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!canComplete}
                    onClick={canComplete ? onReturnToDashboard : undefined}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete Episode
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Filtered Views */
          <div className="space-y-3">
            {/* Header for filtered view */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 capitalize">
                {codingState.activeTab === "newly-added"
                  ? "Newly Added"
                  : codingState.activeTab}{" "}
                Codes
              </h3>
              <span className="text-sm font-semibold text-gray-600">
                {getFilteredCodes().length} codes
              </span>
            </div>

            {/* Show filtered codes */}
            {getFilteredCodes().length > 0 ? (
              getFilteredCodes().map((suggestion, index) => (
                <CodeSuggestion
                  key={suggestion.id}
                  suggestion={suggestion}
                  index={index}
                  isPrimary={codingState.primarySuggestions.some(
                    (s: any) => s.id === suggestion.id
                  )}
                  showUndo={true}
                  undoAction={
                    codingState.activeTab === "accepted"
                      ? codingState.undoAccept
                      : codingState.activeTab === "rejected"
                      ? codingState.undoReject
                      : codingState.activeTab === "newly-added"
                      ? codingState.removeManuallyAdded
                      : null
                  }
                  showMoveActions={false}
                  isAccepted={codingState.selectedCodes.has(suggestion.id)}
                  isRejected={codingState.rejectedCodes.has(suggestion.id)}
                  isExpanded={codingState.expandedCodes.has(suggestion.id)}
                  existingComments={codingState.comments[suggestion.id] || []}
                  isAddingNewComment={isAddingComment.has(suggestion.id)}
                  commentEditMode={commentEditMode}
                  tempComments={tempComments}
                  onAccept={codingState.handleAccept}
                  onReject={codingState.handleReject}
                  onToggleExpanded={codingState.toggleExpanded}
                  onStartAddingComment={onStartAddingComment}
                  onStartEditingComment={onStartEditingComment}
                  onSubmitNewComment={onSubmitNewComment}
                  onSubmitEditComment={onSubmitEditComment}
                  onCancelNewComment={onCancelNewComment}
                  onCancelEditComment={onCancelEditComment}
                  onCommentChange={onCommentChange}
                  onNavigateToEvidence={onNavigateToEvidence}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-semibold">No codes found</p>
                <p className="text-sm font-medium">
                  {codingState.searchTerm.length >= 2
                    ? `No codes match "${codingState.searchTerm}"`
                    : `No ${codingState.activeTab} codes yet`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && draggedSuggestion ? (
          <div className="opacity-60">
            <CodeSuggestion
              suggestion={draggedSuggestion}
              index={0}
              isPrimary={codingState.primarySuggestions.some(
                (s: any) => s.id === activeId
              )}
              showUndo={false}
              undoAction={null}
              showMoveActions={false}
              isAccepted={codingState.selectedCodes.has(draggedSuggestion.id)}
              isRejected={codingState.rejectedCodes.has(draggedSuggestion.id)}
              isExpanded={false}
              existingComments={[]}
              isAddingNewComment={false}
              commentEditMode={new Set()}
              tempComments={{}}
              onAccept={() => {}}
              onReject={() => {}}
              onToggleExpanded={() => {}}
              onStartAddingComment={() => {}}
              onStartEditingComment={() => {}}
              onSubmitNewComment={() => {}}
              onSubmitEditComment={() => {}}
              onCancelNewComment={() => {}}
              onCancelEditComment={() => {}}
              onCommentChange={() => {}}
              onNavigateToEvidence={() => {}}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* HIPPS Details Modal */}
      <HippsDetailsModal
        isOpen={showHippsModal}
        onClose={() => setShowHippsModal(false)}
        hippsScore={codingState.hippsScore}
        caseMixPoints={codingState.caseMixPoints}
        caseMixGroup={codingState.caseMixGroup}
        baseRate={codingState.baseRate}
        paymentMultiplier={codingState.paymentMultiplier}
        finalPayment={codingState.finalPayment}
        oasisScore={codingState.oasisScore}
        therapyMinutes={codingState.therapyMinutes}
      />

      {/* Primary Code Conflict Popup */}
      {icdSearch.showPrimaryConflictPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-sans">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  Cannot Add Primary Code
                </h2>
              </div>
              <button
                onClick={icdSearch.handleClosePrimaryConflictPopup}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800 font-medium mb-3">
                  You already have an active primary diagnosis code. Only one
                  primary diagnosis is allowed per episode.
                </p>

                {activePrimaryCode && (
                  <div className="bg-white border border-orange-200 rounded-lg p-3">
                    <h4 className="text-sm font-bold text-gray-800 mb-2">
                      Current Primary Diagnosis:
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-green-600 text-white rounded text-sm font-bold">
                        {activePrimaryCode.code}
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {activePrimaryCode.description}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  To add a new primary diagnosis, you must first:
                </p>

                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>
                      <strong>Demote</strong> the current primary to secondary,
                      or
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>
                      <strong>Reject</strong> the current primary diagnosis
                    </span>
                  </li>
                </ul>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">
                    💡 <strong>Tip:</strong> You can use the arrow buttons on
                    the current primary code to demote it to secondary, or use
                    the reject button to remove it entirely.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={icdSearch.handleClosePrimaryConflictPopup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Promotion Popup */}
      {codingState.showPrimaryPromotionPopup && activePrimaryCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-sans">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  Primary Code Conflict
                </h2>
              </div>
              <button
                onClick={codingState.handleCancelPromotion}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800 font-medium mb-3">
                  {pendingCode
                    ? "You're trying to promote a secondary diagnosis to primary, but there's already an active primary diagnosis."
                    : "You're trying to accept a primary diagnosis, but there's already an active primary diagnosis."}{" "}
                  Only one primary diagnosis is allowed at a time.
                </p>

                {/* Current Primary Code */}
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-800 mb-2">
                    Current Primary Diagnosis:
                  </h4>
                  <div className="bg-white border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-green-600 text-white rounded text-sm font-bold">
                        {activePrimaryCode.code}
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {activePrimaryCode.description}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pending Code */}
                {pendingCode && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-2">
                      Code to Promote:
                    </h4>
                    <div className="bg-white border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm font-bold">
                          {pendingCode.code}
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          {pendingCode.description}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  To proceed, you need to handle the current primary diagnosis
                  first:
                </p>

                {/* Action Options */}
                <div className="space-y-2">
                  {pendingCode && (
                    <button
                      onClick={codingState.handleDemoteCurrentPrimary}
                      className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <ArrowDown className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-blue-800">
                          Demote to Secondary
                        </div>
                        <div className="text-sm text-blue-600">
                          Move current primary to secondary and promote the
                          selected code
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={
                      pendingCode
                        ? codingState.handleRejectCurrentPrimary
                        : codingState.handleAcceptPendingPrimary
                    }
                    className="w-full flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-red-800">
                        Reject Current Primary
                      </div>
                      <div className="text-sm text-red-600">
                        {pendingCode
                          ? "Reject current primary and promote the selected code"
                          : "Reject current primary and accept the new primary code"}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={codingState.handleCancelPromotion}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};
