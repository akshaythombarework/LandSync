// User & RBAC types
export type UserRole = 
  | 'admin'
  | 'state_officer'
  | 'district_officer'
  | 'tehsil_officer'
  | 'tehsildar'
  | 'talathi'
  | 'verification_officer'
  | 'survey_officer'
  | 'citizen';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  scope: {
    country?: string;
    state?: string;
    district?: string;
    tehsil?: string;
    taluka?: string;
    village?: string;
  };
  // Citizen profile information
  onboardingCompleted?: boolean;
  aadhaarMasked?: string;
  mobile?: string;
  address?: string;
  gender?: string;
}

// Review Policy Governance types
export type ReviewPolicyMode = 'MANDATORY_HUMAN_REVIEW' | 'AI_AUTO_APPROVAL';

export interface ReviewPolicyConfig {
  mode: ReviewPolicyMode;
  confidenceThreshold: number; // e.g. 97
  criticalIssuesForceReview: boolean; // Always true
  updatedBy?: string;
  updatedAt?: string;
}

// Document types
export type DocumentStatus = 
  | 'UPLOADED'
  | 'PROCESSING'
  | 'EXTRACTED'
  | 'VALIDATION_PENDING'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'GRIEVANCE_SUBMITTED'
  | 'REAPPLIED'
  | 'FAILED';

// Simplified Citizen Facing Statuses
export type CitizenSimpleStatus = 
  | 'Submitted'
  | 'Processing'
  | 'Under Verification'
  | 'Action Required'
  | 'Accepted'
  | 'Rejected'
  | 'Grievance Submitted'
  | 'Reapplied'
  | 'Final Review'
  | 'Completed';

// Citizen Grievance Record
export interface CitizenGrievance {
  id: string;
  documentId: string;
  recordId?: string;
  citizenId: string;
  reason: string;
  description: string;
  supportingDocName?: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolutionNote?: string;
}

// Cadastral Parcel Polygon Geometry
export interface CadastralParcel {
  recordId: string;
  displayId: string;
  ownerName: string;
  surveyNumber: string;
  village: string;
  taluka: string;
  district: string;
  area: string;
  status: DocumentStatus;
  coordinates: [number, number][];
  center: [number, number];
  isCitizenOwned?: boolean;
}

export interface LandDocument {
  id: string;
  displayId: string;
  fileName: string;
  fileType: 'pdf' | 'jpg' | 'jpeg' | 'png';
  fileSize: string;
  pageCount: number;
  uploadedBy: string;
  uploadedAt: string;
  language: 'English' | 'Hindi' | 'Marathi' | 'Auto Detect';
  category: 'Land Record' | 'Ownership Record' | 'Mutation Record' | 'Cadastral Map' | 'Other';
  status: DocumentStatus;
  overallConfidence: number;
  thumbnailUrl?: string;
  fileUrl?: string;
}

// Processing Job types
export type ProcessingStage = 
  | 'FILE_INTAKE'
  | 'PREPROCESSING'
  | 'QUALITY_ASSESSMENT'
  | 'CLASSIFICATION'
  | 'LAYOUT'
  | 'OCR'
  | 'EXTRACTION'
  | 'NORMALIZATION'
  | 'CONFIDENCE'
  | 'VALIDATION'
  | 'BUSINESS_RULES'
  | 'MASTER_DATA'
  | 'ANOMALY_CHECK'
  | 'ROUTING'
  | 'FINAL_VERIFICATION'
  | 'COMPLETED'
  | 'FAILED';

export interface ProcessingJob {
  id: string;
  documentId: string;
  currentStage: ProcessingStage;
  progressPercent: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  stages: {
    name: string;
    stage: ProcessingStage;
    status: 'pending' | 'active' | 'completed' | 'failed';
    description: string;
  }[];
}

// Extraction field types
export interface ExtractedField {
  fieldName: string;
  label: string;
  value: string | number | null;
  originalValue: string | null;
  confidence: number; // 0 - 100
  sourcePage: number;
  sourceBbox?: [number, number, number, number];
  isModified?: boolean;
  modifiedBy?: string;
  modifiedAt?: string;
}

// Validation types
export type ValidationSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ValidationStatus = 'PASSED' | 'WARNING' | 'FAILED';

export interface ValidationIssue {
  id: string;
  ruleCode: string;
  fieldName: string;
  severity: ValidationSeverity;
  status: ValidationStatus;
  message: string;
  expectedValue?: string;
  actualValue?: string;
}

// Land Record types
export interface CoOwnerInfo {
  name: string;
  relation: string;
  share: string;
}

export interface EncumbranceInfo {
  institution: string;
  amount: string;
  purpose: string;
  mutationNo: string;
  date: string;
}

export interface LandBoundary {
  north: string;
  south: string;
  east: string;
  west: string;
}

export interface CropRecord {
  season: string;
  cropName: string;
  area: string;
  irrigationType: string;
}

export interface MutationHistoryEntry {
  mutationNo: string;
  date: string;
  description: string;
  status: string;
}

export interface LandRecord {
  id: string;
  displayId: string;
  documentId: string;
  ownerName: string;
  surveyNumber: string;
  khasraNumber?: string;
  gatNumber?: string;
  hissaNumber?: string;
  khataNumber?: string;
  ulpin?: string; // Unique Land Parcel Identification Number (Bhu-Aadhaar)
  plotArea: number;
  plotAreaUnit: 'hectare' | 'acre' | 'sq.m';
  potkharabaArea?: number;
  cultivableArea?: number;
  jirayatArea?: number;
  bagayatArea?: number;
  assessmentAmount?: string;
  waterSource?: string;
  soilGrade?: string;
  occupancyClass?: string;
  fatherOrHusbandName?: string;
  coOwners?: CoOwnerInfo[];
  encumbrances?: EncumbranceInfo[];
  boundaries?: LandBoundary;
  crops?: CropRecord[];
  mutationEntries?: MutationHistoryEntry[];
  revenueCircle?: string;
  lgdCode?: string;
  certificateNumber?: string;
  digitalSignatureHash?: string;
  village: string;
  tehsil: string;
  district: string;
  state: string;
  landClassification: 'Agricultural' | 'Residential' | 'Commercial' | 'Forest' | 'Government';
  ownershipType: 'Individual' | 'Joint' | 'Institutional';
  mutationInfo?: string;
  registrationDate?: string;
  status: DocumentStatus;
  overallConfidence: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  latitude?: number;
  longitude?: number;
  fields: Record<string, ExtractedField>;
  validationIssues: ValidationIssue[];
}

// GIS types
export interface GisLocation {
  recordId: string;
  displayId: string;
  ownerName: string;
  surveyNumber: string;
  village: string;
  tehsil: string;
  district: string;
  area: string;
  status: DocumentStatus;
  latitude: number;
  longitude: number;
}

// Audit types
export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'document' | 'record' | 'user' | 'validation';
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
}

// Analytics types
export interface AnalyticsSummary {
  totalDocuments: number;
  processed: number;
  pendingVerification: number;
  approved: number;
  validationIssues: number;
  averageConfidence: number;
}
