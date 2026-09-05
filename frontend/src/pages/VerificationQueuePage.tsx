import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { mockApi } from '../services/mockApi';
import { LandRecord } from '../types';
import { ConfidenceBadge, StatusBadge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/FeedbackStates';
import { CheckSquare, AlertTriangle, ArrowRight, Filter, Search, ShieldAlert, ShieldOff } from 'lucide-react';

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
        <ShieldOff className="w-10 h-10 text-red-400" />
        <h2 className="text-base font-bold text-slate-800">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Your current role does not have permission to access the verification queue.
          Please contact your system administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <p className="text-sm font-semibold text-slate-700">{error}</p>
        <button onClick={() => window.location.reload()} className="text-xs text-blue-600 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-black text-slate-900">Officer Verification Queue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized cases requiring human correction due to low AI confidence, format errors, or reference mismatches.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>{queue.length} Cases Requiring Officer Review</span>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by owner, survey #, or village..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">Priority sorted by lowest confidence</span>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Record ID</th>
                <th className="px-4 py-3">Landowner</th>
                <th className="px-4 py-3">Location & Parcel</th>
                <th className="px-4 py-3">AI Confidence</th>
                <th className="px-4 py-3">Validation Warning</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-xs text-slate-400">
                    {queue.length === 0
                      ? 'No records currently require verification. All records have been processed.'
                      : 'No records match your search.'}
                  </td>
                </tr>
              ) : filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                      P{idx + 1} High
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-900">{item.displayId}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.ownerName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.village}, {item.tehsil} (Surv: {item.surveyNumber})
                  </td>
                  <td className="px-4 py-3">
                    <ConfidenceBadge confidence={item.overallConfidence} />
                  </td>
                  <td className="px-4 py-3">
                    {item.validationIssues.length > 0 ? (
                      <div className="flex items-center text-amber-700 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500 shrink-0" />
                        <span className="truncate max-w-xs">{item.validationIssues[0].message}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/verification/${item.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-bold transition shadow-xs"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
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
