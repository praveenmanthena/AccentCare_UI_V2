export interface Patient {
  id: number;
  patientName: string;
  medicare: string;
  admissionDate: string;
  priority: 'High' | 'Medium' | 'Low';
  documentsReady: boolean;
}

export interface Document {
  id: string;
  name: string;
  type?: string; // Optional as not provided by API
  date?: string; // Optional as not provided by API
  pages: number;
}

export interface DocumentContent {
  title: string;
  imageUrl: string;
  width: number;
  height: number;
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  boundingBox: BoundingBox;
  text: string;
}

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface HighlightedEvidence {
  id: string;
  boundingBox: BoundingBox;
  document: string;
  page: number;
}

export interface ICDCode {
  code: string;
  description: string;
}

export interface SupportingSentence {
  text: string;
  document: string;
  page: number;
  id: string;
  boundingBox?: BoundingBox;
}

export interface CodeSuggestion {
  id: string;
  apiCodeId?: string;
  code: string;
  description: string;
  confidence: number;
  hippsPoints: number;
  status: 'pending' | 'accepted' | 'rejected';
  isHippsContributor: boolean;
  isManuallyAdded?: boolean;
  aiReasoning: string;
  supportingSentences: SupportingSentence[];
  addedTimestamp?: string;
  location?: any;
  order: number;
  // Additional fields from API response
  activeDiseaseAsOfJune2025?: boolean;
  supportingSentenceForActiveDisease?: string;
  activeManagementAsOfJune2025?: boolean;
  supportingSentenceForActiveManagement?: string;
  updatedAt?: string;
  lastReorderedBy?: string;
  consideredButExcluded?: boolean;
  reasonForExclusion?: string;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  user: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

// Document status types for the new dashboard
export type DocStatusType = 'Complete' | 'Incomplete' | 'Inconsistent';

export interface SelectionCoords {
  x: number;
  y: number;
}

export interface SelectedArea extends BoundingBox {
  document: string;
  page: number;
  pixelCoords?: any;
}

// New interface for API response
export interface ProjectData {
  doc_id: string;
  created_date: string;
  status: string;
  document_name: string;
  updated_date: string;
  accept_count: number;
  reject_count: number;
  remaining_count: number;
  review_status: string;
  episode_id: string;
  // Enhanced fields for dashboard display
  revenueRate?: string;
  docStatus?: DocStatusType;
}

export interface ProjectsApiResponse {
  projects: ProjectData[];
}

// New interfaces for files API
export interface FilesApiResponse {
  files: string[];
  presigned_urls: PresignedUrls;
}

export interface PresignedUrls {
  [fileName: string]: {
    [pageNumber: string]: string;
  };
}

// New interfaces for coding results API
export interface ApiSupportingInfo {
  supporting_sentence_in_document: string;
  document_name: string;
  section_name: string;
  page_number: string;
  bbox: number[][];
}

export interface ApiUserDecision {
  status: 'accept' | 'reject';
  decided_at: string;
}

export interface ApiComment {
  comment: string;
  user: string;
  timestamp: string;
  comment_id: string;
}

export interface ApiCodeSuggestion {
  code_id: string;
  rank: number;
  diagnosis_code: string;
  disease_description: string;
  considered_but_excluded: boolean;
  reason_for_exclusion: string;
  supporting_info: ApiSupportingInfo[];
  reason_for_coding: string;
  active_disease_asof_1june2025: boolean;
  supporting_sentence_for_active_disease: string;
  active_management_asof_1june2025: boolean;
  supporting_sentence_for_active_management: string;
  code_type: 'AI_MODEL' | 'HUMAN';
  accept_code?: boolean;
  updated_at: string;
  last_reordered_by: string;
  user_decisions?: Record<string, ApiUserDecision>;
  comments?: ApiComment[];
  deleted?: boolean;
  added_by?: string;
  created_at?: string;
}

export interface ApiReviewStats {
  accept_count: number;
  reject_count: number;
  remaining_count: number;
  review_status: 'IN PROGRESS' | 'COMPLETED' | 'YET TO REVIEW';
}

export interface CodingResultsApiResponse {
  results: {
    primary_codes: ApiCodeSuggestion[];
    secondary_codes: ApiCodeSuggestion[];
  };
  review_stats: ApiReviewStats;
  episode_id: string;
}

// Authentication interfaces
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// PDF Search interfaces
export interface PdfSearchMatch {
  document_name: string;
  page_number: number;
  bbox: number[][];
  text_snippet: string;
  match_score: number;
}

export interface PdfSearchApiResponse {
  document_id: string;
  search_string: string;
  total_matches: number;
  results: PdfSearchMatch[];
}

export interface SearchHighlight {
  id: string;
  boundingBox: BoundingBox;
  document: string;
  page: number;
  textSnippet: string;
  matchScore: number;
}