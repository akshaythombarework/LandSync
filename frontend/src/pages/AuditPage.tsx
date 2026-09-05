import React, { useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';
import { AuditLog } from '../types';
import { LoadingState } from '../components/ui/FeedbackStates';
import { History, Search, ShieldCheck, Filter, Clock } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockApi.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Audit logs fetch error:', err);
      setError('Failed to fetch audit logs from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchSearch = l.action.toLowerCase().includes(search.toLowerCase()) ||
                        l.description.toLowerCase().includes(search.toLowerCase()) ||
                        l.entityId.toLowerCase().includes(search.toLowerCase()) ||
                        l.userName.toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === 'ALL' || l.entityType === entityFilter;
    return matchSearch && matchEntity;
  });

  if (loading) {
    return <LoadingState message="Loading immutable audit trail..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <History className="w-8 h-8 text-amber-500" />
        <p className="text-sm font-semibold text-slate-700">{error}</p>
        <button
          onClick={fetchLogs}
          className="text-xs text-blue-600 hover:text-blue-800 underline font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
          <History className="w-5 h-5 text-emerald-800" />
          <span>System Audit Trail & Provenance History</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically auditable chronological log of all document uploads, AI extractions, human corrections, and officer approvals.
        </p>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, description, officer name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-600">Entity:</span>
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Entities ({logs.length})</option>
            <option value="record">Land Records</option>
            <option value="document">Documents</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User & Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Details / Change Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-xs text-slate-400">
                    No audit records match your query.
                  </td>
                </tr>
              ) : filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-slate-400 uppercase">{log.userRole.replace('_', ' ')}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    {log.entityType.toUpperCase()}: <span className="text-blue-900">{log.entityId}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium leading-relaxed">
                    {log.description}
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
