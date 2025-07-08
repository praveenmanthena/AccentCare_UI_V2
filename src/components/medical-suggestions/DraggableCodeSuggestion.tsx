import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CodeSuggestion } from './CodeSuggestion';
import { CodeSuggestion as CodeSuggestionType, Comment } from '../../types';

interface DraggableCodeSuggestionProps {
  suggestion: CodeSuggestionType;
  index: number;
  isPrimary?: boolean;
  showUndo?: boolean;
  undoAction?: ((codeId: string) => void) | null;
  showMoveActions?: boolean;
  isAccepted: boolean;
  isRejected: boolean;
  isExpanded: boolean;
  existingComments: Comment[];
  isAddingNewComment: boolean;
  commentEditMode: Set<string>;
  tempComments: Record<string, string>;
  onAccept: (codeId: string) => void;
  onReject: (codeId: string) => void;
  onToggleExpanded: (codeId: string) => void;
  onStartAddingComment: (codeId: string) => void;
  onStartEditingComment: (codeId: string, commentId: string) => void;
  onSubmitNewComment: (codeId: string) => void;
  onSubmitEditComment: (codeId: string, commentId: string) => void;
  onCancelNewComment: (codeId: string) => void;
  onCancelEditComment: (codeId: string, commentId: string) => void;
  onCommentChange: (key: string, value: string, cursorPosition: number) => void;
  onNavigateToEvidence: (evidence: any) => void;
  onMoveToSecondary?: (codeId: string) => void;
  onMoveToPrimary?: (codeId: string) => void;
}

export const DraggableCodeSuggestion: React.FC<DraggableCodeSuggestionProps> = ({
  suggestion,
  index,
  isPrimary = false,
  showUndo = false,
  undoAction = null,
  showMoveActions = false,
  isAccepted,
  isRejected,
  isExpanded,
  existingComments,
  isAddingNewComment,
  commentEditMode,
  tempComments,
  onAccept,
  onReject,
  onToggleExpanded,
  onStartAddingComment,
  onStartEditingComment,
  onSubmitNewComment,
  onSubmitEditComment,
  onCancelNewComment,
  onCancelEditComment,
  onCommentChange,
  onNavigateToEvidence,
  onMoveToSecondary,
  onMoveToPrimary
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: suggestion.id,
    disabled: showUndo, // Disable dragging in filtered views
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CodeSuggestion
        suggestion={suggestion}
        index={index}
        isPrimary={isPrimary}
        showUndo={showUndo}
        undoAction={undoAction}
        showMoveActions={showMoveActions}
        isAccepted={isAccepted}
        isRejected={isRejected}
        isExpanded={isExpanded}
        existingComments={existingComments}
        isAddingNewComment={isAddingNewComment}
        commentEditMode={commentEditMode}
        tempComments={tempComments}
        onAccept={onAccept}
        onReject={onReject}
        onToggleExpanded={onToggleExpanded}
        onStartAddingComment={onStartAddingComment}
        onStartEditingComment={onStartEditingComment}
        onSubmitNewComment={onSubmitNewComment}
        onSubmitEditComment={onSubmitEditComment}
        onCancelNewComment={onCancelNewComment}
        onCancelEditComment={onCancelEditComment}
        onCommentChange={onCommentChange}
        onNavigateToEvidence={onNavigateToEvidence}
        onMoveToSecondary={onMoveToSecondary}
        onMoveToPrimary={onMoveToPrimary}
        // Pass drag handle props
        dragHandleProps={showUndo ? undefined : { ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
};