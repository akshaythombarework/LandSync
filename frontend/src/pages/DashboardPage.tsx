import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ApiService } from '../services/api';
import { mockApi } from '../services/mockApi';
import { AnalyticsSummary, LandRecord } from '../types';
import { StatusBadge, ConfidenceBadge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/FeedbackStates';
import { LocationSelector, LocationFilterState } from '../components/ui/LocationSelector';
import { PageHeader } from '../components/ui/PageHeader';
import { 
  Files, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Percent, 
  ArrowRight, 
  UploadCloud, 
  MapPin, 
  CheckSquare,
  ShieldCheck,
  Filter
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentUser, reviewPolicy } = useAuth();
  const { t } = useLanguage();

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [queue, setQueue] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reusable Geographic Filter State
  const [locationFilter, setLocationFilter] = useState<LocationFilterState>({
    country: 'India',
    state: currentUser?.scope?.state || 'Maharashtra',
    district: currentUser?.scope?.district || 'Pune',
    taluka: (currentUser?.scope?.taluka || currentUser?.scope?.tehsil) || (currentUser?.role === 'tehsildar' ? 'Haveli' : 'ALL'),
    village: currentUser?.scope?.village || (currentUser?.role === 'talathi' ? 'Wagholi' : 'ALL'),
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [stats, verificationItems] = await Promise.all([
          mockApi.getAnalytics(),
          mockApi.getVerificationQueue(),
        ]);
        setAnalytics(stats);
        setQueue(verificationItems);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
        setError('Failed to load dashboard data. Showing cached data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter verification queue by selected geographic scope
  const filteredQueue = queue.filter(item => {
    if (locationFilter.district && item.district.toLowerCase() !== locationFilter.district.toLowerCase()) {
      return false;
    }
    if (locationFilter.taluka && locationFilter.taluka !== 'ALL' && item.tehsil.toLowerCase() !== locationFilter.taluka.toLowerCase()) {
      return false;
    }
    if (locationFilter.village && locationFilter.village !== 'ALL' && item.village.toLowerCase() !== locationFilter.village.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Calculate geographically scaled KPI statistics
  const isFiltered = locationFilter.taluka !== 'ALL' || locationFilter.village !== 'ALL';
  const multiplier = locationFilter.village !== 'ALL' ? 0.25 : locationFilter.taluka !== 'ALL' ? 0.45 : 1;

  const displayStats = analytics ? {
    totalDocuments: isFiltered ? Math.max(filteredQueue.length + 3, Math.round(analytics.totalDocuments * multiplier)) : analytics.totalDocuments,
    pendingVerification: filteredQueue.length,
    approved: isFiltered ? Math.round(analytics.approved * multiplier) : analytics.approved,
    averageConfidence: analytics.averageConfidence
  } : null;

  if (loading || !displayStats) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Backend connectivity warning */}
      {error && (
        <div className="bg-amber-50 border border-amber-300 rounded px-4 py-2 text-xs text-amber-800 flex items-center space-x-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        category="Revenue Administration"
        title={t('dashboard')}
        actions={
          <>
            <Link
              to="/documents/upload"
              className="px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-[#166534] hover:bg-[#14532D] text-white flex items-center space-x-1.5 transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-white" />
              <span>{t('uploadDocument')}</span>
            </Link>
            <Link
              to="/verification"
              className="px-3 py-1.5 text-xs font-semibold rounded-[6px] border border-[#CBD5E1] text-slate-700 bg-white hover:bg-slate-50 flex items-center space-x-1.5 transition cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <CheckSquare className="w-4 h-4 text-[#475569]" />
              <span>{t('verificationQueue')} ({filteredQueue.length})</span>
            </Link>
          </>
        }
      />

      <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center space-x-2 mb-2.5">
          <Filter className="w-4 h-4 text-[#475569]" />
          <span className="text-xs font-semibold text-slate-700">
            Geographic filter
          </span>
          <span className="text-xs text-slate-500 ml-auto">
            Scope: State-wide
          </span>
        </div>
        <LocationSelector
          value={locationFilter}
          onChange={setLocationFilter}
          className="[&_span.uppercase]:normal-case [&_span.uppercase]:tracking-normal [&_span.uppercase]:text-slate-700"
        />
      </div>

      {/* KPI Row — 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Documents</span>
            <Files className="w-4 h-4 text-[#475569]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] tabular-nums">{displayStats.totalDocuments}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Review Required</span>
          </div>
          <div className="text-2xl font-bold text-[#D97706] tabular-nums">{displayStats.pendingVerification}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Approved</span>
          </div>
          <div className="text-2xl font-bold text-[#15803D] tabular-nums">{displayStats.approved}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Avg Confidence</span>
            <Percent className="w-4 h-4 text-[#475569]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] tabular-nums">{displayStats.averageConfidence}%</div>
        </div>
      </div>

      {/* Main Grid: Queue + Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Queue (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-700">
              Verification queue
            </h2>
            <Link to="/verification" className="text-xs text-[#166534] hover:text-[#14532D] font-semibold flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No pending records in this jurisdiction.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-white text-slate-500 border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold text-[10px]">Record ID</th>
                    <th className="px-4 py-2.5 font-semibold text-[10px]">Landowner</th>
                    <th className="px-4 py-2.5 font-semibold text-[10px]">Location</th>
                    <th className="px-4 py-2.5 font-semibold text-[10px]">Confidence</th>
                    <th className="px-4 py-2.5 font-semibold text-[10px]">Flags</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-[10px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map(item => (
                    <tr key={item.id} className="hover:bg-[#F8FAF8] transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-[#0B1F33] tabular-nums">{item.displayId}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{item.ownerName}</td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {item.village}, {item.tehsil}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`tabular-nums font-semibold text-xs ${item.overallConfidence >= 90 ? 'text-[#15803D]' : item.overallConfidence >= 75 ? 'text-[#D97706]' : 'text-[#DC2626]'}`}>
                          {item.overallConfidence}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {item.validationIssues.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 tabular-nums">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                            {item.validationIssues.length} flag{item.validationIssues.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                            Clear
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          to={`/verification/${item.id}`}
                          className="px-2.5 py-1 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold transition inline-block"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Active Policy */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 text-slate-900">
            <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-[#475569]" />
              <span className="text-xs font-semibold text-slate-700">Approval policy</span>
            </div>
            <h3 className="font-bold text-sm mb-1 text-[#0F172A]">
              {reviewPolicy.mode === 'MANDATORY_HUMAN_REVIEW'
                ? 'Mandatory Human Verification'
                : `Auto-Approval ≥ ${reviewPolicy.confidenceThreshold}%`}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              {reviewPolicy.mode === 'MANDATORY_HUMAN_REVIEW'
                ? 'Officer sign-off required for every record.'
                : 'High-confidence records auto-approve unless validation errors exist.'}
            </p>
            <Link
              to="/settings"
              className="inline-flex items-center justify-center w-full px-3 py-1.5 bg-[#166534] hover:bg-[#14532D] text-white font-semibold text-xs rounded-[6px] transition"
            >
              Configure Policy
            </Link>
          </div>

          {/* Regional Coverage */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4">
            <h3 className="text-xs font-semibold text-slate-700 mb-3 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-[#475569]" />
              <span>Coverage — {locationFilter.district}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Haveli Taluka</span>
                  <span className="text-slate-500 tabular-nums">94% (512 / 545)</span>
                </div>
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className="bg-[#15803D] h-full w-[94%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Mulshi Taluka</span>
                  <span className="text-slate-500 tabular-nums">88% (310 / 352)</span>
                </div>
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className="bg-[#15803D] h-full w-[88%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Baramati Taluka</span>
                  <span className="text-slate-500 tabular-nums">72% (209 / 290)</span>
                </div>
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className="bg-[#D97706] h-full w-[72%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
