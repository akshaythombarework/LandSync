import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockApi } from '../services/mockApi';
import { LandDocument, LandRecord } from '../types';
import { StatusBadge, ConfidenceBadge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/FeedbackStates';
import { FileText, ArrowLeft, CheckSquare, Clock, MapPin, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [doc, setDoc] = useState<LandDocument | null>(null);
  const [record, setRecord] = useState<LandRecord | null>(null);
  const [loading, setLoading] = useState(true);

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
    };
    fetchData();
  }, [documentId]);

  if (loading || !doc) {
    return <LoadingState message="Loading document details..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/documents"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">{doc.displayId}</h1>
              <StatusBadge status={doc.status} />
            </div>
            <p className="text-xs text-slate-500">{doc.fileName}</p>
          </div>
        </div>

        {record && (
          <div className="flex space-x-2">
            {record.status === 'REVIEW_REQUIRED' && (
              <Link
                to={`/verification/${record.id}`}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Open Verification Review</span>
              </Link>
            )}
            {record.status === 'APPROVED' && (
              <Link
                to={`/records/${record.id}`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>View Approved Record</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs text-xs">
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

      {/* Linked Record Summary */}
      {record ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
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
