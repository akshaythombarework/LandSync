import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockApi } from '../services/mockApi';
import { ApiService } from '../services/api';
import { LandDocument, LandRecord } from '../types';
import type { DocumentQuality, DocumentClassification, OCREvidence, LayoutEvidence, PageInfo } from '../types/intelligence';
import { StatusBadge, ConfidenceBadge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/FeedbackStates';
import {
  DocumentQualityCard,
  DocumentClassificationCard,
  PageNavigator,
  OCREvidenceCard,
  LayoutEvidenceCard,
} from '../components/ui/IntelligenceCards';
import { FileText, ArrowLeft, CheckSquare, Clock, MapPin, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

export const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [doc, setDoc] = useState<LandDocument | null>(null);
  const [record, setRecord] = useState<LandRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Round-2 intelligence state — all optional, loaded independently
  const [quality, setQuality] = useState<DocumentQuality | undefined>();
  const [classification, setClassification] = useState<DocumentClassification | undefined>();
  const [ocrEvidence, setOcrEvidence] = useState<OCREvidence | undefined>();
  const [layoutEvidence, setLayoutEvidence] = useState<LayoutEvidence | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInfos] = useState<PageInfo[]>([]); // Will be populated by backend

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const targetDocId = documentId || 'doc-101';
      const foundDoc = await mockApi.getDocument(targetDocId);
      const allRecords = await mockApi.getRecords();
      const linkedRecord = allRecords.find(r => r.documentId === targetDocId);

      setDoc(foundDoc || null);
      setRecord(linkedRecord || null);
      setLoading(false);

      // Load Round-2 intelligence (non-blocking, return null when backend not ready)
      if (foundDoc) {
        ApiService.getDocumentQuality(foundDoc.id).then(q => setQuality(q ?? undefined));
        ApiService.getDocumentClassification(foundDoc.id).then(c => setClassification(c ?? undefined));
        ApiService.getOCREvidence(foundDoc.id).then(e => setOcrEvidence(e ?? undefined));
        ApiService.getLayoutEvidence(foundDoc.id).then(e => setLayoutEvidence(e ?? undefined));
      }
    };
    fetchData();
  }, [documentId]);

  if (loading || !doc) {
    return <LoadingState message="Loading document details..." />;
  }

  const totalPages = doc.pageCount || 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        category="Documents"
        breadcrumbs={[
          { label: 'Repository', href: '/documents' },
          { label: doc.displayId },
        ]}
        title={doc.displayId}
        description={doc.fileName}
        badge={<StatusBadge status={doc.status} />}
        actions={
          record ? (
            <div className="flex space-x-2">
              {record.status === 'REVIEW_REQUIRED' && (
                <Link
                  to={`/verification/${record.id}`}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Open Verification Review</span>
                </Link>
              )}
              {record.status === 'APPROVED' && (
                <Link
                  to={`/records/${record.id}`}
                  className="px-3.5 py-1.5 bg-[#0F766E] hover:bg-[#0d6460] text-white rounded text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>View Certified Record</span>
                </Link>
              )}
            </div>
          ) : undefined
        }
      />

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded border border-slate-200 text-xs">
        <div>
          <span className="text-slate-400 block mb-0.5">Category</span>
          <span className="font-bold text-slate-800">{doc.category}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Language / Script</span>
          <span className="font-bold text-slate-800">{doc.language}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Pages & Size</span>
          <span className="font-bold text-slate-800">{doc.pageCount} Pages • {doc.fileSize}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Uploaded By</span>
          <span className="font-bold text-slate-800">{doc.uploadedBy}</span>
        </div>
      </div>

      {/* Page Navigator (reusable multi-page widget) */}
      {totalPages > 1 && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Page Navigation</span>
          <PageNavigator
            currentPage={currentPage}
            totalPages={totalPages}
            pages={pageInfos}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Intelligence Panels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DocumentQualityCard quality={quality} />
        <DocumentClassificationCard classification={classification} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OCREvidenceCard evidence={ocrEvidence} />
        <LayoutEvidenceCard evidence={layoutEvidence} />
      </div>

      {/* Linked Record Summary */}
      {record ? (
        <div className="bg-white rounded border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Extracted Structured Land Record</h3>
              <p className="text-xs text-slate-500">Linked Record ID: {record.displayId}</p>
            </div>
            <ConfidenceBadge confidence={record.overallConfidence} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Landowner</span>
              <span className="font-bold text-slate-900 text-sm">{record.ownerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Survey / Khasra No</span>
              <span className="font-bold text-slate-900 text-sm">{record.surveyNumber} {record.khasraNumber && `(Khasra ${record.khasraNumber})`}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Plot Area</span>
              <span className="font-bold text-slate-900 text-sm">{record.plotArea} {record.plotAreaUnit}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Village & Tehsil</span>
              <span className="font-semibold text-slate-700">{record.village}, {record.tehsil}</span>
            </div>
            <div>
              <span className="text-slate-400 block">District & State</span>
              <span className="font-semibold text-slate-700">{record.district}, {record.state}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Classification</span>
              <span className="font-semibold text-slate-700">{record.landClassification}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
          No extracted record created yet. Document is in intake queue.
        </div>
      )}
    </div>
  );
};
