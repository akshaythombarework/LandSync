import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { mockApi } from '../services/mockApi';
import { LandRecord } from '../types';
import { ConfidenceBadge, StatusBadge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/FeedbackStates';
import { PageHeader } from '../components/ui/PageHeader';
import { CheckSquare, AlertTriangle, ArrowRight, Search, ShieldAlert, ShieldOff } from 'lucide-react';

export const VerificationQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const items = await mockApi.getVerificationQueue();
        setQueue(items);
      } catch (e: any) {
        const msg = e?.message || '';
        if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
          setForbidden(true);
        } else {
          console.error('Verification queue fetch error:', e);
          setError('Failed to load verification queue. Please retry.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  const filteredItems = queue.filter(item =>
    item.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    item.displayId.toLowerCase().includes(search.toLowerCase()) ||
    item.village.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Loading verification queue..." />;
  }

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <ShieldOff className="w-8 h-8 text-red-400" />
        <h2 className="text-sm font-bold text-slate-800">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Your role does not have permission to access the verification queue.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
        <AlertTriangle className="w-7 h-7 text-amber-400" />
        <p className="text-sm font-semibold text-slate-700">{error}</p>
        <button onClick={() => window.location.reload()} className="text-xs text-[#0F766E] underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Verification Queue"
        actions={
          <div className="inline-flex items-center gap-1.5 bg-white border border-[#CBD5E1] px-2.5 py-1 rounded-[6px] text-xs font-semibold text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            <span>{queue.length} pending review</span>
          </div>
        }
      />

      {/* Search bar — flat, no card wrapper */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by owner, ID, or village"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#166534] focus:border-[#166534]"
          />
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline ml-4">Sorted by lowest confidence</span>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-500 border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3 font-semibold text-[10px]">#</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Record ID</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Landowner</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Location & parcel</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Confidence</th>
                <th className="px-4 py-3 font-semibold text-[10px]">Validation warning</th>
                <th className="px-4 py-3 text-right font-semibold text-[10px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-xs text-slate-400">
                    {queue.length === 0
                      ? 'No records currently require verification.'
                      : 'No records match your search.'}
                  </td>
                </tr>
              ) : filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-[#F8FAF8] transition-colors h-[52px]">
                  <td className="px-4 py-3 text-slate-400 font-medium tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-[#0B1F33] tabular-nums">{item.displayId}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.ownerName}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.village}, {item.tehsil} · Surv {item.surveyNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                      <span className="tabular-nums font-semibold text-[#0F172A]">{item.overallConfidence}%</span>
                      <span className="text-[#475569]">· Review</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.validationIssues.length > 0 ? (
                      <div className="flex items-center text-xs text-[#0F172A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] mr-1.5 shrink-0" />
                        <span className="truncate max-w-xs" title={item.validationIssues[0].message}>
                          {item.validationIssues[0].message}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/verification/${item.id}`}
                      className="inline-flex items-center px-2.5 py-1 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold transition"
                    >
                      Review
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
