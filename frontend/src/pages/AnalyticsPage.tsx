import React, { useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';
import { AnalyticsSummary } from '../types';
import { LoadingState } from '../components/ui/FeedbackStates';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, TrendingUp, CheckCircle2, AlertTriangle, PieChart as PieIcon, MapPin } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await mockApi.getAnalytics();
        setAnalytics(data);
      } catch (e) {
        console.error('Analytics fetch error:', e);
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !analytics) {
    return <LoadingState message={t("Loading administrative analytics...")} />;
  }

  if (error && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <BarChart3 className="w-8 h-8 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">{error}</p>
        <button onClick={() => window.location.reload()} className="text-xs text-blue-600 underline">Retry</button>
      </div>
    );
  }

  // Sample data for Recharts
  const monthlyThroughputData = [
    { month: t('Apr'), Uploaded: 180, Approved: 145, Flagged: 35 },
    { month: t('May'), Uploaded: 240, Approved: 210, Flagged: 30 },
    { month: t('Jun'), Uploaded: 310, Approved: 275, Flagged: 35 },
    { month: t('Jul'), Uploaded: 290, Approved: 250, Flagged: 40 },
    { month: t('Aug'), Uploaded: 380, Approved: 330, Flagged: 50 },
    { month: t('Sep'), Uploaded: 120, Approved: 105, Flagged: 15 },
  ];

  const validationDistribution = [
    { name: t('Auto-Verified Valid'), value: 890, color: '#059669' },
    { name: t('Officer Review Required'), value: 240, color: '#d97706' },
    { name: t('Reference Mismatches'), value: 95, color: '#e11d48' },
    { name: t('Duplicate Warnings'), value: 23, color: '#9333ea' },
  ];

  const confidenceData = [
    { range: `90-100% (${t('High')})`, count: 820, fill: '#059669' },
    { range: `70-89% (${t('Medium')})`, count: 310, fill: '#d97706' },
    { range: `<70% (${t('Low / Review')})`, count: 118, fill: '#e11d48' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-emerald-800" />
          <span>{t('Operational Analytics & Intelligence Metrics')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('Real-time metrics on processing throughput, validation status, confidence distribution, and geographic progress.')}
        </p>
      </div>

      {/* Top Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">{t('Total Documents')}</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{analytics.totalDocuments}</div>
          <span className="text-[10px] text-emerald-700 font-medium">{t('93.3% processed rate')}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">{t('Approved Digital Records')}</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{analytics.approved}</div>
          <span className="text-[10px] text-slate-500">{t('Certified by officers')}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">{t('Pending Review')}</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{analytics.pendingVerification}</div>
          <span className="text-[10px] text-amber-700 font-medium">{t('Active queue workload')}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">{t('Average Extraction Accuracy')}</span>
          <div className="text-2xl font-black text-emerald-900 mt-1">{analytics.averageConfidence}%</div>
          <span className="text-[10px] text-emerald-700 font-medium">{t('Field-weighted score')}</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Throughput Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('Monthly Processing & Approval Throughput')}
            </h3>
            <span className="text-[11px] text-slate-400">{t('Apr - Sep 2026')}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyThroughputData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Uploaded" name={t('Uploaded')} fill="#6ee7b7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Approved" name={t('Approved')} fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Flagged" name={t('Flagged')} fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Validation Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            {t('Validation Outcome Distribution')}
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={validationDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {validationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Distribution (12 cols) */}
        <div className="lg:col-span-12 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('Field-Level AI Confidence Distribution')}
            </h3>
            <span className="text-[11px] text-slate-400">{t('Total Fields Evaluated: 1,248')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {confidenceData.map(c => (
              <div key={c.range} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-600">{c.range}</span>
                <div className="text-2xl font-black mt-1" style={{ color: c.fill }}>
                  {c.count} {t('fields')}
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(c.count / 1248) * 100}%`, backgroundColor: c.fill }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
