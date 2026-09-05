import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { mockApi } from '../services/mockApi';
import { LandDocument, DocumentStatus } from '../types';
import { StatusBadge, ConfidenceBadge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/FeedbackStates';
import { Files, UploadCloud, Search, Filter, Eye, ArrowRight, Play, AlertTriangle } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-sm font-semibold text-red-700">{error}</p>
        <button onClick={() => window.location.reload()} className="text-xs text-blue-600 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Files className="w-5 h-5 text-blue-800" />
            <span>Document Repository</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage incoming physical land documents, scanned registers, and cadastral maps.
          </p>
        </div>

        <Link
          to="/documents/upload"
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-2 shrink-0 transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </Link>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by file name, ID, or officer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Statuses ({documents.length})</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSING">Processing</option>
            <option value="VALIDATION_PENDING">Validation Pending</option>
          </select>
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Document ID</th>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Uploaded At</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-slate-400">
                    No documents found. Upload a document to get started.
                  </td>
                </tr>
              ) : filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-blue-900">{doc.displayId}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <div className="max-w-xs truncate" title={doc.fileName}>
                      {doc.fileName}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase">{doc.fileType} • {doc.fileSize} • {doc.pageCount} pg</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{doc.category}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {doc.language}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{doc.uploadedAt}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    {doc.overallConfidence > 0 ? (
                      <ConfidenceBadge confidence={doc.overallConfidence} showLabel={false} />
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-semibold transition"
                      title="View Details"
                    >
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Link>

                    {doc.status === 'REVIEW_REQUIRED' && (
                      <Link
                        to="/verification"
                        className="inline-flex items-center px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold shadow-2xs transition"
                      >
                        Review
                      </Link>
                    )}

                    {doc.status === 'PROCESSING' && (
                      <Link
                        to={`/documents/${doc.id}/processing`}
                        className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold transition"
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
