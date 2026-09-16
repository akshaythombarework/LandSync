import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockApi } from '../services/mockApi';
import { LandRecord } from '../types';
import { StatusBadge, ConfidenceBadge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/FeedbackStates';
import { PageHeader } from '../components/ui/PageHeader';
import { FolderCheck, Search, Filter, MapPin, Eye, ArrowRight, AlertTriangle } from 'lucide-react';

export const RecordsPage: React.FC = () => {
  const [records, setRecords] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await mockApi.getRecords();
        setRecords(data);
      } catch (e) {
        console.error('Records fetch error:', e);
        setError('Failed to load land records. Please retry.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      r.displayId.toLowerCase().includes(search.toLowerCase()) ||
      r.surveyNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.gatNumber && r.gatNumber.toLowerCase().includes(search.toLowerCase())) ||
      (r.khasraNumber && r.khasraNumber.toLowerCase().includes(search.toLowerCase())) ||
      r.village.toLowerCase().includes(search.toLowerCase()) ||
      r.tehsil.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingState message="Loading digital land records registry..." />;
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
      <PageHeader
        title="Land Records Directory"
        actions={
          <Link
            to="/map"
            className="px-3 py-1.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-white" />
            <span>GIS Map</span>
          </Link>
        }
      />

      {/* Search & Filter Bar — flat */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by owner, survey, Khasra, or village"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#166534] focus:border-[#166534]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#475569]" />
          <span className="text-xs font-semibold text-slate-500">Filter &middot;</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-[#CBD5E1] rounded-[6px] px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#166534] focus:border-[#166534]"
          >
            <option value="ALL">All ({records.length})</option>
            <option value="APPROVED">Approved</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-500 border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3 font-semibold text-[10px]">Record ID</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Landowner name</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Gat / Survey / Khasra</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Plot area</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Location (Village &middot; Tehsil)</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Classification</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-slate-400">
                    {records.length === 0
                      ? 'No land records found. Process a document to create digital records.'
                      : 'No records match your search or filter.'}
                  </td>
                </tr>
              ) : filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-[#F8FAF8] transition-colors h-[52px]">
                  <td className="px-4 py-3 font-semibold text-[#0B1F33] tabular-nums">{r.displayId}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.ownerName}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 tabular-nums">
                      {r.gatNumber ? `Gat No. ${r.gatNumber}` : `Survey ${r.surveyNumber}`}
                    </div>
                    <div className="text-[11px] text-[#475569] tabular-nums">
                      {r.khasraNumber ? `Khasra: ${r.khasraNumber}` : `Hissa: ${r.surveyNumber}`}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 tabular-nums">{r.plotArea} {r.plotAreaUnit}</td>
                  <td className="px-4 py-3 text-slate-600">{r.village}, {r.tehsil}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[#0F172A] font-medium">
                      {r.landClassification}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                        Review required
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/records/${r.id}`}
                      className="inline-flex items-center px-2.5 py-1 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-slate-50 rounded-[6px] text-xs font-semibold transition shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-[#475569]" /> View
                    </Link>
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
