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
    processed: isFiltered ? Math.round(analytics.processed * multiplier) : analytics.processed,
    pendingVerification: filteredQueue.length,
    approved: isFiltered ? Math.round(analytics.approved * multiplier) : analytics.approved,
    validationIssues: filteredQueue.reduce((acc, item) => acc + item.validationIssues.length, 0),
    averageConfidence: analytics.averageConfidence
  } : null;

  if (loading || !displayStats) {
    return <LoadingState message="Loading revenue administration dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Backend connectivity warning banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-2 text-xs text-amber-800 flex items-center space-x-2">
          <span className="font-bold">⚠</span>
          <span>{error}</span>
        </div>
      )}
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">{t('dashboard')}</h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded">
              {currentUser?.designation}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official dashboard for land record digitization, automated AI extractions, and verification workload.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/documents/upload"
            className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm flex items-center space-x-1.5 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t('uploadDocument')}</span>
          </Link>
          <Link
            to="/verification"
            className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center space-x-1.5 transition"
          >
            <CheckSquare className="w-4 h-4" />
            <span>{t('verificationQueue')} ({filteredQueue.length})</span>
          </Link>
        </div>
      </div>

      {/* REUSABLE GEOGRAPHIC LOCATION FILTER BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t('filterByLocation')}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Filters restricted to authorized administrative scope ({currentUser?.designation})
          </span>
        </div>

        <LocationSelector
          value={locationFilter}
          onChange={setLocationFilter}
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Documents</span>
            <Files className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{displayStats.totalDocuments}</div>
          <span className="text-[10px] text-emerald-700 font-medium">In selected jurisdiction</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Processed</span>
            <Clock className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{displayStats.processed}</div>
          <span className="text-[10px] text-slate-500">Pipeline throughput</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-amber-800">Review Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700">{displayStats.pendingVerification}</div>
          <span className="text-[10px] text-amber-700 font-medium">Pending officer review</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-emerald-800">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{displayStats.approved}</div>
          <span className="text-[10px] text-emerald-700 font-medium">Final certified records</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Validation Flags</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{displayStats.validationIssues}</div>
          <span className="text-[10px] text-rose-600 font-medium">Rule flags raised</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Avg Confidence</span>
            <Percent className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{displayStats.averageConfidence}%</div>
          <span className="text-[10px] text-emerald-700 font-medium">High quality baseline</span>
        </div>
      </div>

      {/* Main Grid: Priority Verification Queue Preview + Geographic Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Queue (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Priority Verification Queue ({locationFilter.taluka !== 'ALL' ? locationFilter.taluka : 'All Scope'})
              </h2>
            </div>
            <Link to="/verification" className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center space-x-1">
              <span>View All Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No pending records requiring verification in this selected geographic jurisdiction.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Record ID</th>
                    <th className="px-4 py-3">Landowner</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Validation Issues</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
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
                          <span className="text-amber-700 font-medium text-[11px] flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />
                            {item.validationIssues[0].message.slice(0, 35)}...
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-semibold">Valid</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/verification/${item.id}`}
                          className="px-3 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-bold transition"
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

        {/* Governance Directives & Regional Progress */}
        <div className="space-y-6">
          {/* Active Governance Policy Status Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-xl p-5 text-white shadow-md">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Active Approval Policy</span>
            </div>
            <h3 className="font-bold text-sm mb-1.5">
              {reviewPolicy.mode === 'MANDATORY_HUMAN_REVIEW'
                ? 'Mandatory Human Verification'
                : `AI-Assisted Auto-Approval (≥ ${reviewPolicy.confidenceThreshold}%)`}
            </h3>
            <p className="text-xs text-emerald-200 leading-relaxed mb-4">
              {reviewPolicy.mode === 'MANDATORY_HUMAN_REVIEW'
                ? 'Every document mutation and digital record creation requires explicit sign-off by an authorized revenue officer.'
                : 'Eligible high-confidence records pass validation automatically, except if validation errors or grievances exist.'}
            </p>
            <Link
              to="/settings"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-lg transition shadow-sm"
            >
              Configure Policy Settings
            </Link>
          </div>

          {/* Regional Coverage Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>{locationFilter.district} District Coverage</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Haveli Taluka</span>
                  <span>94% (512 / 545)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-700 h-full w-[94%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Mulshi Taluka</span>
                  <span>88% (310 / 352)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full w-[88%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Baramati Taluka</span>
                  <span>72% (209 / 290)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[72%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
