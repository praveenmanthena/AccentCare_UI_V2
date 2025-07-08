import { CodeSuggestion, ApiSupportingInfo, SupportingSentence, BoundingBox } from '../types';
import { apiClient } from './apiClient';

export interface SaveCodingOrderRequest {
  primary_codes: SaveCodeData[];
  secondary_codes: SaveCodeData[];
}

export interface SaveCodeData {
  code_id: string;
  diagnosis_code: string;
  disease_description: string;
  rank: number;
  accept_code?: boolean; // Optional to allow undefined for pending decisions
  code_type: 'AI_MODEL' | 'HUMAN';
  considered_but_excluded: boolean;
  reason_for_exclusion: string;
  reason_for_coding: string;
  active_disease_asof_1june2025: boolean;
  supporting_sentence_for_active_disease: string;
  active_management_asof_1june2025: boolean;
  supporting_sentence_for_active_management: string;
  supporting_info: ApiSupportingInfo[];
  updated_at?: string;
  last_reordered_by?: string;
  user_decisions?: Record<string, any>;
  comments?: any[];
  deleted?: boolean;
  added_by?: string;
  created_at?: string;
}

// Helper function to convert BoundingBox back to bbox array format
const convertBoundingBoxToBbox = (boundingBox: BoundingBox): number[][] => {
  // Convert normalized coordinates back to 8-element array format
  // bbox format: [[min_x, min_y, max_x, min_y, max_x, max_y, min_x, max_y]]
  return [[
    boundingBox.x_min,
    boundingBox.y_min,
    boundingBox.x_max,
    boundingBox.y_min,
    boundingBox.x_max,
    boundingBox.y_max,
    boundingBox.x_min,
    boundingBox.y_max
  ]];
};

// Helper function to transform SupportingSentence back to ApiSupportingInfo
const transformSupportingSentenceToApiSupportingInfo = (sentence: SupportingSentence): ApiSupportingInfo => {
  return {
    supporting_sentence_in_document: sentence.text,
    document_name: sentence.document,
    section_name: '', // Default empty as not stored in frontend
    page_number: sentence.page.toString(),
    bbox: sentence.boundingBox ? convertBoundingBoxToBbox(sentence.boundingBox) : []
  };
};

// Transform CodeSuggestion to SaveCodeData format
const transformCodeSuggestionToSaveData = (code: CodeSuggestion): SaveCodeData => {
  // Determine accept_code based on status and manual addition
  let acceptCode: boolean | undefined;
  if (code.status === 'accepted' || code.isManuallyAdded) {
    acceptCode = true;
  } else if (code.status === 'rejected') {
    acceptCode = false;
  } else {
    // For pending decisions, leave undefined (will be null in JSON)
    acceptCode = undefined;
  }

  // Transform supporting sentences back to API format
  const supportingInfo = code.supportingSentences.map(transformSupportingSentenceToApiSupportingInfo);

  return {
    code_id: code.apiCodeId || code.id,
    diagnosis_code: code.code,
    disease_description: code.description,
    rank: code.status === 'rejected' ? -1 : code.order + 1, // Convert 0-based to 1-based, -1 for rejected
    accept_code: acceptCode,
    code_type: code.isManuallyAdded ? 'HUMAN' : 'AI_MODEL',
    considered_but_excluded: code.consideredButExcluded || (code.status === 'rejected'),
    reason_for_exclusion: code.reasonForExclusion || (code.status === 'rejected' ? 'Rejected by coder' : ''),
    reason_for_coding: code.aiReasoning,
    active_disease_asof_1june2025: code.activeDiseaseAsOfJune2025 ?? true,
    supporting_sentence_for_active_disease: code.supportingSentenceForActiveDisease || code.supportingSentences[0]?.text || '',
    active_management_asof_1june2025: code.activeManagementAsOfJune2025 ?? true,
    supporting_sentence_for_active_management: code.supportingSentenceForActiveManagement || code.aiReasoning,
    supporting_info: supportingInfo,
    updated_at: code.updatedAt,
    last_reordered_by: code.lastReorderedBy,
    user_decisions: undefined, // Will be managed by backend
    comments: undefined, // Will be managed by backend
    deleted: false,
    added_by: code.isManuallyAdded ? 'coder' : undefined,
    created_at: code.addedTimestamp ? new Date(code.addedTimestamp).toISOString() : undefined
  };
};

export const saveCodingOrder = async (
  docId: string, 
  primaryCodes: CodeSuggestion[], 
  secondaryCodes: CodeSuggestion[]
): Promise<void> => {
  try {
    // Transform codes to API format
    const primaryCodesData = primaryCodes.map(transformCodeSuggestionToSaveData);
    const secondaryCodesData = secondaryCodes.map(transformCodeSuggestionToSaveData);

    const requestBody: SaveCodingOrderRequest = {
      primary_codes: primaryCodesData,
      secondary_codes: secondaryCodesData
    };

    console.log('Saving coding order with payload:', JSON.stringify(requestBody, null, 2));

    await apiClient.patch(`/coding-results/${docId}`, requestBody);

    console.log('Coding order saved successfully');
  } catch (error) {
    console.error('Error saving coding order:', error);
    throw error;
  }
};