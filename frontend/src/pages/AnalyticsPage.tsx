import React, { useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';
import { ApiService } from '../services/api';
import { AnalyticsSummary } from '../types';
import type {
  ProcessingStats,
  LanguagePerformance,
  DocumentTypePerformance,
  RegionalProgress,
  HumanReviewQueueMetrics,
  IntegrationStatus,
} from '../types/intelligence';
import { LoadingState } from '../components/ui/FeedbackStates';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  PieChart as PieIcon,
  MapPin,
  Cpu,
  Globe,
  FileType,
  Users,
  Link2,
} from 'lucide-react';
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
  Legend,
  CartesianGrid
} from 'recharts';
import { AnalyticsSlot, IntegrationStatusCard } from '../components/ui/IntelligenceCards';
import { PageHeader } from '../components/ui/PageHeader';

export const AnalyticsPage: React.FC = () => {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Round-2 expansion state
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [languagePerf, setLanguagePerf] = useState<LanguagePerformance | null>(null);
  const [docTypePerf, setDocTypePerf] = useState<DocumentTypePerformance | null>(null);
  const [regionalProgress, setRegionalProgress] = useState<RegionalProgress | null>(null);
  const [reviewQueueMetrics, setReviewQueueMetrics] = useState<HumanReviewQueueMetrics | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);

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

      // Load Round-2 intelligence metrics (non-blocking)
      ApiService.getProcessingStats().then(s => setProcessingStats(s));
      ApiService.getLanguagePerformance().then(l => setLanguagePerf(l));
      ApiService.getDocumentTypePerformance().then(d => setDocTypePerf(d));
      ApiService.getRegionalProgress().then(r => setRegionalProgress(r));
      ApiService.getHumanReviewQueueMetrics().then(m => setReviewQueueMetrics(m));
      ApiService.getIntegrationStatus().then(i => setIntegrations(i));
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
    { name: t('Auto-Verified Valid'), value: 890, color: '#15803D' },
    { name: t('Officer Review Required'), value: 240, color: '#D97706' },
    { name: t('Reference Mismatches'), value: 95, color: '#DC2626' },
    { name: t('Duplicate Warnings'), value: 23, color: '#475569' },
  ];

  const confidenceData = [
    { range: `90-100% (${t('High')})`, count: 820, fill: '#15803D' },
    { range: `70-89% (${t('Medium')})`, count: 310, fill: '#D97706' },
    { range: `<70% (${t('Low / Review')})`, count: 118, fill: '#DC2626' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Analytics"
      />

      {/* Top Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-semibold text-slate-500">{t('Total Documents')}</span>
          <div className="text-2xl font-bold text-[#0F172A] mt-1 tabular-nums">{analytics.totalDocuments}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-semibold text-slate-500">{t('Approved Records')}</span>
          <div className="text-2xl font-bold text-[#15803D] mt-1 tabular-nums">{analytics.approved}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-semibold text-slate-500">{t('Pending Review')}</span>
          <div className="text-2xl font-bold text-[#D97706] mt-1 tabular-nums">{analytics.pendingVerification}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-semibold text-slate-500">{t('Avg Accuracy')}</span>
          <div className="text-2xl font-bold text-[#0F172A] mt-1 tabular-nums">{analytics.averageConfidence}%</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Throughput Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-700">
              Monthly processing
            </h3>
            <span className="text-xs text-slate-500 tabular-nums">Apr – Sep 2026</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyThroughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, paddingTop: 10, color: '#0F172A' }} />
                <Bar dataKey="Uploaded" name={t('Uploaded')} fill="#94A3B8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Approved" name={t('Approved')} fill="#166534" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Flagged" name={t('Flagged')} fill="#D97706" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Validation Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-3">
          <h3 className="text-xs font-semibold text-slate-700">
            {t('Validation outcomes')}
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
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, color: '#0F172A' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Distribution (12 cols) */}
        <div className="lg:col-span-12 bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#0F172A]">
              {t('Confidence distribution')}
            </h3>
            <span className="text-xs text-slate-500 tabular-nums">{t('Total Fields Evaluated: 1,248')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {confidenceData.map(c => (
              <div key={c.range} className="p-4 rounded-lg bg-white border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <span className="text-xs font-semibold text-slate-600">{c.range}</span>
                <div className="text-2xl font-bold mt-1 tabular-nums" style={{ color: c.fill }}>
                  {c.count} {t('fields')}
                </div>
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(c.count / 1248) * 100}%`, backgroundColor: c.fill }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Round-2 Analytics Expansion Slots ─────────────────────────────── */}
      <div className="border-t border-[#E2E8F0] pt-6 space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-slate-700">Processing metrics</h2>
        </div>

        {/* Row 1: Processing Stats + Human Review Queue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnalyticsSlot
            title="Processing statistics"
            icon={<Cpu className="w-4 h-4 text-[#475569]" />}
            hasData={!!(processingStats && processingStats.status === 'AVAILABLE')}
          >
            {processingStats?.status === 'AVAILABLE' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {processingStats.totalProcessed !== undefined && (
                  <div>
                    <span className="text-slate-400 block">Total Processed</span>
                    <span className="font-bold text-slate-800 text-lg tabular-nums">{processingStats.totalProcessed}</span>
                  </div>
                )}
                {processingStats.failureRate !== undefined && (
                  <div>
                    <span className="text-slate-400 block">Failure Rate</span>
                    <span className="font-bold text-[#DC2626] text-lg tabular-nums">{(processingStats.failureRate * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}
          </AnalyticsSlot>

          <AnalyticsSlot
            title="Human review queue"
            icon={<Users className="w-4 h-4 text-[#475569]" />}
            hasData={!!(reviewQueueMetrics && reviewQueueMetrics.status === 'AVAILABLE')}
          >
            {reviewQueueMetrics?.status === 'AVAILABLE' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {reviewQueueMetrics.queueLength !== undefined && (
                  <div>
                    <span className="text-slate-400 block">Queue Length</span>
                    <span className="font-bold text-[#D97706] text-lg tabular-nums">{reviewQueueMetrics.queueLength}</span>
                  </div>
                )}
                {reviewQueueMetrics.correctionRate !== undefined && (
                  <div>
                    <span className="text-slate-400 block">Correction Rate</span>
                    <span className="font-bold text-[#166534] text-lg tabular-nums">{(reviewQueueMetrics.correctionRate * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}
          </AnalyticsSlot>
        </div>

        {/* Row 2: Language Performance + Document Type Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnalyticsSlot
            title="Language and script performance"
            icon={<Globe className="w-4 h-4 text-[#475569]" />}
            hasData={!!(languagePerf && languagePerf.status === 'AVAILABLE' && languagePerf.breakdown?.length)}
          >
            {languagePerf?.status === 'AVAILABLE' && languagePerf.breakdown && (
              <div className="space-y-1.5 text-xs">
                {languagePerf.breakdown.map(l => (
                  <div key={l.language} className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-700">{l.language}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400 tabular-nums">{l.documentCount} docs</span>
                      {l.averageConfidence !== undefined && (
                        <span className="font-bold text-[#15803D] tabular-nums">{l.averageConfidence}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AnalyticsSlot>

          <AnalyticsSlot
            title="Document-type performance"
            icon={<FileType className="w-4 h-4 text-[#475569]" />}
            hasData={!!(docTypePerf && docTypePerf.status === 'AVAILABLE' && docTypePerf.breakdown?.length)}
          >
            {docTypePerf?.status === 'AVAILABLE' && docTypePerf.breakdown && (
              <div className="space-y-1.5 text-xs">
                {docTypePerf.breakdown.map(d => (
                  <div key={d.documentType} className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-700">{d.documentType}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400 tabular-nums">{d.documentCount} docs</span>
                      {d.averageConfidence !== undefined && (
                        <span className="font-bold text-[#15803D] tabular-nums">{d.averageConfidence}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AnalyticsSlot>
        </div>

        {/* Row 3: Regional Progress */}
        <AnalyticsSlot
          title="Regional progress"
          icon={<MapPin className="w-4 h-4 text-[#475569]" />}
          hasData={!!(regionalProgress && regionalProgress.status === 'AVAILABLE' && regionalProgress.breakdown?.length)}
        >
          {regionalProgress?.status === 'AVAILABLE' && regionalProgress.breakdown && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="text-left py-1 pr-4 font-medium">District</th>
                    <th className="text-left py-1 pr-4 font-medium">State</th>
                    <th className="text-right py-1 pr-4 font-medium">Total</th>
                    <th className="text-right py-1 font-medium">Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalProgress.breakdown.map((r, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-1.5 pr-4 font-medium text-slate-700">{r.district}</td>
                      <td className="py-1.5 pr-4 text-slate-500">{r.state}</td>
                      <td className="py-1.5 pr-4 text-right text-slate-800 tabular-nums">{r.totalRecords}</td>
                      <td className="py-1.5 text-right font-bold text-[#15803D] tabular-nums">{r.approvedRecords}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AnalyticsSlot>
      </div>

    </div>
  );
};


