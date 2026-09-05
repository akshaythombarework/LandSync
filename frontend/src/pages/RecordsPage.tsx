import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockApi } from '../services/mockApi';
import { LandRecord } from '../types';
import { StatusBadge, ConfidenceBadge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/FeedbackStates';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <FolderCheck className="w-5 h-5 text-emerald-800" />
            <span>Digital Land Records Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified digital records derived from verified legacy documents with GIS coordinates.
          </p>
        </div>

        <Link
          to="/map"
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <MapPin className="w-4 h-4" />
          <span>Open Interactive GIS Map</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by owner name, Gat #, Khasra #, survey #, or village..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Filter:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Records ({records.length})</option>
            <option value="APPROVED">Approved Only</option>
            <option value="REVIEW_REQUIRED">Review Required Only</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Record ID</th>
                <th className="px-4 py-3">Landowner Name</th>
                <th className="px-4 py-3">Gat / Survey / Khasra</th>
                <th className="px-4 py-3">Plot Area</th>
                <th className="px-4 py-3">Location (Village • Tehsil)</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
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
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-emerald-900">{r.displayId}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{r.ownerName}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">
                      {r.gatNumber ? `Gat No. ${r.gatNumber}` : `Survey ${r.surveyNumber}`}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {r.khasraNumber ? `Khasra: ${r.khasraNumber}` : `Hissa: ${r.surveyNumber}`}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.plotArea} {r.plotAreaUnit}</td>
                  <td className="px-4 py-3 text-slate-600">{r.village}, {r.tehsil}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {r.landClassification}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/records/${r.id}`}
                      className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-semibold transition"
                    >
                      <Eye className="w-3 h-3 mr-1" /> View Details
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
