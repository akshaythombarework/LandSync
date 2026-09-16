import React, { useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';
import { AuditLog } from '../types';
import { LoadingState } from '../components/ui/FeedbackStates';
import { PageHeader } from '../components/ui/PageHeader';
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
      setError('Failed to fetch audit logs. Please try again.');
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
      <PageHeader
        title="Audit Trail"
      />

      {/* Filter & Search — flat, no card */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, description, or officer"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#166534] focus:border-[#166534]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto text-xs">
          <Filter className="w-4 h-4 text-[#475569]" />
          <span className="font-semibold text-slate-500">Entity &middot;</span>
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="text-xs border border-[#CBD5E1] rounded-[6px] px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#166534] focus:border-[#166534]"
          >
            <option value="ALL">All ({logs.length})</option>
            <option value="record">Land Records</option>
            <option value="document">Documents</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-500 border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3 font-semibold text-[10px]">Timestamp</th>
                <th className="px-4 py-3 font-semibold text-[10px]">User & role</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Action</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Target entity</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-xs text-slate-400">
                    No audit records match your query.
                  </td>
                </tr>
              ) : filteredLogs.map(log => {
                const displayName = log.userName === 'System AI Worker' ? 'System Automation' : log.userName;
                const formattedRole = 
                  log.userRole.toLowerCase() === 'verification_officer' ? 'Verification officer' :
                  log.userRole.toLowerCase() === 'district_officer' ? 'District officer' :
                  log.userRole.toLowerCase() === 'state_officer' ? 'State officer' :
                  log.userRole.toLowerCase() === 'admin' ? 'Admin' :
                  log.userRole.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

                return (
                  <tr key={log.id} className="hover:bg-[#F8FAF8] transition-colors h-[56px]">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-[11px] tabular-nums">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{displayName}</div>
                      <div className="text-[11px] text-[#475569]">{formattedRole}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[#334155]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap tabular-nums">
                      {log.entityType.toUpperCase()}: <span className="text-[#0B1F33]">{log.entityId}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium leading-relaxed">
                      {log.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
