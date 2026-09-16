/**
 * Round-2 Intelligence Type Contracts
 *
 * These types define the data shapes that the future backend will provide.
 * Stage 1: UI shell only — no values are computed or fabricated here.
 * All fields are optional/nullable to handle states where backend data
 * is not yet available.
 */

// ─── Data Availability State ─────────────────────────────────────────────────

export type DataAvailability =
  | 'AVAILABLE'
  | 'PROCESSING'
  | 'NOT_AVAILABLE'
  | 'FAILED'
  | 'PARTIAL';

// ─── Document Quality ─────────────────────────────────────────────────────────

export type QualityStatus = 'AVAILABLE' | 'PROCESSING' | 'NOT_AVAILABLE' | 'FAILED';

export interface DocumentQualityMetric {
  label: string;
  score?: number; // 0–100, provided by backend
  status: DataAvailability;
}

export interface DocumentQuality {
  status: QualityStatus;
  overallScore?: number; // 0–100
  clarity?: DocumentQualityMetric;
  contrast?: DocumentQualityMetric;
  noise?: DocumentQualityMetric;
  skew?: DocumentQualityMetric;
  visibility?: DocumentQualityMetric;
  damage?: DocumentQualityMetric;
  hasHandwriting?: boolean;
  qualityWarnings?: string[];
}

// ─── Document Classification ─────────────────────────────────────────────────

export type DocumentTypeLabel =
  | '7/12 Extract'
  | 'Khatauni'
  | 'Satbara'
  | 'Mutation Record'
  | 'Sale Deed'
  | 'Ownership Record'
  | 'Handwritten Register'
  | 'Cadastral Map'
  | 'Legacy Register'
  | 'Other';

export interface DocumentClassification {
  status: DataAvailability;
  documentType?: DocumentTypeLabel;
  detectedTemplate?: string;
  script?: string;
  language?: string;
  confidence?: number; // 0–100, backend-provided
}

// ─── Page-Level Status ───────────────────────────────────────────────────────

export type PageProcessingStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

export interface PageInfo {
  pageNumber: number;
  processingStatus: PageProcessingStatus;
  hasWarnings?: boolean;
  warningMessages?: string[];
  thumbnailUrl?: string;
}

// ─── OCR Evidence ─────────────────────────────────────────────────────────────

export interface OCREvidence {
  status: DataAvailability;
  sourcePage?: number;
  sourceRegion?: [number, number, number, number]; // bounding box [x, y, w, h]
  ocrText?: string;
  confidence?: number; // 0–100
  language?: string;
  script?: string;
  linkedFieldName?: string;
}

// ─── Layout / Extraction Evidence ────────────────────────────────────────────

export type LayoutRegionType =
  | 'header'
  | 'label-value'
  | 'table'
  | 'row'
  | 'column'
  | 'paragraph';

export interface LayoutEvidence {
  status: DataAvailability;
  page?: number;
  region?: [number, number, number, number]; // bounding box
  label?: string;
  extractedText?: string;
  regionType?: LayoutRegionType;
  confidence?: number; // 0–100
  linkedFieldName?: string;
}

// ─── Normalization ────────────────────────────────────────────────────────────

export type NormalizationStatus =
  | 'NORMALIZED'
  | 'NOT_NORMALIZED'
  | 'WARNING'
  | 'UNAVAILABLE';

export interface NormalizationInfo {
  status: NormalizationStatus;
  originalValue?: string;
  normalizedValue?: string;
  normalizationRule?: string; // e.g. "Devanagari numeral + area unit normalization"
}

// ─── Master-Data Verification ─────────────────────────────────────────────────

export type MasterDataMatchState =
  | 'MATCH'
  | 'PARTIAL_MATCH'
  | 'MISMATCH'
  | 'NOT_CHECKED'
  | 'UNAVAILABLE';

export interface MasterDataFieldMatch {
  fieldLabel: string;
  extractedValue?: string;
  referenceValue?: string;
  matchState: MasterDataMatchState;
}

export interface MasterDataMatch {
  status: DataAvailability;
  overallMatchState?: MasterDataMatchState;
  referenceSource?: string;
  fields?: MasterDataFieldMatch[];
  verifiedAt?: string;
}

// ─── Duplicate Detection ──────────────────────────────────────────────────────

export type DuplicateStatus =
  | 'NO_DUPLICATE'
  | 'POTENTIAL_DUPLICATE'
  | 'CONFIRMED_DUPLICATE'
  | 'NOT_CHECKED'
  | 'UNAVAILABLE';

export interface DuplicateCandidate {
  status: DuplicateStatus;
  candidateCount?: number;
  matchStrength?: number; // 0–100
  matchedRecordId?: string;
  matchedSurveyNumber?: string;
  matchedOwner?: string;
  explanation?: string;
}

// ─── Conflict / Anomaly Detection ────────────────────────────────────────────

export type ConflictType =
  | 'AREA_MISMATCH'
  | 'OWNER_MISMATCH'
  | 'SURVEY_CONFLICT'
  | 'CROSS_FIELD_INCONSISTENCY'
  | 'SPATIAL_INCONSISTENCY'
  | 'DUPLICATE_CANDIDATE'
  | 'OTHER';

export type ConflictResolutionState =
  | 'UNRESOLVED'
  | 'RESOLVED'
  | 'IGNORED'
  | 'ESCALATED';

export type ConflictSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface RecordConflict {
  id: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  affectedField?: string;
  conflictingValues?: { extracted?: string; reference?: string };
  source?: string;
  explanation?: string;
  resolutionState: ConflictResolutionState;
}

export interface ConflictSummary {
  status: DataAvailability;
  conflicts?: RecordConflict[];
}

// ─── Record Risk ──────────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NOT_AVAILABLE';

export interface RecordRisk {
  status: DataAvailability;
  riskLevel?: RiskLevel;
  riskScore?: number; // 0–100
  riskFactors?: string[];
  criticalIssueCount?: number;
  requiresReview?: boolean;
}

// ─── Review Routing ───────────────────────────────────────────────────────────

export type ReviewPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface ReviewRouting {
  status: DataAvailability;
  reviewRequired?: boolean;
  routingReason?: string;
  additionalReasons?: string[];
  priority?: ReviewPriority;
  reviewerRole?: string;
  jurisdiction?: string;
  criticalField?: string;
  routingRule?: string;
  estimatedUrgency?: string;
}

// ─── Explainability ("Why Was This Flagged?") ────────────────────────────────

export interface FlagExplanation {
  issue: string;
  whatSystemFound: string;
  expectedOrReference?: string;
  evidence?: string;
  ruleOrSignal?: string;
  impact?: string;
  officerAction?: string;
}

// ─── Correction Feedback ─────────────────────────────────────────────────────

export type FeedbackCategory =
  | 'ocr_error'
  | 'extraction_error'
  | 'normalization_error'
  | 'classification_error'
  | 'validation_false_positive'
  | 'missing_field'
  | 'wrong_field_mapping'
  | 'handwriting_interpretation'
  | 'other';

export interface CorrectionFeedback {
  fieldName: string;
  aiCandidate?: string;
  correctedValue?: string;
  correctionReason?: string;
  evidenceReference?: string;
  reviewerName?: string;
  reviewerRole?: string;
  timestamp?: string;
  feedbackCategory?: FeedbackCategory;
}

// ─── Correction History Entry ─────────────────────────────────────────────────

export interface CorrectionHistoryEntry {
  id: string;
  fieldName: string;
  fieldLabel: string;
  oldValue?: string;
  newValue?: string;
  changedBy?: string;
  reason?: string;
  timestamp?: string;
  feedbackCategory?: FeedbackCategory;
}

// ─── GIS Linkage ─────────────────────────────────────────────────────────────

export type GisLinkageStatus =
  | 'LINKED'
  | 'PARTIAL'
  | 'NOT_LINKED'
  | 'PENDING'
  | 'FAILED';

export type GeometryStatus =
  | 'AVAILABLE'
  | 'PARTIAL'
  | 'NOT_AVAILABLE'
  | 'PENDING';

export interface GisLinkageInfo {
  status: GisLinkageStatus;
  parcelId?: string;
  geometryStatus?: GeometryStatus;
  latitude?: number;
  longitude?: number;
  surveyNumber?: string;
  village?: string;
}

// ─── Integration Status ───────────────────────────────────────────────────────

export type IntegrationConnectionStatus =
  | 'CONFIGURED'
  | 'CONNECTED'
  | 'UNAVAILABLE'
  | 'ERROR'
  | 'NOT_CONFIGURED';

export interface IntegrationStatus {
  name: string;
  description: string;
  connectionStatus: IntegrationConnectionStatus;
  lastCheckedAt?: string;
  errorMessage?: string;
}

// ─── Analytics Expansion Metrics ─────────────────────────────────────────────

export interface ProcessingStats {
  status: DataAvailability;
  totalProcessed?: number;
  averageProcessingTimeMs?: number;
  failureRate?: number; // 0–1
  queueDepth?: number;
}

export interface LanguagePerformance {
  status: DataAvailability;
  breakdown?: Array<{
    language: string;
    documentCount: number;
    averageConfidence?: number;
  }>;
}

export interface DocumentTypePerformance {
  status: DataAvailability;
  breakdown?: Array<{
    documentType: string;
    documentCount: number;
    averageConfidence?: number;
  }>;
}

export interface RegionalProgress {
  status: DataAvailability;
  breakdown?: Array<{
    district: string;
    state: string;
    totalRecords: number;
    approvedRecords: number;
  }>;
}

export interface HumanReviewQueueMetrics {
  status: DataAvailability;
  queueLength?: number;
  averageReviewTimeMs?: number;
  correctionRate?: number;
}
