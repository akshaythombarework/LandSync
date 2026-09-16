/**
 * IntelligenceCards — Reusable UI shells for Round-2 backend intelligence surfaces.
 *
 * All components render professional empty/awaiting states when backend data
 * is unavailable. No values are fabricated or hard-coded.
 */
import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Info,
  Shield,
  Copy,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  FileSearch,
  Layers,
  GitMerge,
  BarChart2,
  Activity,
  Link2,
  ArrowRight,
  History,
  MessageSquare,
  X,
} from 'lucide-react';
import {
  DocumentQuality,
  DocumentClassification,
  OCREvidence,
  LayoutEvidence,
  NormalizationInfo,
  MasterDataMatch,
  DuplicateCandidate,
  ConflictSummary,
  RecordRisk,
  ReviewRouting,
  FlagExplanation,
  CorrectionFeedback,
  CorrectionHistoryEntry,
  GisLinkageInfo,
  IntegrationStatus,
  DataAvailability,
  MasterDataMatchState,
  RiskLevel,
  DuplicateStatus,
  FeedbackCategory,
  PageInfo,
} from '../../types/intelligence';
import { SeverityBadge } from './Badge';

// ─── Shared utility ─────────────────────────────────────────────────────────

const PanelShell: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}> = ({ title, icon, children, collapsible = false, defaultOpen = true, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={() => collapsible && setOpen(o => !o)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-slate-500">{icon}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</span>
          {badge && <span className="ml-2">{badge}</span>}
        </div>
        {collapsible && (
          <span className="text-slate-400">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
      </div>
      {(!collapsible || open) && <div className="p-4">{children}</div>}
    </div>
  );
};

const AwaitingState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
    <Clock className="w-6 h-6 text-slate-300" />
    <p className="text-xs text-slate-400">{message}</p>
  </div>
);

const ProcessingState: React.FC<{ message?: string }> = ({ message = 'Processing…' }) => (
  <div className="flex items-center space-x-2 py-4 justify-center text-blue-600">
    <Clock className="w-4 h-4 animate-spin" />
    <span className="text-xs font-medium">{message}</span>
  </div>
);

const FailedState: React.FC<{ message?: string }> = ({ message = 'Analysis failed.' }) => (
  <div className="flex items-center space-x-2 py-4 justify-center text-red-500">
    <XCircle className="w-4 h-4" />
    <span className="text-xs font-medium">{message}</span>
  </div>
);

function availabilityStateEl(status: DataAvailability, emptyMsg: string) {
  if (status === 'PROCESSING') return <ProcessingState />;
  if (status === 'FAILED') return <FailedState />;
  return <AwaitingState message={emptyMsg} />;
}

// ─── Match State Badge ───────────────────────────────────────────────────────

const MatchStateBadge: React.FC<{ state: MasterDataMatchState }> = ({ state }) => {
  switch (state) {
    case 'MATCH':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Match
        </span>
      );
    case 'PARTIAL_MATCH':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1" /> Partial
        </span>
      );
    case 'MISMATCH':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 mr-1" /> Mismatch
        </span>
      );
    case 'NOT_CHECKED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
          <HelpCircle className="w-3 h-3 mr-1" /> Not Checked
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-400 border border-slate-100">
          Unavailable
        </span>
      );
  }
};

// ─── Risk Level Badge ────────────────────────────────────────────────────────

const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  switch (level) {
    case 'LOW':
      return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">LOW</span>;
    case 'MEDIUM':
      return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">MEDIUM</span>;
    case 'HIGH':
      return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800">HIGH</span>;
    case 'CRITICAL':
      return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 animate-pulse">CRITICAL</span>;
    default:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-400">N/A</span>;
  }
};

// ─── Duplicate Status Badge ──────────────────────────────────────────────────

const DuplicateBadge: React.FC<{ status: DuplicateStatus }> = ({ status }) => {
  switch (status) {
    case 'NO_DUPLICATE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1" /> No Duplicate
        </span>
      );
    case 'POTENTIAL_DUPLICATE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1" /> Potential Duplicate
        </span>
      );
    case 'CONFIRMED_DUPLICATE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          <AlertOctagon className="w-3 h-3 mr-1" /> Confirmed Duplicate
        </span>
      );
    case 'NOT_CHECKED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
          <HelpCircle className="w-3 h-3 mr-1" /> Not Checked
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-400">
          Unavailable
        </span>
      );
  }
};

// ─── Feedback Category Label Map ─────────────────────────────────────────────

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  ocr_error: 'OCR Error',
  extraction_error: 'Extraction Error',
  normalization_error: 'Normalization Error',
  classification_error: 'Classification Error',
  validation_false_positive: 'Validation False Positive',
  missing_field: 'Missing Field',
  wrong_field_mapping: 'Wrong Field Mapping',
  handwriting_interpretation: 'Handwriting Interpretation',
  other: 'Other',
};

// ═══════════════════════════════════════════════════════════════════════════════
// A. DOCUMENT QUALITY CARD
// ═══════════════════════════════════════════════════════════════════════════════

export const DocumentQualityCard: React.FC<{ quality?: DocumentQuality }> = ({ quality }) => (
  <PanelShell
    title="Document Quality"
    icon={<Activity className="w-4 h-4" />}
    collapsible
    defaultOpen
  >
    {!quality || quality.status === 'NOT_AVAILABLE' ? (
      <AwaitingState message="Quality assessment will appear after document analysis." />
    ) : quality.status === 'PROCESSING' ? (
      <ProcessingState message="Analysing document quality…" />
    ) : quality.status === 'FAILED' ? (
      <FailedState message="Quality analysis failed. Please retry processing." />
    ) : (
      <div className="space-y-3">
        {/* Overall score */}
        {quality.overallScore !== undefined && (
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-600">Overall Quality Score</span>
            <span className={`text-sm font-black ${quality.overallScore >= 80 ? 'text-emerald-700' : quality.overallScore >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
              {quality.overallScore}/100
            </span>
          </div>
        )}

        {/* Metric grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { key: 'clarity', label: 'Clarity', metric: quality.clarity },
            { key: 'contrast', label: 'Contrast', metric: quality.contrast },
            { key: 'noise', label: 'Noise', metric: quality.noise },
            { key: 'skew', label: 'Skew', metric: quality.skew },
            { key: 'visibility', label: 'Visibility', metric: quality.visibility },
            { key: 'damage', label: 'Damage', metric: quality.damage },
          ].map(({ key, label, metric }) => (
            <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
              <span className="text-slate-500">{label}</span>
              {metric?.score !== undefined ? (
                <span className={`font-bold ${metric.score >= 80 ? 'text-emerald-700' : metric.score >= 60 ? 'text-amber-700' : 'text-red-600'}`}>
                  {metric.score}%
                </span>
              ) : (
                <span className="text-slate-300 text-[10px]">—</span>
              )}
            </div>
          ))}
        </div>

        {/* Handwriting indicator */}
        {quality.hasHandwriting !== undefined && (
          <div className="flex items-center space-x-2 text-xs pt-1">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="text-slate-600">
              Handwriting detected: <strong>{quality.hasHandwriting ? 'Yes' : 'No'}</strong>
            </span>
          </div>
        )}

        {/* Warnings */}
        {quality.qualityWarnings && quality.qualityWarnings.length > 0 && (
          <div className="space-y-1 pt-1">
            {quality.qualityWarnings.map((w, i) => (
              <div key={i} className="flex items-start space-x-1.5 text-[11px] text-amber-800">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </PanelShell>
);

// ═══════════════════════════════════════════════════════════════════════════════
// B. DOCUMENT CLASSIFICATION CARD
// ═══════════════════════════════════════════════════════════════════════════════

export const DocumentClassificationCard: React.FC<{ classification?: DocumentClassification }> = ({ classification }) => (
  <PanelShell
    title="Document Classification"
    icon={<Layers className="w-4 h-4" />}
    collapsible
    defaultOpen
  >
    {!classification || classification.status === 'NOT_AVAILABLE' ? (
      <AwaitingState message="Classification will appear after document analysis." />
    ) : classification.status === 'PROCESSING' ? (
      <ProcessingState message="Classifying document…" />
    ) : classification.status === 'FAILED' ? (
      <FailedState message="Classification failed." />
    ) : (
      <div className="space-y-2 text-xs">
        <Row label="Document Type" value={classification.documentType} />
        <Row label="Detected Template" value={classification.detectedTemplate} />
        <Row label="Script / Language" value={[classification.script, classification.language].filter(Boolean).join(' / ') || undefined} />
        {classification.confidence !== undefined && (
          <div className="flex items-center justify-between py-1 border-t border-slate-100 mt-2">
            <span className="text-slate-500 font-medium">Classification Confidence</span>
            <span className={`font-bold ${classification.confidence >= 85 ? 'text-emerald-700' : classification.confidence >= 65 ? 'text-amber-700' : 'text-red-600'}`}>
              {classification.confidence}%
            </span>
          </div>
        )}
      </div>
    )}
  </PanelShell>
);

// Small helper row
const Row: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-2">
    <span className="text-slate-400 shrink-0">{label}</span>
    <span className="font-semibold text-slate-700 text-right">{value ?? <span className="text-slate-300">—</span>}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// C. PAGE NAVIGATOR (reusable multi-page widget)
// ═══════════════════════════════════════════════════════════════════════════════

export const PageNavigator: React.FC<{
  currentPage: number;
  totalPages: number;
  pages?: PageInfo[];
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, pages, onPageChange }) => (
  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
    <button
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage <= 1}
      className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-medium transition"
    >
      ← Prev
    </button>

    <div className="flex items-center space-x-1">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
        const info = pages?.find(pg => pg.pageNumber === p);
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            title={info?.processingStatus ? `Page ${p}: ${info.processingStatus}` : `Page ${p}`}
            className={`w-6 h-6 rounded text-[11px] font-bold transition ${
              p === currentPage
                ? 'bg-blue-600 text-white'
                : info?.hasWarnings
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : info?.processingStatus === 'FAILED'
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {p}
          </button>
        );
      })}
    </div>

    <button
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage >= totalPages}
      className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-medium transition"
    >
      Next →
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// D. OCR EVIDENCE CARD
// ═══════════════════════════════════════════════════════════════════════════════

export const OCREvidenceCard: React.FC<{ evidence?: OCREvidence }> = ({ evidence }) => (
  <PanelShell
    title="OCR Evidence"
    icon={<FileSearch className="w-4 h-4" />}
    collapsible
    defaultOpen={false}
  >
    {!evidence || evidence.status === 'NOT_AVAILABLE' ? (
      <AwaitingState message="OCR evidence is not available for this document yet." />
    ) : evidence.status === 'PROCESSING' ? (
      <ProcessingState message="Running OCR analysis…" />
    ) : evidence.status === 'FAILED' ? (
      <FailedState message="OCR analysis failed." />
    ) : (
      <div className="space-y-3 text-xs">
        {evidence.ocrText && (
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-[11px] text-slate-800 leading-relaxed">
            {evidence.ocrText}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Row label="Source Page" value={evidence.sourcePage !== undefined ? `Page ${evidence.sourcePage}` : undefined} />
          <Row label="Language / Script" value={[evidence.language, evidence.script].filter(Boolean).join(' / ') || undefined} />
          {evidence.sourceRegion && (
            <Row label="Bounding Box" value={`[${evidence.sourceRegion.join(', ')}]`} />
          )}
          {evidence.confidence !== undefined && (
            <Row label="OCR Confidence" value={`${evidence.confidence}%`} />
          )}
          {evidence.linkedFieldName && (
            <Row label="Linked Field" value={evidence.linkedFieldName} />
          )}
        </div>
        <p className="text-[10px] text-slate-400 italic">
          Future document viewer overlay will highlight this region in the source image.
        </p>
      </div>
    )}
  </PanelShell>
);

// ═══════════════════════════════════════════════════════════════════════════════
// E. LAYOUT EVIDENCE CARD
// ═══════════════════════════════════════════════════════════════════════════════

export const LayoutEvidenceCard: React.FC<{ evidence?: LayoutEvidence }> = ({ evidence }) => (
  <PanelShell
    title="Layout / Extraction Evidence"
    icon={<GitMerge className="w-4 h-4" />}
    collapsible
    defaultOpen={false}
  >
    {!evidence || evidence.status === 'NOT_AVAILABLE' ? (
      <AwaitingState message="Layout extraction evidence is not available yet." />
    ) : evidence.status === 'PROCESSING' ? (
      <ProcessingState message="Analysing document layout…" />
    ) : evidence.status === 'FAILED' ? (
      <FailedState message="Layout analysis failed." />
    ) : (
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <Row label="Page" value={evidence.page !== undefined ? `Page ${evidence.page}` : undefined} />
          <Row label="Region Type" value={evidence.regionType} />
          <Row label="Label" value={evidence.label} />
          {evidence.region && <Row label="Bounding Box" value={`[${evidence.region.join(', ')}]`} />}
          {evidence.confidence !== undefined && <Row label="Confidence" value={`${evidence.confidence}%`} />}
          {evidence.linkedFieldName && <Row label="Linked Field" value={evidence.linkedFieldName} />}
        </div>
        {evidence.extractedText && (
          <div className="mt-2">
            <span className="text-slate-400 block mb-1">Extracted Text</span>
            <div className="bg-blue-50 border border-blue-200 rounded p-2 font-mono text-[11px] text-blue-900">
              {evidence.extractedText}
            </div>
          </div>
        )}
        <div className="pt-1 text-[10px] text-slate-400 flex items-center space-x-1">
          <ArrowRight className="w-3 h-3" />
          <span>Source Document → Detected Region → Extracted Candidate → Structured Field</span>
        </div>
      </div>
    )}
  </PanelShell>
);

// ═══════════════════════════════════════════════════════════════════════════════
// F. NORMALIZATION DISPLAY (inline, for use within field rows)
// ═══════════════════════════════════════════════════════════════════════════════

export const NormalizationDisplay: React.FC<{ info?: NormalizationInfo }> = ({ info }) => {
  if (!info || info.status === 'UNAVAILABLE') return null;

  if (info.status === 'NOT_NORMALIZED') {
    return (
      <span className="inline-flex items-center text-[10px] text-slate-400 ml-1">
        <Info className="w-3 h-3 mr-0.5" /> Not normalized
      </span>
    );
  }

  if (info.status === 'WARNING') {
    return (
      <span className="inline-flex items-center text-[10px] text-amber-700 ml-1">
        <AlertTriangle className="w-3 h-3 mr-0.5" /> Normalization warning
      </span>
    );
  }

  return (
    <div className="mt-1 flex items-start space-x-2 text-[11px] bg-blue-50 border border-blue-100 rounded p-1.5">
      <ArrowRight className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
      <div className="min-w-0">
        {info.originalValue && (
          <span className="text-slate-400 line-through mr-1">{info.originalValue}</span>
        )}
        {info.normalizedValue && (
          <span className="text-blue-800 font-semibold">{info.normalizedValue}</span>
        )}
        {info.normalizationRule && (
          <div className="text-[10px] text-slate-400 mt-0.5">{info.normalizationRule}</div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// G. MASTER DATA VERIFICATION PANEL
// ═══════════════════════════════════════════════════════════════════════════════

export const MasterDataVerificationPanel: React.FC<{ match?: MasterDataMatch }> = ({ match }) => (
  <PanelShell
    title="Master data verification"
    icon={<Shield className="w-4 h-4" />}
    collapsible
    defaultOpen={false}
  >
    {!match || match.status === 'NOT_AVAILABLE' ? (
      <AwaitingState message="Reference verification has not been completed." />
    ) : match.status === 'PROCESSING' ? (
      <ProcessingState message="Verifying against reference records…" />
    ) : match.status === 'FAILED' ? (
      <FailedState message="Master-data verification failed." />
    ) : (
      <div className="space-y-3 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-slate-500">Reference Source: <strong className="text-slate-700">{match.referenceSource ?? '—'}</strong></span>
          {match.overallMatchState && <MatchStateBadge state={match.overallMatchState} />}
        </div>

        {/* Field comparison table */}
        {match.fields && match.fields.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="text-left py-1 pr-2 font-medium">Field</th>
                  <th className="text-left py-1 pr-2 font-medium">Extracted</th>
                  <th className="text-left py-1 pr-2 font-medium">Reference</th>
                  <th className="text-left py-1 font-medium">Match</th>
                </tr>
              </thead>
              <tbody>
                {match.fields.map((f, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-1.5 pr-2 font-medium text-slate-600">{f.fieldLabel}</td>
                    <td className="py-1.5 pr-2 text-slate-800">{f.extractedValue ?? <span className="text-slate-300">—</span>}</td>
                    <td className="py-1.5 pr-2 text-slate-800">{f.referenceValue ?? <span className="text-slate-300">—</span>}</td>
                    <td className="py-1.5"><MatchStateBadge state={f.matchState} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400 text-[11px]">No field comparison data available yet.</p>
        )}

        {match.verifiedAt && (
          <p className="text-[10px] text-slate-400">Verified at: {match.verifiedAt}</p>
        )}
      </div>
    )}
  </PanelShell>
);

// ═══════════════════════════════════════════════════════════════════════════════
// H. DUPLICATE DETECTION PANEL
// ═══════════════════════════════════════════════════════════════════════════════

export const DuplicateDetectionPanel: React.FC<{ duplicate?: DuplicateCandidate }> = ({ duplicate }) => (
  <PanelShell
    title="Duplicate detection"
    icon={<Copy className="w-4 h-4" />}
    collapsible
    defaultOpen={false}
  >
    {!duplicate || duplicate.status === 'UNAVAILABLE' ? (
      <AwaitingState message="Duplicate analysis is pending." />
    ) : duplicate.status === 'NOT_CHECKED' ? (
      <AwaitingState message="Duplicate check has not been performed yet." />
    ) : (
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Status</span>
          <DuplicateBadge status={duplicate.status} />
        </div>

        {duplicate.candidateCount !== undefined && (
          <Row label="Candidate Matches" value={String(duplicate.candidateCount)} />
        )}
        {duplicate.matchStrength !== undefined && (
          <Row label="Match Strength" value={`${duplicate.matchStrength}%`} />
        )}
        {duplicate.matchedRecordId && (
          <Row label="Matched Record ID" value={duplicate.matchedRecordId} />
        )}
        {duplicate.matchedSurveyNumber && (
          <Row label="Matched Survey No." value={duplicate.matchedSurveyNumber} />
        )}
        {duplicate.matchedOwner && (
          <Row label="Matched Owner" value={duplicate.matchedOwner} />
        )}
        {duplicate.explanation && (
          <div className="bg-amber-50 border border-amber-100 rounded p-2 text-[11px] text-amber-900">
            {duplicate.explanation}
          </div>
        )}
      </div>
    )}
  </PanelShell>
);

// ═══════════════════════════════════════════════════════════════════════════════
// I. CONFLICT / ANOMALY PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const CONFLICT_TYPE_LABELS: Record<string, string> = {
  AREA_MISMATCH: 'Area Mismatch',
  OWNER_MISMATCH: 'Owner Mismatch',
  SURVEY_CONFLICT: 'Survey Conflict',
  CROSS_FIELD_INCONSISTENCY: 'Cross-Field Inconsistency',
  SPATIAL_INCONSISTENCY: 'Spatial Inconsistency',
  DUPLICATE_CANDIDATE: 'Duplicate Candidate',
  OTHER: 'Other',
};

export const ConflictAnomalyPanel: React.FC<{ summary?: ConflictSummary }> = ({ summary }) => {
  const count = summary?.conflicts?.length ?? 0;
  return (
    <PanelShell
      title="Conflicts and anomalies"
      icon={<AlertOctagon className="w-4 h-4" />}
      collapsible
      defaultOpen={count > 0}
      badge={count > 0 ? <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">{count}</span> : undefined}
    >
      {!summary || summary.status === 'NOT_AVAILABLE' ? (
        <AwaitingState message="Conflict analysis has not been performed." />
      ) : summary.status === 'PROCESSING' ? (
        <ProcessingState message="Detecting conflicts and anomalies…" />
      ) : summary.status === 'FAILED' ? (
        <FailedState message="Conflict analysis failed." />
      ) : count === 0 ? (
        <div className="flex items-center space-x-2 text-xs text-emerald-700 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>No conflicts or anomalies detected.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {summary.conflicts!.map(c => (
            <div key={c.id} className="border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  {CONFLICT_TYPE_LABELS[c.conflictType] ?? c.conflictType}
                </span>
                <SeverityBadge severity={c.severity} />
              </div>
              {c.affectedField && <Row label="Field" value={c.affectedField} />}
              {c.conflictingValues && (
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="text-slate-400">Extracted:</span>
                  <span className="font-medium text-slate-700">{c.conflictingValues.extracted ?? '—'}</span>
                  <span className="text-slate-300">vs</span>
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-medium text-slate-700">{c.conflictingValues.reference ?? '—'}</span>
                </div>
              )}
              {c.explanation && (
                <p className="text-[11px] text-slate-500 italic">{c.explanation}</p>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">{c.source}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  c.resolutionState === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' :
                  c.resolutionState === 'IGNORED' ? 'bg-slate-100 text-slate-500' :
                  c.resolutionState === 'ESCALATED' ? 'bg-orange-50 text-orange-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {c.resolutionState}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// J. RECORD RISK PANEL
// ═══════════════════════════════════════════════════════════════════════════════

export const RecordRiskPanel: React.FC<{ risk?: RecordRisk }> = ({ risk }) => (
  <PanelShell
    title="Overall record risk"
    icon={<AlertTriangle className="w-4 h-4" />}
    collapsible
    defaultOpen={false}
  >
    {!risk || risk.status === 'NOT_AVAILABLE' ? (
      <AwaitingState message="Risk assessment will be available after validation." />
    ) : risk.status === 'PROCESSING' ? (
      <ProcessingState message="Computing risk…" />
    ) : risk.status === 'FAILED' ? (
      <FailedState message="Risk assessment failed." />
    ) : (
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Risk Level</span>
          {risk.riskLevel ? <RiskBadge level={risk.riskLevel} /> : <span className="text-slate-300">—</span>}
        </div>

        {risk.riskScore !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Risk Score</span>
            <span className="font-bold text-slate-800">{risk.riskScore}/100</span>
          </div>
        )}

        {risk.criticalIssueCount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Critical Issues</span>
            <span className={`font-bold ${risk.criticalIssueCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {risk.criticalIssueCount}
            </span>
          </div>
        )}

        {risk.riskFactors && risk.riskFactors.length > 0 && (
          <div className="pt-1">
            <span className="text-slate-400 block mb-1">Risk Factors</span>
            <ul className="space-y-1">
              {risk.riskFactors.map((f, i) => (
                <li key={i} className="flex items-start space-x-1.5 text-[11px] text-slate-700">
                  <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {risk.requiresReview !== undefined && (
          <div className={`flex items-center space-x-2 rounded px-2 py-1.5 ${risk.requiresReview ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            {risk.requiresReview ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className={`text-[11px] font-semibold ${risk.requiresReview ? 'text-amber-800' : 'text-emerald-800'}`}>
              {risk.requiresReview ? 'Human review required' : 'No manual review required'}
            </span>
          </div>
        )}
      </div>
    )}
  </PanelShell>
);

// ═══════════════════════════════════════════════════════════════════════════════
// K. REVIEW ROUTING PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'text-red-700 bg-red-50 border-red-200',
  HIGH: 'text-orange-700 bg-orange-50 border-orange-200',
  NORMAL: 'text-blue-700 bg-blue-50 border-blue-200',
  LOW: 'text-slate-600 bg-slate-50 border-slate-200',
};

export const ReviewRoutingPanel: React.FC<{ routing?: ReviewRouting }> = ({ routing }) => (
  <PanelShell
    title="Review routing"
    icon={<Link2 className="w-4 h-4" />}
    collapsible
    defaultOpen={false}
  >
    {!routing || routing.status === 'NOT_AVAILABLE' ? (
      <AwaitingState message="Review routing will be assigned after validation." />
    ) : routing.status === 'PROCESSING' ? (
      <ProcessingState message="Determining review routing…" />
    ) : routing.status === 'FAILED' ? (
      <FailedState message="Review routing failed." />
    ) : !routing.reviewRequired ? (
      <div className="flex items-center space-x-2 text-xs text-emerald-700 py-3">
        <CheckCircle2 className="w-4 h-4" />
        <span>No human review required for this record.</span>
      </div>
    ) : (
      <div className="space-y-2 text-xs">
        <div className={`flex items-center space-x-2 rounded px-2.5 py-2 border ${PRIORITY_COLORS[routing.priority ?? 'NORMAL']}`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="font-bold">Review Required</span>
          {routing.priority && (
            <span className="ml-auto font-semibold text-[10px] uppercase tracking-wider">{routing.priority}</span>
          )}
        </div>

        {routing.routingReason && (
          <div className="pt-1 space-y-0.5">
            <span className="text-slate-400">Reason</span>
            <p className="text-slate-700 font-medium">{routing.routingReason}</p>
          </div>
        )}

        {routing.additionalReasons && routing.additionalReasons.map((r, i) => (
          <div key={i} className="flex items-start space-x-1.5 text-[11px] text-slate-600 pl-2">
            <span className="text-slate-300 mt-0.5">+</span>
            <span>{r}</span>
          </div>
        ))}

        <div className="grid grid-cols-2 gap-2 pt-1">
          {routing.reviewerRole && <Row label="Reviewer" value={routing.reviewerRole} />}
          {routing.jurisdiction && <Row label="Jurisdiction" value={routing.jurisdiction} />}
          {routing.criticalField && <Row label="Critical Field" value={routing.criticalField} />}
          {routing.routingRule && <Row label="Routing Rule" value={routing.routingRule} />}
          {routing.estimatedUrgency && <Row label="Urgency" value={routing.estimatedUrgency} />}
        </div>
      </div>
    )}
  </PanelShell>
);

// ═══════════════════════════════════════════════════════════════════════════════
// L. WHY WAS THIS FLAGGED — DRAWER / MODAL
// ═══════════════════════════════════════════════════════════════════════════════

export const WhyFlaggedDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  explanations?: FlagExplanation[];
}> = ({ open, onClose, explanations }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-slate-900/40" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto animate-slideInRight">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-amber-50">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-black text-slate-900">Why Was This Flagged?</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-amber-100 text-slate-500 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          {!explanations || explanations.length === 0 ? (
            <AwaitingState message="No explainability data is available yet. This panel will populate after backend analysis." />
          ) : (
            explanations.map((exp, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2 text-xs bg-slate-50">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="font-bold text-slate-900 text-sm">{exp.issue}</span>
                </div>

                <ExplainRow icon={<Info className="w-3 h-3 text-blue-500" />} label="What the system found" value={exp.whatSystemFound} />
                {exp.expectedOrReference && <ExplainRow icon={<CheckCircle2 className="w-3 h-3 text-emerald-500" />} label="Expected / Reference" value={exp.expectedOrReference} />}
                {exp.evidence && <ExplainRow icon={<FileSearch className="w-3 h-3 text-slate-400" />} label="Evidence" value={exp.evidence} />}
                {exp.ruleOrSignal && <ExplainRow icon={<Shield className="w-3 h-3 text-blue-400" />} label="Rule / Signal" value={exp.ruleOrSignal} />}
                {exp.impact && <ExplainRow icon={<Activity className="w-3 h-3 text-orange-500" />} label="Impact" value={exp.impact} />}
                {exp.officerAction && (
                  <div className="bg-blue-50 border border-blue-100 rounded p-2 mt-1">
                    <span className="text-blue-700 font-semibold block mb-0.5">Officer Action</span>
                    <p className="text-blue-800">{exp.officerAction}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const ExplainRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start space-x-2">
    <span className="shrink-0 mt-0.5">{icon}</span>
    <div>
      <span className="text-slate-400">{label}: </span>
      <span className="text-slate-700">{value}</span>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// M. CORRECTION FEEDBACK FORM (extension for HumanReview)
// ═══════════════════════════════════════════════════════════════════════════════

export const CorrectionFeedbackForm: React.FC<{
  fieldName: string;
  fieldLabel: string;
  aiCandidate?: string;
  correctedValue: string;
  onChange: (feedback: Partial<CorrectionFeedback>) => void;
  currentFeedback?: Partial<CorrectionFeedback>;
}> = ({ fieldName, fieldLabel, aiCandidate, correctedValue, onChange, currentFeedback }) => (
  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 text-xs">
    <div className="flex items-center space-x-1.5 text-blue-700 font-semibold">
      <MessageSquare className="w-3.5 h-3.5" />
      <span>Correction Feedback for "{fieldLabel}"</span>
    </div>

    <div className="grid grid-cols-2 gap-2 text-[11px]">
      <div>
        <span className="text-slate-400 block">AI Candidate</span>
        <span className="font-mono text-slate-600">{aiCandidate ?? '—'}</span>
      </div>
      <div>
        <span className="text-slate-400 block">Corrected Value</span>
        <span className="font-mono font-semibold text-blue-800">{correctedValue || '—'}</span>
      </div>
    </div>

    <div>
      <label className="text-slate-500 block mb-1">Feedback Category</label>
      <select
        className="w-full border border-blue-200 rounded px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
        value={currentFeedback?.feedbackCategory ?? ''}
        onChange={e => onChange({ feedbackCategory: e.target.value as FeedbackCategory || undefined })}
      >
        <option value="">— Select category —</option>
        {Object.entries(FEEDBACK_CATEGORY_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="text-slate-500 block mb-1">Correction Reason</label>
      <input
        type="text"
        placeholder="Brief reason for this correction…"
        className="w-full border border-blue-200 rounded px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
        value={currentFeedback?.correctionReason ?? ''}
        onChange={e => onChange({ correctionReason: e.target.value })}
      />
    </div>

    <div>
      <label className="text-slate-500 block mb-1">Evidence / Reference</label>
      <input
        type="text"
        placeholder="e.g. Page 2, official register entry…"
        className="w-full border border-blue-200 rounded px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
        value={currentFeedback?.evidenceReference ?? ''}
        onChange={e => onChange({ evidenceReference: e.target.value })}
      />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// N. CORRECTION HISTORY
// ═══════════════════════════════════════════════════════════════════════════════

export const CorrectionHistoryPanel: React.FC<{ entries?: CorrectionHistoryEntry[] }> = ({ entries }) => (
  <PanelShell
    title="Correction history"
    icon={<History className="w-4 h-4" />}
    collapsible
    defaultOpen={false}
    badge={entries && entries.length > 0 ? <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">{entries.length}</span> : undefined}
  >
    {!entries || entries.length === 0 ? (
      <AwaitingState message="No corrections have been recorded yet." />
    ) : (
      <div className="space-y-2">
        {entries.map(entry => (
          <div key={entry.id} className="border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">{entry.fieldLabel}</span>
              {entry.feedbackCategory && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  {FEEDBACK_CATEGORY_LABELS[entry.feedbackCategory]}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-slate-400 line-through">{entry.oldValue ?? '—'}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-800">{entry.newValue ?? '—'}</span>
            </div>
            {entry.reason && <p className="text-slate-500 italic">{entry.reason}</p>}
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{entry.changedBy ?? 'Unknown Officer'}</span>
              <span>{entry.timestamp ?? '—'}</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </PanelShell>
);

// ═══════════════════════════════════════════════════════════════════════════════
// O. GIS LINKAGE CARD
// ═══════════════════════════════════════════════════════════════════════════════

const GIS_LINKAGE_COLORS: Record<string, string> = {
  LINKED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  PARTIAL: 'text-amber-700 bg-amber-50 border-amber-200',
  NOT_LINKED: 'text-slate-600 bg-slate-100 border-slate-200',
  PENDING: 'text-blue-700 bg-blue-50 border-blue-200',
  FAILED: 'text-red-700 bg-red-50 border-red-200',
};

export const GisLinkageCard: React.FC<{ linkage?: GisLinkageInfo; recordId?: string }> = ({ linkage, recordId }) => (
  <PanelShell
    title="GIS linkage"
    icon={<MapPin className="w-4 h-4" />}
    collapsible
    defaultOpen={false}
  >
    {!linkage || linkage.status === 'NOT_LINKED' ? (
      <AwaitingState message="This record has not been linked to a GIS parcel yet." />
    ) : linkage.status === 'PENDING' ? (
      <ProcessingState message="GIS linkage is being processed…" />
    ) : linkage.status === 'FAILED' ? (
      <FailedState message="GIS linkage failed." />
    ) : (
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Linkage Status</span>
          <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${GIS_LINKAGE_COLORS[linkage.status]}`}>
            {linkage.status}
          </span>
        </div>

        {linkage.parcelId && <Row label="Parcel ID" value={linkage.parcelId} />}
        {linkage.surveyNumber && <Row label="Survey Number" value={linkage.surveyNumber} />}
        {linkage.village && <Row label="Village" value={linkage.village} />}
        {linkage.geometryStatus && <Row label="Geometry Status" value={linkage.geometryStatus} />}
        {linkage.latitude !== undefined && linkage.longitude !== undefined && (
          <Row label="Coordinates" value={`${linkage.latitude.toFixed(6)}, ${linkage.longitude.toFixed(6)}`} />
        )}

        <a
          href="/map"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition mt-1"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View on Map</span>
        </a>
      </div>
    )}
  </PanelShell>
);

// ═══════════════════════════════════════════════════════════════════════════════
// P. INTEGRATION STATUS CARD (for analytics / settings)
// ═══════════════════════════════════════════════════════════════════════════════

const INT_STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  CONNECTED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" /> },
  CONFIGURED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: <Info className="w-4 h-4" /> },
  UNAVAILABLE: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-500', icon: <Clock className="w-4 h-4" /> },
  ERROR: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: <XCircle className="w-4 h-4" /> },
  NOT_CONFIGURED: { bg: 'bg-slate-50 border-slate-100', text: 'text-slate-400', icon: <HelpCircle className="w-4 h-4" /> },
};

export const IntegrationStatusCard: React.FC<{ integration: IntegrationStatus }> = ({ integration }) => {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-xs">
      <span className="shrink-0 mt-0.5 text-[#475569]">
        <HelpCircle className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-800">{integration.name}</span>
          <span className="text-xs text-slate-500">Not configured</span>
        </div>
        <p className="text-slate-500 mt-0.5">{integration.description}</p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Q. ANALYTICS EXPANSION SLOT (empty state card for pending metrics)
// ═══════════════════════════════════════════════════════════════════════════════

export const AnalyticsSlot: React.FC<{
  title: string;
  icon: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  hasData?: boolean;
}> = ({ title, icon, description, children, hasData }) => (
  <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-[#475569]">{icon}</span>
        <h3 className="text-xs font-semibold text-slate-700">{title}</h3>
      </div>
    </div>
    {hasData && children ? (
      children
    ) : (
      <div className="flex flex-col items-center justify-center py-4 text-center space-y-1">
        <BarChart2 className="w-5 h-5 text-slate-300" />
        <p className="text-xs text-slate-500 font-medium">No data available</p>
      </div>
    )}
  </div>
);
