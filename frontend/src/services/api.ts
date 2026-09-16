import {
  LandDocument,
  LandRecord,
  GisLocation,
  AuditLog,
  AnalyticsSummary,
  ExtractedField,
  ValidationIssue,
  DocumentStatus,
  User,
} from '../types';
import type {
  DocumentQuality,
  DocumentClassification,
  OCREvidence,
  LayoutEvidence,
  MasterDataMatch,
  DuplicateCandidate,
  ConflictSummary,
  RecordRisk,
  ReviewRouting,
  CorrectionFeedback,
  CorrectionHistoryEntry,
  GisLinkageInfo,
  IntegrationStatus,
  ProcessingStats,
  LanguagePerformance,
  DocumentTypePerformance,
  RegionalProgress,
  HumanReviewQueueMetrics,
} from '../types/intelligence';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Helper to construct headers with auth context
function getHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...extra,
  };

  try {
    const savedUser = localStorage.getItem('novaax_user');
    if (savedUser) {
      const parsed: User = JSON.parse(savedUser);
      if (parsed.role) {
        headers['X-Test-Role'] = parsed.role;
      }
    }
  } catch (e) {
    // Ignore parse error
  }

  const token = localStorage.getItem('novaax_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Fallback default dev token if available
    headers['Authorization'] = `Bearer test-token-verification_officer`;
  }

  return headers;
}

// Transform backend document to frontend LandDocument
export function mapBackendDocument(raw: any): LandDocument {
  const fileTypeStr = String(raw.file_type || raw.fileType || 'pdf').toLowerCase();
  const fileType: 'pdf' | 'jpg' | 'jpeg' | 'png' =
    fileTypeStr.includes('png') ? 'png' : fileTypeStr.includes('jpg') || fileTypeStr.includes('jpeg') ? 'jpg' : 'pdf';

  const sizeNum = typeof raw.file_size === 'number' ? raw.file_size : 1048576;
  const fileSize = sizeNum > 1024 * 1024
    ? `${(sizeNum / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.round(sizeNum / 1024)} KB`;

  return {
    id: raw.id,
    displayId: raw.display_id || raw.displayId || `DOC-${raw.id?.substring(0, 6)}`,
    fileName: raw.file_name || raw.fileName || 'document.pdf',
    fileType,
    fileSize,
    pageCount: raw.page_count || raw.pageCount || 1,
    uploadedBy: raw.uploaded_by_name || raw.uploadedBy || 'Revenue Officer',
    uploadedAt: raw.created_at ? new Date(raw.created_at).toLocaleString() : new Date().toLocaleString(),
    language: (raw.language === 'mr' ? 'Marathi' : raw.language === 'hi' ? 'Hindi' : 'English') as any,
    category: (raw.document_category || raw.category || 'Land Record') as any,
    status: (raw.status || 'UPLOADED') as DocumentStatus,
    overallConfidence: raw.overall_confidence ? Math.round(Number(raw.overall_confidence) * 100) : 92,
    fileUrl: raw.signed_url || raw.fileUrl,
  };
}

// Transform backend land_record to frontend LandRecord
export function mapBackendRecord(raw: any): LandRecord {
  const fieldsMap: Record<string, ExtractedField> = {};
  
  // Default synthesized fields
  const addField = (name: string, label: string, val: any, conf = 95, origVal?: string) => {
    fieldsMap[name] = {
      fieldName: name,
      label,
      value: val ?? null,
      originalValue: origVal ?? (val ? String(val) : null),
      confidence: conf,
      sourcePage: 1,
    };
  };

  addField('ownerName', 'Landowner Name', raw.landowner_name || raw.ownerName, 96);
  addField('surveyNumber', 'Survey Number', raw.survey_number || raw.surveyNumber, 94);
  addField('khasraNumber', 'Khasra Number', raw.khasra_number || raw.khasraNumber, 92);
  addField('khataNumber', 'Khata Number', raw.khata_number || raw.khataNumber, 91);
  addField('plotArea', 'Plot Area (Hectares)', raw.plot_area || raw.plotArea, 90);
  addField('village', 'Village', raw.village, 97);
  addField('tehsil', 'Tehsil / Taluka', raw.tehsil, 98);
  addField('district', 'District', raw.district, 99);
  addField('landClassification', 'Classification', raw.land_classification || raw.landClassification || 'Agricultural', 95);
  addField('ownershipType', 'Ownership Type', raw.ownership_type || raw.ownershipType || 'Class 1 (Occupant Class I)', 93);

  // If raw has explicit record_fields
  if (Array.isArray(raw.fields)) {
    raw.fields.forEach((f: any) => {
      const fn = f.field_name || f.fieldName;
      if (fn) {
        fieldsMap[fn] = {
          fieldName: fn,
          label: f.label || fn.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()),
          value: f.field_value !== undefined ? f.field_value : f.value,
          originalValue: f.original_value || f.originalValue,
          confidence: f.confidence ? Math.round(Number(f.confidence) * 100) : 90,
          sourcePage: f.source_page || 1,
          isModified: f.source_type === 'HUMAN_CORRECTION' || f.isModified,
        };
      }
    });
  }

  // Parse validation issues
  const validationIssues: ValidationIssue[] = [];
  const valList = raw.validation_results || raw.validationIssues || [];
  if (Array.isArray(valList)) {
    valList.forEach((v: any, idx: number) => {
      validationIssues.push({
        id: v.id || `val-${idx}`,
        ruleCode: v.rule_code || v.ruleCode || 'RULE_CHECK',
        fieldName: v.field_name || v.fieldName || 'general',
        severity: (v.severity ? String(v.severity).toLowerCase() : 'info') as any,
        status: (v.status || 'PASSED') as any,
        message: v.message || 'Validation condition evaluated.',
        expectedValue: v.expected_value || v.expectedValue,
        actualValue: v.actual_value || v.actualValue,
      });
    });
  }

  // Extract GIS coords
  let lat = raw.latitude ? Number(raw.latitude) : 18.5793;
  let lng = raw.longitude ? Number(raw.longitude) : 73.9822;
  if (raw.gis_locations && Array.isArray(raw.gis_locations) && raw.gis_locations.length > 0) {
    lat = Number(raw.gis_locations[0].latitude);
    lng = Number(raw.gis_locations[0].longitude);
  }

  return {
    id: raw.id,
    displayId: raw.display_id || raw.displayId || `LR-${raw.id?.substring(0, 6)}`,
    documentId: raw.document_id || raw.documentId || '',
    ownerName: raw.landowner_name || raw.ownerName || 'Unknown Landholder',
    surveyNumber: raw.survey_number || raw.surveyNumber || '100/1',
    khasraNumber: raw.khasra_number || raw.khasraNumber,
    khataNumber: raw.khata_number || raw.khataNumber,
    plotArea: Number(raw.plot_area || raw.plotArea || 0),
    plotAreaUnit: (raw.plot_area_unit || raw.plotAreaUnit || 'hectare') as any,
    village: raw.village || 'Pune Circle',
    tehsil: raw.tehsil || 'Haveli',
    district: raw.district || 'Pune',
    state: raw.state || 'Maharashtra',
    landClassification: (raw.land_classification || raw.landClassification || 'Agricultural') as any,
    ownershipType: (raw.ownership_type || raw.ownershipType || 'Individual') as any,
    mutationInfo: raw.mutation_information || raw.mutationInfo,
    registrationDate: raw.registration_information || raw.registrationDate,
    status: (raw.status || 'DRAFT') as DocumentStatus,
    overallConfidence: raw.confidence ? Math.round(Number(raw.confidence) * 100) : 92,
    createdAt: raw.created_at ? new Date(raw.created_at).toLocaleString() : new Date().toLocaleString(),
    updatedAt: raw.updated_at ? new Date(raw.updated_at).toLocaleString() : new Date().toLocaleString(),
    approvedAt: raw.approved_at ? new Date(raw.approved_at).toLocaleString() : undefined,
    approvedBy: raw.approved_by || raw.approvedBy,
    latitude: lat,
    longitude: lng,
    fields: fieldsMap,
    validationIssues,
  };
}

export class ApiService {
  // 1. Current User
  static async getCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      const u = json.data || json;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: (u.role ? u.role.toLowerCase() : 'verification_officer') as any,
        designation: (u.role ? u.role.replace('_', ' ') : 'Officer'),
        scope: u.scope || {},
      };
    } catch (e) {
      console.warn('API: getCurrentUser failed, falling back to cached user', e);
      return null;
    }
  }

  // 2. Documents
  static async getDocuments(): Promise<LandDocument[]> {
    const res = await fetch(`${API_BASE}/documents`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch documents: ${res.statusText}`);
    const json = await res.json();
    const items = json.items || [];
    return items.map(mapBackendDocument);
  }

  static async getDocument(id: string): Promise<LandDocument | null> {
    const res = await fetch(`${API_BASE}/documents/${id}`, { headers: getHeaders() });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch document ${id}: ${res.statusText}`);
    }
    const json = await res.json();
    return mapBackendDocument(json.data || json);
  }

  static async uploadDocument(
    file: File,
    language = 'mr',
    category = '7/12 Extract'
  ): Promise<LandDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    formData.append('document_category', category);

    const headers = getHeaders();
    delete headers['Content-Type']; // Let browser set multipart boundary

    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Document upload failed: ${res.statusText}`);
    }

    const json = await res.json();
    return mapBackendDocument(json.data || json);
  }

  // 3. Processing
  static async startProcessing(docId: string): Promise<{ jobId: string; status: string }> {
    const res = await fetch(`${API_BASE}/documents/${docId}/process`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
    });
    if (!res.ok) throw new Error(`Failed to start processing: ${res.statusText}`);
    const json = await res.json();
    return {
      jobId: json.job_id,
      status: json.status,
    };
  }

  static async getProcessingStatus(docId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${docId}/processing`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to get processing status: ${res.statusText}`);
    return await res.json();
  }

  static async getExtraction(docId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${docId}/extraction`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to get extraction: ${res.statusText}`);
    return await res.json();
  }

  // 4. Records
  static async getRecords(): Promise<LandRecord[]> {
    const res = await fetch(`${API_BASE}/records`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch records: ${res.statusText}`);
    const json = await res.json();
    const items = json.items || [];
    return items.map(mapBackendRecord);
  }

  static async getRecord(id: string): Promise<LandRecord | null> {
    const res = await fetch(`${API_BASE}/records/${id}`, { headers: getHeaders() });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch record ${id}: ${res.statusText}`);
    }
    const json = await res.json();
    return mapBackendRecord(json.data || json);
  }

  static async updateRecordFields(
    recordId: string,
    fields: Record<string, any>,
    reason = 'Corrected by officer'
  ): Promise<any> {
    const backendPayload: Record<string, any> = { reason };
    if (fields.ownerName !== undefined) backendPayload.landowner_name = fields.ownerName;
    if (fields.surveyNumber !== undefined) backendPayload.survey_number = fields.surveyNumber;
    if (fields.khasraNumber !== undefined) backendPayload.khasra_number = fields.khasraNumber;
    if (fields.khataNumber !== undefined) backendPayload.khata_number = fields.khataNumber;
    if (fields.plotArea !== undefined) backendPayload.plot_area = Number(fields.plotArea);
    if (fields.plotAreaUnit !== undefined) backendPayload.plot_area_unit = fields.plotAreaUnit;
    if (fields.village !== undefined) backendPayload.village = fields.village;
    if (fields.tehsil !== undefined) backendPayload.tehsil = fields.tehsil;
    if (fields.district !== undefined) backendPayload.district = fields.district;

    const res = await fetch(`${API_BASE}/records/${recordId}`, {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(backendPayload),
    });

    if (!res.ok) throw new Error(`Failed to update record: ${res.statusText}`);
    return await res.json();
  }

  static async approveRecord(recordId: string, approverName: string, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/records/${recordId}/approve`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ approval_notes: notes || `Approved by ${approverName}` }),
    });
    if (!res.ok) throw new Error(`Failed to approve record: ${res.statusText}`);
    return await res.json();
  }

  static async rejectRecord(recordId: string, rejecterName: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/records/${recordId}/reject`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ reason: reason || 'Survey details could not be verified.' }),
    });
    if (!res.ok) throw new Error(`Failed to reject record: ${res.statusText}`);
    return await res.json();
  }

  // 5. Verification Queue
  static async getVerificationQueue(): Promise<LandRecord[]> {
    const res = await fetch(`${API_BASE}/verification`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch verification queue: ${res.statusText}`);
    const json = await res.json();
    const items = json.items || [];
    return items.map(mapBackendRecord);
  }

  static async getReviewDetail(recordId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/verification/${recordId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to get review detail: ${res.statusText}`);
    return await res.json();
  }

  static async saveReviewChanges(recordId: string, changes: Array<{ field: string; value: any; reason: string }>): Promise<any> {
    const res = await fetch(`${API_BASE}/verification/${recordId}`, {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ changes }),
    });
    if (!res.ok) throw new Error(`Failed to save review changes: ${res.statusText}`);
    return await res.json();
  }

  // 6. GIS
  static async getGisLocations(): Promise<GisLocation[]> {
    const res = await fetch(`${API_BASE}/gis/records`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch GIS locations: ${res.statusText}`);
    const json = await res.json();
    const items = json.items || [];
    return items.map((g: any) => ({
      recordId: g.record_id,
      displayId: g.display_id || `LR-${g.record_id?.substring(0, 6)}`,
      ownerName: g.owner_name,
      surveyNumber: g.survey_number,
      village: g.village,
      tehsil: g.tehsil,
      district: g.district,
      area: `${g.plot_area} ${g.plot_area_unit || 'hectares'}`,
      status: g.status as DocumentStatus,
      latitude: Number(g.latitude),
      longitude: Number(g.longitude),
    }));
  }

  // 7. Analytics
  static async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics/summary`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.statusText}`);
    const json = await res.json();
    const d = json.data || json;
    return {
      totalDocuments: d.total_documents ?? 0,
      processed: d.processed ?? 0,
      pendingVerification: d.pending_verification ?? 0,
      approved: d.approved ?? 0,
      validationIssues: d.validation_issues ?? 0,
      averageConfidence: Math.round((d.average_confidence ?? 0.92) * 100),
    };
  }

  // 8. Audit Logs
  static async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.statusText}`);
    const json = await res.json();
    const items = json.items || [];
    return items.map((a: any) => ({
      id: a.id,
      timestamp: a.created_at ? new Date(a.created_at).toLocaleString() : new Date().toLocaleString(),
      userName: a.user_name || 'Revenue Officer',
      userRole: (a.user_role || 'verification_officer') as any,
      action: a.action,
      entityType: (a.entity_type || 'record') as any,
      entityId: a.entity_id,
      description: a.description,
      metadata: a.metadata,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Round-2 Intelligence API Stubs
  // These are named integration points for future backend endpoints.
  // They return null when the backend has not yet implemented the endpoint.
  // Do NOT add mock/fake data here — the UI handles the empty state gracefully.
  // ─────────────────────────────────────────────────────────────────────────

  // 9. Document Quality
  static async getDocumentQuality(docId: string): Promise<DocumentQuality | null> {
    try {
      const res = await fetch(`${API_BASE}/documents/${docId}/quality`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 10. Document Classification
  static async getDocumentClassification(docId: string): Promise<DocumentClassification | null> {
    try {
      const res = await fetch(`${API_BASE}/documents/${docId}/classification`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 11. OCR Evidence for a field
  static async getOCREvidence(docId: string, fieldName?: string): Promise<OCREvidence | null> {
    try {
      const url = fieldName
        ? `${API_BASE}/documents/${docId}/ocr-evidence?field=${encodeURIComponent(fieldName)}`
        : `${API_BASE}/documents/${docId}/ocr-evidence`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 12. Layout Evidence
  static async getLayoutEvidence(docId: string, fieldName?: string): Promise<LayoutEvidence | null> {
    try {
      const url = fieldName
        ? `${API_BASE}/documents/${docId}/layout-evidence?field=${encodeURIComponent(fieldName)}`
        : `${API_BASE}/documents/${docId}/layout-evidence`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 13. Master-Data Verification
  static async getMasterDataMatch(recordId: string): Promise<MasterDataMatch | null> {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/master-data`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 14. Duplicate Detection
  static async getDuplicateStatus(recordId: string): Promise<DuplicateCandidate | null> {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/duplicates`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 15. Conflict / Anomaly Summary
  static async getConflictSummary(recordId: string): Promise<ConflictSummary | null> {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/conflicts`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 16. Record Risk
  static async getRecordRisk(recordId: string): Promise<RecordRisk | null> {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/risk`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 17. Review Routing
  static async getReviewRouting(recordId: string): Promise<ReviewRouting | null> {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/routing`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 18. Correction History
  static async getCorrectionHistory(recordId: string): Promise<CorrectionHistoryEntry[]> {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/corrections`, { headers: getHeaders() });
      if (!res.ok) return [];
      const json = await res.json();
      return json.items ?? json.data ?? [];
    } catch {
      return [];
    }
  }

  // 19. Submit Correction Feedback
  static async submitCorrectionFeedback(recordId: string, feedback: CorrectionFeedback): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/corrections`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(feedback),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // 20. GIS Linkage for Record
  static async getGisLinkage(recordId: string): Promise<GisLinkageInfo | null> {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}/gis-linkage`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 21. Integration Status
  static async getIntegrationStatus(): Promise<IntegrationStatus[]> {
    try {
      const res = await fetch(`${API_BASE}/integrations/status`, { headers: getHeaders() });
      if (!res.ok) return [];
      const json = await res.json();
      return json.items ?? json.data ?? [];
    } catch {
      return [];
    }
  }

  // 22. Processing Statistics
  static async getProcessingStats(): Promise<ProcessingStats | null> {
    try {
      const res = await fetch(`${API_BASE}/analytics/processing-stats`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 23. Language Performance
  static async getLanguagePerformance(): Promise<LanguagePerformance | null> {
    try {
      const res = await fetch(`${API_BASE}/analytics/language-performance`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 24. Document Type Performance
  static async getDocumentTypePerformance(): Promise<DocumentTypePerformance | null> {
    try {
      const res = await fetch(`${API_BASE}/analytics/document-type-performance`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 25. Regional Progress
  static async getRegionalProgress(): Promise<RegionalProgress | null> {
    try {
      const res = await fetch(`${API_BASE}/analytics/regional-progress`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }

  // 26. Human Review Queue Metrics
  static async getHumanReviewQueueMetrics(): Promise<HumanReviewQueueMetrics | null> {
    try {
      const res = await fetch(`${API_BASE}/analytics/review-queue`, { headers: getHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? json ?? null;
    } catch {
      return null;
    }
  }
}

