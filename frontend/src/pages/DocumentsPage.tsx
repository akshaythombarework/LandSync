import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { mockApi } from '../services/mockApi';
import { LandDocument, DocumentStatus } from '../types';
import { StatusBadge, ConfidenceBadge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/FeedbackStates';
import { PageHeader } from '../components/ui/PageHeader';
import { Files, UploadCloud, Search, Filter, Eye, Play, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<LandDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        const docs = await mockApi.getDocuments();
        setDocuments(docs);
      } catch (e) {
        console.error('Documents fetch error:', e);
        setError('Failed to load documents. Please retry.');
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
                          doc.displayId.toLowerCase().includes(search.toLowerCase()) ||
                          doc.uploadedBy.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingState message="Loading documents registry..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
        <AlertTriangle className="w-7 h-7 text-red-400" />
        <p className="text-sm font-semibold text-red-700">{error}</p>
        <button onClick={() => window.location.reload()} className="text-xs text-[#0F766E] underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Document Repository"
        actions={
          <Link
            to="/documents/upload"
            className="px-3 py-1.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-white" />
            <span>Upload Document</span>
          </Link>
        }
      />

      {/* Filter bar — flat, no card wrapper */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by document ID, file name, or survey number"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Status &middot;</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">All ({documents.length})</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSING">Processing</option>
            <option value="VALIDATION_PENDING">Validation Pending</option>
          </select>
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-500 border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-2.5 font-semibold text-[10px]">Document ID</th>
                <th className="px-4 py-2.5 font-semibold text-[10px]">File name</th>
                <th className="px-4 py-2.5 font-semibold text-[10px]">Category</th>
                <th className="px-4 py-2.5 font-semibold text-[10px]">Language</th>
                <th className="px-4 py-2.5 font-semibold text-[10px]">Uploaded at</th>
                <th className="px-4 py-2.5 font-semibold text-[10px]">Status</th>
                <th className="px-4 py-2.5 font-semibold text-[10px]">Confidence</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-slate-400">
                    No documents found.
                  </td>
                </tr>
              ) : filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-[#F8FAF8] transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-[#0B1F33] tabular-nums">{doc.displayId}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    <div className="max-w-xs truncate" title={doc.fileName}>
                      {doc.fileName}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tabular-nums">{doc.fileType} · {doc.fileSize} · {doc.pageCount} pg</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{doc.category}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[#475569] text-xs">
                      {doc.language}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 tabular-nums">{doc.uploadedAt}</td>
                  <td className="px-4 py-2.5">
                    {doc.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                        Approved
                      </span>
                    ) : doc.status === 'REVIEW_REQUIRED' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                        Review required
                      </span>
                    ) : doc.status === 'VALIDATION_PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#475569]" />
                        Validation pending
                      </span>
                    ) : doc.status === 'REJECTED' || doc.status === 'FAILED' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                        {doc.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {doc.overallConfidence > 0 ? (
                      <span className={`tabular-nums font-semibold text-xs ${doc.overallConfidence >= 90 ? 'text-[#15803D]' : doc.overallConfidence >= 75 ? 'text-[#D97706]' : 'text-[#DC2626]'}`}>
                        {doc.overallConfidence}%
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right space-x-1.5">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="inline-flex items-center px-2.5 py-1 bg-white border border-[#CBD5E1] text-slate-700 hover:bg-slate-50 rounded-[6px] text-xs font-semibold transition shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-[#475569]" /> View
                    </Link>

                    {doc.status === 'REVIEW_REQUIRED' && (
                      <Link
                        to="/verification"
                        className="inline-flex items-center px-2.5 py-1 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold transition"
                      >
                        Review
                      </Link>
                    )}

                    {doc.status === 'PROCESSING' && (
                      <Link
                        to={`/documents/${doc.id}/processing`}
                        className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition"
                      >
                        <Play className="w-3 h-3 mr-1" /> Pipeline
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
