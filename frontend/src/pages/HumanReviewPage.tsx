import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockApi } from '../services/mockApi';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LandRecord } from '../types';
import type {
  ReviewRouting,
  FlagExplanation,
  CorrectionFeedback,
  CorrectionHistoryEntry,
} from '../types/intelligence';
import { StatusBadge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/FeedbackStates';
import {
  ReviewRoutingPanel,
  WhyFlaggedDrawer,
  CorrectionFeedbackForm,
  CorrectionHistoryPanel,
} from '../components/ui/IntelligenceCards';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Check, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  ShieldCheck, 
  ArrowLeft,
  HelpCircle,
  History
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

export const HumanReviewPage: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [record, setRecord] = useState<LandRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  // Round-2 intelligence state
  const [reviewRouting, setReviewRouting] = useState<ReviewRouting | undefined>();
  const [flagExplanations] = useState<FlagExplanation[]>([]); // populated by backend
  const [showWhyFlagged, setShowWhyFlagged] = useState(false);
  const [correctionFeedbacks, setCorrectionFeedbacks] = useState<Record<string, Partial<CorrectionFeedback>>>({});
  const [correctionHistory, setCorrectionHistory] = useState<CorrectionHistoryEntry[]>([]);
  const [showFeedbackFor, setShowFeedbackFor] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      const targetId = recordId || 'rec-201';
      const found = await mockApi.getRecord(targetId);
      if (found) {
        setRecord(found);
        const initialForm: Record<string, string | number> = {};
        Object.entries(found.fields).forEach(([k, v]) => {
          initialForm[k] = v.value ?? '';
        });
        setFormData(initialForm);
      }
      setLoading(false);
    };
    fetchRecord();
  }, [recordId]);

  // Non-blocking load of intelligence data
  useEffect(() => {
    if (record) {
      ApiService.getReviewRouting(record.id).then(r => setReviewRouting(r ?? undefined));
      ApiService.getCorrectionHistory(record.id).then(h => setCorrectionHistory(h));
    }
  }, [record?.id]);

  const handleFieldChange = (fieldKey: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: val
    }));
    setSaveSuccess(false);
  };

  const handleQuickFixArea = () => {
    // Quick reconciliation helper: sets corrected 2.54 hectares matching the master register
    setFormData(prev => ({
      ...prev,
      plotArea: 2.54
    }));
  };

  const handleSave = async () => {
    if (!record) return;
    const reviewerName = currentUser?.name || 'Officer Vikram Deshmukh';
    const updated = await mockApi.updateRecordFields(record.id, formData, reviewerName);
    setRecord(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleApprove = async () => {
    if (!record) return;
    // Save any pending edits first
    const reviewerName = currentUser?.name || 'Officer Vikram Deshmukh';
    await mockApi.updateRecordFields(record.id, formData, reviewerName);
    const approved = await mockApi.approveRecord(record.id, reviewerName, 'Verified against original 7/12 extract and official revenue reference register.');
    setRecord(approved);
    setShowApproveConfirm(false);
    navigate(`/records/${approved.id}`);
  };

  const handleReject = async () => {
    if (!record || !rejectReason.trim()) return;
    const reviewerName = currentUser?.name || 'Officer Vikram Deshmukh';
    const rejected = await mockApi.rejectRecord(record.id, reviewerName, rejectReason);
    setRecord(rejected);
    setShowRejectModal(false);
    navigate('/verification');
  };

  if (loading || !record) {
    return <LoadingState message="Opening human verification workspace..." />;
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <PageHeader
        category="Verification Workspace"
        breadcrumbs={[
          { label: 'Queue', href: '/verification' },
          { label: record.displayId },
        ]}
        title={`Verification: ${record.displayId}`}
        description={`${record.village} · ${record.tehsil} · Survey No. ${record.surveyNumber}`}
        badge={<StatusBadge status={record.status} size="sm" />}
        actions={
          <div className="flex items-center space-x-2">
            {saveSuccess && (
              <span className="text-xs text-[#166534] font-semibold flex items-center mr-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 mr-1 text-[#166534]" /> Saved
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              className="px-3 py-1.5 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>

            <button
              type="button"
              onClick={() => setShowApproveConfirm(true)}
              className="px-3.5 py-1.5 bg-[#166534] hover:bg-[#14532D] text-white rounded text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Approve record</span>
            </button>
          </div>
        }
      />

      {/* Main Split-Screen Workspace (Desktop 2-Col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Original Document Viewer (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[750px]">
          {/* Document Toolbar */}
          <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center space-x-2 font-semibold">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>7_12_Extract_Haveli_Survey_124_3.pdf</span>
            </div>

            {/* Page Nav & Zoom */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded px-1.5 py-0.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1 hover:text-slate-700"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-medium px-1">Page {currentPage} of 3</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(3, p + 1))}
                  className="p-1 hover:text-slate-700"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center space-x-1 bg-white border border-slate-300 rounded px-1.5 py-0.5">
                <button
                  onClick={() => setZoomLevel(z => Math.max(70, z - 10))}
                  className="p-1 hover:text-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-medium px-1">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(z => Math.min(150, z + 10))}
                  className="p-1 hover:text-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* High-Fidelity Simulated Document Canvas */}
          <div className="flex-1 bg-slate-200 p-4 overflow-auto flex justify-center items-start">
            <div
              className="bg-amber-50/90 text-slate-900 border border-amber-300 shadow-lg p-8 w-[580px] min-h-[700px] transition-all duration-200 font-serif relative"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            >
              {/* Government Stamp / Emblem */}
              <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                <div className="text-xs uppercase font-bold tracking-widest text-slate-800">महाराष्ट्र शासन — महसूल विभाग</div>
                <div className="text-sm font-black mt-1">गाव नमुना सात (७) व बारा (१२)</div>
                <div className="text-[10px] text-slate-600 mt-0.5">तालुका: हवेली • जिल्हा: पुणे • गाव: वाघोली</div>
              </div>

              {/* Document Fields Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6 border border-slate-400 p-3 bg-white/60">
                <div>
                  <span className="font-bold text-slate-700">भूमापन क्रमांक (Survey No):</span>
                  <div className="text-sm font-black text-slate-900 bg-blue-50/50 p-1 border border-blue-200 mt-1">१२४ / ३</div>
                </div>
                <div>
                  <span className="font-bold text-slate-700">खाते क्रमांक (Khata No):</span>
                  <div className="text-sm font-black text-slate-900 p-1 mt-1">४५</div>
                </div>
              </div>

              {/* Landowner & Area Section with highlighted warning box */}
              <div className="border border-slate-400 p-3 bg-white/60 text-xs space-y-3 mb-6">
                <div>
                  <span className="font-bold text-slate-700">भोगवटादाराचे नाव (Landowner Name):</span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">राजेश भारत पाटील</div>
                </div>

                {/* Highlighted Plot Area with simulated OCR bounding box! */}
                <div className="relative p-2 bg-amber-100/70 border-2 border-amber-500 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">एकूण क्षेत्र (Total Area):</span>
                    <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded">OCR Bounding Box</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1 flex items-center justify-between">
                    <span>२.५४ हेक्टर (Official Register notation)</span>
                    <span className="text-[10px] text-amber-800 italic">faded numeral read as 2.45</span>
                  </div>
                </div>
              </div>

              {/* Secondary Details */}
              <div className="border border-slate-400 p-3 bg-white/60 text-xs space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="font-bold">जमिनीचे वर्गीकरण:</span>
                  <span>जिरायत शेती (Agricultural)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">फेरफार नोंद क्र.:</span>
                  <span>१४२२ (मंजूर दि. १४/०८/२०२४)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">आकारणी (रुपये):</span>
                  <span>१४.५०</span>
                </div>
              </div>

              {/* Watermark / Seal */}
              <div className="absolute bottom-6 right-8 opacity-25 pointer-events-none text-center">
                <div className="w-20 h-20 rounded-full border-4 border-blue-900 flex items-center justify-center font-bold text-[9px] uppercase">
                  तहसीलदार हवेली<br/>पुणे
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Structured Candidate Extraction & Corrections (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Validation Warnings Card */}
          {record.validationIssues.length > 0 ? (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Validation Rule Warnings Detected ({record.validationIssues.length})</span>
              </div>

              {record.validationIssues.map(issue => (
                <div key={issue.id} className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-amber-200">
                  <div className="font-bold flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-600">{issue.ruleCode}</span>
                    <span className="text-[10px] text-slate-500">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${
                        issue.severity === 'error' || issue.severity === 'critical' ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                      }`} />
                      {issue.severity.charAt(0) + issue.severity.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{issue.message}</p>

                  {issue.expectedValue && (
                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-amber-200 text-[11px]">
                      <span>Reference expected: <strong className="text-slate-800">{issue.expectedValue}</strong></span>
                      <button
                        onClick={handleQuickFixArea}
                        className="inline-flex items-center text-xs font-semibold text-[#166534] hover:text-[#14532D] underline"
                      >
                        <Check className="w-3 h-3 mr-1" /> Accept 2.54 ha
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 flex items-center space-x-2 text-xs font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-[#15803D] shrink-0" />
              <span className="text-[#0F172A]">All validation rules passed. Record verified by officer.</span>
            </div>
          )}

          {/* Extracted Fields Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Extracted Fields</h3>
              <span className="text-xs text-slate-500 font-medium tabular-nums">{record.overallConfidence}% confidence</span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Landowner Name */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-bold text-slate-700">Landowner Name</label>
                  <span className="text-[11px] text-slate-400">Devanagari: राजेश भारत पाटील</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.ownerName ?? ''}
                    onChange={e => handleFieldChange('ownerName', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#166534] focus:border-[#166534]"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <span className="text-[10px] text-[#15803D] font-semibold tabular-nums">96%</span>
                  </div>
                </div>
              </div>

              {/* Land Parcel Identifiers: Survey, Gat, Khasra, Khata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Survey No.</label>
                  <input
                    type="text"
                    value={formData.surveyNumber ?? ''}
                    onChange={e => handleFieldChange('surveyNumber', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gat No. (गट)</label>
                  <input
                    type="text"
                    value={formData.gatNumber ?? formData.surveyNumber?.toString().split('/')[0] ?? '124'}
                    onChange={e => handleFieldChange('gatNumber', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khasra No.</label>
                  <input
                    type="text"
                    value={formData.khasraNumber ?? '124/3'}
                    onChange={e => handleFieldChange('khasraNumber', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khata No.</label>
                  <input
                    type="text"
                    value={formData.khataNumber ?? ''}
                    onChange={e => handleFieldChange('khataNumber', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Plot Area - The Primary Highlighted Field */}
              <div className="p-3 bg-white border border-[#D97706] rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#D97706]" />
                    Plot area (hectares)
                  </label>
                  <span className={`text-[10px] font-semibold tabular-nums ${
                    Number(formData.plotArea) === 2.54 ? 'text-[#15803D]' : 'text-[#D97706]'
                  }`}>
                    {Number(formData.plotArea) === 2.54 ? '100%' : '58%'} confidence
                  </span>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.plotArea ?? ''}
                    onChange={e => handleFieldChange('plotArea', e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs font-black border rounded-lg focus:ring-2 focus:ring-[#166534] ${
                      Number(formData.plotArea) === 2.54 
                        ? 'border-[#166534] text-[#0F172A]' 
                        : 'border-[#D97706] text-[#0F172A]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleQuickFixArea}
                    className="px-2.5 py-1 bg-[#166534] hover:bg-[#14532D] text-white font-bold rounded text-[11px] shrink-0"
                    title="Correct to reference 2.54"
                  >
                    Fix: 2.54
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  {Number(formData.plotArea) === 2.54 
                    ? '✓ Corrected to 2.54 ha — matches revenue ledger.' 
                    : '⚠ Faded numeral in source image was parsed as 2.45.'}
                </p>
              </div>

              {/* Geographic Hierarchy */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Village</label>
                  <input
                    type="text"
                    value={formData.village ?? ''}
                    onChange={e => handleFieldChange('village', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tehsil</label>
                  <input
                    type="text"
                    value={formData.tehsil ?? ''}
                    onChange={e => handleFieldChange('tehsil', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={formData.district ?? ''}
                    onChange={e => handleFieldChange('district', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Land Classification & Ownership */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Land Classification</label>
                  <input
                    type="text"
                    value={formData.landClassification ?? 'Agricultural'}
                    onChange={e => handleFieldChange('landClassification', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ownership Type</label>
                  <input
                    type="text"
                    value={formData.ownershipType ?? 'Individual'}
                    onChange={e => handleFieldChange('ownershipType', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Round-2 Intelligence: Review Routing + Correction History Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Review Routing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Review Routing</span>
            <button
              onClick={() => setShowWhyFlagged(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded text-xs font-semibold transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Why flagged?</span>
            </button>
          </div>
          <ReviewRoutingPanel routing={reviewRouting} />
        </div>

        {/* Correction History */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Correction History</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <CorrectionHistoryPanel entries={correctionHistory} />
        </div>
      </div>

      {/* Why Flagged Drawer */}
      <WhyFlaggedDrawer
        open={showWhyFlagged}
        onClose={() => setShowWhyFlagged(false)}
        explanations={flagExplanations}
      />

      {/* Approval Confirmation Dialog */}
      {showApproveConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Approve Digital Land Record</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will certify the extraction for {record.ownerName} (Survey No. {formData.surveyNumber}, {formData.plotArea} ha) and link it to the parcel map and audit trail.
            </p>

            <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Approving officer</span>
                <span className="font-semibold text-slate-900">{currentUser?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Tehsil / District</span>
                <span className="font-semibold text-slate-900">Haveli / Pune</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status after approval</span>
                <span className="font-semibold text-[#166534]">Approved</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveConfirm(false)}
                className="px-4 py-2 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-[6px] text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-2 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold cursor-pointer transition"
              >
                Confirm approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2.5">
              <X className="w-5 h-5 text-[#DC2626] shrink-0" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Record</h3>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Reason</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Image quality too degraded to verify survey number."
                rows={3}
                className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded-[6px] focus:ring-1 focus:ring-[#166534] focus:border-[#166534] focus:outline-hidden text-slate-900"
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-[6px] text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[6px] text-xs font-semibold cursor-pointer transition"
              >
                Reject Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
