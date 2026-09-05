import { LandDocument, LandRecord, GisLocation, AuditLog, AnalyticsSummary } from '../types';
import { initialDocuments, initialRecords, initialGisLocations, initialAuditLogs, initialAnalytics } from './mockData';
import { ApiService, mapBackendDocument, mapBackendRecord } from './api';

class LiveAndMockApiService {
  private documents: LandDocument[] = [...initialDocuments];
  private records: LandRecord[] = [...initialRecords];
  private gisLocations: GisLocation[] = [...initialGisLocations];
  private auditLogs: AuditLog[] = [...initialAuditLogs];
  private analytics: AnalyticsSummary = { ...initialAnalytics };

  // Documents
  async getDocuments(): Promise<LandDocument[]> {
    try {
      const liveDocs = await ApiService.getDocuments();
      if (liveDocs && liveDocs.length > 0) {
        // Merge with initial docs if needed so demo records remain accessible
        const liveIds = new Set(liveDocs.map(d => d.id));
        const merged = [...liveDocs, ...this.documents.filter(d => !liveIds.has(d.id))];
        this.documents = merged;
        return merged;
      }
    } catch (e) {
      console.warn('Live API getDocuments failed, using cached/mock dataset:', e);
    }
    return [...this.documents];
  }

  async getDocument(id: string): Promise<LandDocument | undefined> {
    try {
      const liveDoc = await ApiService.getDocument(id);
      if (liveDoc) return liveDoc;
    } catch (e) {
      console.warn(`Live API getDocument(${id}) failed:`, e);
    }
    return this.documents.find(d => d.id === id || d.displayId === id);
  }

  async addDocument(
    doc: Omit<LandDocument, 'id' | 'displayId' | 'uploadedAt' | 'status' | 'overallConfidence'>,
    file?: File | null
  ): Promise<LandDocument> {
    // Attempt live upload to backend & Supabase Storage if file is present
    if (file) {
      try {
        const liveDoc = await ApiService.uploadDocument(file, doc.language === 'Marathi' ? 'mr' : 'en', doc.category);
        this.documents.unshift(liveDoc);
        this.analytics.totalDocuments += 1;
        return liveDoc;
      } catch (e) {
        console.warn('Live file upload failed, falling back to simulated document:', e);
      }
    }

    const id = `doc-${Date.now()}`;
    const displayId = `DOC-2026-00${this.documents.length + 1}`;
    const newDoc: LandDocument = {
      ...doc,
      id,
      displayId,
      uploadedAt: new Date().toLocaleString(),
      status: 'PROCESSING',
      overallConfidence: 0,
    };
    this.documents.unshift(newDoc);
    this.analytics.totalDocuments += 1;
    this.addAudit('DOCUMENT_UPLOADED', 'document', displayId, `Uploaded ${newDoc.fileName} (${newDoc.category})`);
    return newDoc;
  }

  // Processing
  async completeProcessing(docId: string): Promise<{ doc: LandDocument; record: LandRecord }> {
    // Try live backend processing if document exists on backend
    try {
      await ApiService.startProcessing(docId);
      // Poll live status for up to 3 seconds
      for (let i = 0; i < 4; i++) {
        await new Promise(r => setTimeout(r, 600));
        const statusData = await ApiService.getProcessingStatus(docId);
        if (statusData.status === 'COMPLETED' || statusData.status === 'REVIEW_REQUIRED') {
          break;
        }
      }

      // Fetch live extraction and records
      const allRecords = await ApiService.getRecords();
      const match = allRecords.find(r => r.documentId === docId || r.id === docId);
      const liveDoc = await ApiService.getDocument(docId);
      if (match && liveDoc) {
        this.records.unshift(match);
        return { doc: liveDoc, record: match };
      }
    } catch (e) {
      console.warn('Live processing pipeline request failed, using simulation:', e);
    }

    // Fallback simulation
    const doc = this.documents.find(d => d.id === docId) || this.documents[0];
    doc.status = 'REVIEW_REQUIRED';
    doc.overallConfidence = 74;

    const recordId = `rec-${Date.now()}`;
    const displayId = `LR-PUN-00${this.records.length + 100}`;

    const newRecord: LandRecord = {
      id: recordId,
      displayId,
      documentId: doc.id,
      ownerName: 'Rajesh Bharat Patil',
      surveyNumber: '124/3',
      khasraNumber: '87-B',
      khataNumber: '45',
      plotArea: 2.45,
      plotAreaUnit: 'hectare',
      village: 'Wagholi',
      tehsil: 'Haveli',
      district: 'Pune',
      state: 'Maharashtra',
      landClassification: 'Agricultural',
      ownershipType: 'Individual',
      status: 'REVIEW_REQUIRED',
      overallConfidence: 74,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      latitude: 18.5793,
      longitude: 73.9832,
      fields: {
        ownerName: { fieldName: 'ownerName', label: 'Landowner Name', value: 'Rajesh Bharat Patil', originalValue: 'राजेश भारत पाटील', confidence: 96, sourcePage: 1 },
        surveyNumber: { fieldName: 'surveyNumber', label: 'Survey Number', value: '124/3', originalValue: '१२४/३', confidence: 92, sourcePage: 1 },
        khasraNumber: { fieldName: 'khasraNumber', label: 'Khasra Number', value: '87-B', originalValue: '८७-ब', confidence: 85, sourcePage: 1 },
        khataNumber: { fieldName: 'khataNumber', label: 'Khata Number', value: '45', originalValue: '४५', confidence: 88, sourcePage: 1 },
        plotArea: { fieldName: 'plotArea', label: 'Plot Area (Hectares)', value: 2.45, originalValue: '२.४५ हे.', confidence: 58, sourcePage: 1 },
        village: { fieldName: 'village', label: 'Village', value: 'Wagholi', originalValue: 'वाघोली', confidence: 97, sourcePage: 1 },
        tehsil: { fieldName: 'tehsil', label: 'Tehsil', value: 'Haveli', originalValue: 'हवेली', confidence: 98, sourcePage: 1 },
        district: { fieldName: 'district', label: 'District', value: 'Pune', originalValue: 'पुणे', confidence: 99, sourcePage: 1 },
      },
      validationIssues: [
        {
          id: `val-${Date.now()}-1`,
          ruleCode: 'LOW_CONFIDENCE_FIELD',
          fieldName: 'plotArea',
          severity: 'warning',
          status: 'WARNING',
          message: 'Plot Area extraction confidence is 58% (below 70% threshold). OCR ambiguity detected.',
        },
        {
          id: `val-${Date.now()}-2`,
          ruleCode: 'MASTER_DATA_MISMATCH',
          fieldName: 'plotArea',
          severity: 'warning',
          status: 'WARNING',
          message: 'Official Reference Register lists 2.54 hectares, whereas candidate extraction is 2.45.',
          expectedValue: '2.54 hectares',
          actualValue: '2.45 hectares',
        },
      ],
    };

    this.records.unshift(newRecord);
    this.analytics.processed += 1;
    this.analytics.pendingVerification += 1;
    this.analytics.validationIssues += 2;

    this.addAudit('OCR_EXTRACTION_COMPLETED', 'document', doc.displayId, `Extracted fields. Low confidence field (plotArea: 58%) flagged.`);
    this.addAudit('VALIDATION_EXECUTED', 'record', displayId, `Validation issues flagged. Record placed in Verification Queue.`);

    return { doc, record: newRecord };
  }

  // Records
  async getRecords(): Promise<LandRecord[]> {
    try {
      const liveRecords = await ApiService.getRecords();
      if (liveRecords && liveRecords.length > 0) {
        const liveIds = new Set(liveRecords.map(r => r.id));
        const merged = [...liveRecords, ...this.records.filter(r => !liveIds.has(r.id))];
        this.records = merged;
        return merged;
      }
    } catch (e) {
      console.warn('Live getRecords failed, using cached records:', e);
    }
    return [...this.records];
  }

  async getRecord(id: string): Promise<LandRecord | undefined> {
    try {
      const liveRec = await ApiService.getRecord(id);
      if (liveRec) return liveRec;
    } catch (e) {
      console.warn(`Live getRecord(${id}) failed:`, e);
    }
    return this.records.find(r => r.id === id || r.displayId === id || r.documentId === id);
  }

  async getVerificationQueue(): Promise<LandRecord[]> {
    try {
      const liveQueue = await ApiService.getVerificationQueue();
      if (liveQueue && liveQueue.length > 0) {
        return liveQueue;
      }
    } catch (e) {
      console.warn('Live getVerificationQueue failed, using local queue:', e);
    }
    return this.records.filter(r => r.status === 'REVIEW_REQUIRED' || r.status === 'VALIDATION_PENDING');
  }

  // Verification & Human Correction
  async updateRecordFields(recordId: string, updatedFields: Record<string, string | number>, reviewerName: string): Promise<LandRecord> {
    // Call live backend API
    try {
      await ApiService.updateRecordFields(recordId, updatedFields, `Corrected by ${reviewerName}`);
    } catch (e) {
      console.warn('Live updateRecordFields failed, updating local state:', e);
    }

    const record = this.records.find(r => r.id === recordId) || this.records[0];
    for (const [key, newVal] of Object.entries(updatedFields)) {
      if (record.fields[key]) {
        const oldVal = record.fields[key].value;
        record.fields[key].value = newVal;
        record.fields[key].isModified = true;
        record.fields[key].modifiedBy = reviewerName;
        record.fields[key].modifiedAt = new Date().toLocaleTimeString();
        record.fields[key].confidence = 100;

        if (key === 'plotArea') record.plotArea = Number(newVal);
        if (key === 'ownerName') record.ownerName = String(newVal);
        if (key === 'surveyNumber') record.surveyNumber = String(newVal);

        this.addAudit(
          'FIELD_CORRECTED',
          'record',
          record.displayId,
          `Field "${record.fields[key].label}" corrected by ${reviewerName} from "${oldVal}" to "${newVal}".`
        );
      }
    }

    record.validationIssues = record.validationIssues.filter(issue => !updatedFields[issue.fieldName]);
    record.overallConfidence = 96;
    record.updatedAt = new Date().toLocaleString();

    return { ...record };
  }

  async approveRecord(recordId: string, approverName: string, notes?: string): Promise<LandRecord> {
    try {
      await ApiService.approveRecord(recordId, approverName, notes);
    } catch (e) {
      console.warn('Live approveRecord failed, updating local state:', e);
    }

    const record = this.records.find(r => r.id === recordId) || this.records[0];
    record.status = 'APPROVED';
    record.approvedAt = new Date().toLocaleString();
    record.approvedBy = approverName;
    record.validationIssues = [];

    const doc = this.documents.find(d => d.id === record.documentId);
    if (doc) {
      doc.status = 'APPROVED';
      doc.overallConfidence = record.overallConfidence;
    }

    if (record.latitude && record.longitude) {
      const existingGis = this.gisLocations.find(g => g.recordId === record.id);
      if (existingGis) {
        existingGis.status = 'APPROVED';
      } else {
        this.gisLocations.push({
          recordId: record.id,
          displayId: record.displayId,
          ownerName: record.ownerName,
          surveyNumber: record.surveyNumber,
          village: record.village,
          tehsil: record.tehsil,
          district: record.district,
          area: `${record.plotArea} ${record.plotAreaUnit}`,
          status: 'APPROVED',
          latitude: record.latitude,
          longitude: record.longitude,
        });
      }
    }

    this.analytics.approved += 1;
    this.analytics.pendingVerification = Math.max(0, this.analytics.pendingVerification - 1);
    this.analytics.validationIssues = Math.max(0, this.analytics.validationIssues - 2);

    this.addAudit('RECORD_APPROVED', 'record', record.displayId, `Approved by ${approverName}. ${notes ? 'Notes: ' + notes : ''}`);

    return { ...record };
  }

  async rejectRecord(recordId: string, rejecterName: string, reason: string): Promise<LandRecord> {
    try {
      await ApiService.rejectRecord(recordId, rejecterName, reason);
    } catch (e) {
      console.warn('Live rejectRecord failed, updating local state:', e);
    }

    const record = this.records.find(r => r.id === recordId) || this.records[0];
    record.status = 'REJECTED';
    const doc = this.documents.find(d => d.id === record.documentId);
    if (doc) doc.status = 'REJECTED';

    this.analytics.pendingVerification = Math.max(0, this.analytics.pendingVerification - 1);
    this.addAudit('RECORD_REJECTED', 'record', record.displayId, `Rejected by ${rejecterName}. Reason: ${reason}`);

    return { ...record };
  }

  // GIS
  async getGisLocations(): Promise<GisLocation[]> {
    try {
      const liveGis = await ApiService.getGisLocations();
      if (liveGis && liveGis.length > 0) {
        const liveIds = new Set(liveGis.map(g => g.recordId));
        return [...liveGis, ...this.gisLocations.filter(g => !liveIds.has(g.recordId))];
      }
    } catch (e) {
      console.warn('Live getGisLocations failed, using local locations:', e);
    }
    return [...this.gisLocations];
  }

  // Analytics
  async getAnalytics(): Promise<AnalyticsSummary> {
    try {
      const liveStats = await ApiService.getAnalytics();
      if (liveStats && (liveStats.totalDocuments > 0 || liveStats.approved > 0 || liveStats.processed > 0)) {
        return liveStats;
      }
    } catch (e) {
      console.warn('Live getAnalytics failed, using cached summary:', e);
    }
    return { ...this.analytics };
  }

  // Audit
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const liveLogs = await ApiService.getAuditLogs();
      if (liveLogs && liveLogs.length > 0) {
        const liveIds = new Set(liveLogs.map(l => l.id));
        return [...liveLogs, ...this.auditLogs.filter(l => !liveIds.has(l.id))];
      }
    } catch (e) {
      console.warn('Live getAuditLogs failed, using local audit logs:', e);
    }
    return [...this.auditLogs];
  }

  private addAudit(action: string, entityType: 'document' | 'record' | 'user' | 'validation', entityId: string, description: string) {
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      userName: 'Officer Vikram Deshmukh',
      userRole: 'verification_officer',
      action,
      entityType,
      entityId,
      description,
    });
  }
}

export const mockApi = new LiveAndMockApiService();
