import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CitizenOnboardingModal } from '../components/citizen/CitizenOnboardingModal';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  UploadCloud, 
  ArrowRight, 
  AlertTriangle, 
  ShieldAlert, 
  Send,
  Upload,
  Eye,
  RotateCcw
} from 'lucide-react';

type TabType = 'ALL' | 'PROCESSING' | 'ACCEPTED' | 'REJECTED' | 'REAPPLIED';

interface CitizenSubmission {
  id: string;
  documentId: string;
  recordId?: string;
  title: string;
  surveyNumber: string;
  village: string;
  taluka: string;
  district: string;
  submittedDate: string;
  status: 'PROCESSING' | 'UNDER_VERIFICATION' | 'ACCEPTED' | 'REJECTED' | 'GRIEVANCE_SUBMITTED' | 'REAPPLIED';
  simpleStatus: string;
  latestAction: string;
  nextAction: string;
  rejectionReason?: string;
  grievanceNote?: string;
  supportingDocName?: string;
}

export const CitizenDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Rejection & Grievance Modal State
  const [selectedForGrievance, setSelectedForGrievance] = useState<CitizenSubmission | null>(null);
  const [grievanceText, setGrievanceText] = useState('');
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [grievanceSuccessMessage, setGrievanceSuccessMessage] = useState<string | null>(null);

  // Citizen personal submissions list (strictly isolated to logged-in citizen)
  const [submissions, setSubmissions] = useState<CitizenSubmission[]>([
    {
      id: 'CSUB-2026-001',
      documentId: 'doc-101',
      recordId: 'rec-201',
      title: '7/12 Land Record Verification Application',
      surveyNumber: '124/3',
      village: 'Wagholi',
      taluka: 'Haveli',
      district: 'Pune',
      submittedDate: '04 Sep 2026, 10:30 AM',
      status: 'UNDER_VERIFICATION',
      simpleStatus: 'Under Verification',
      latestAction: 'Assigned to Verification Officer for revenue register check',
      nextAction: 'Officer signature and final verification pending'
    },
    {
      id: 'CSUB-2026-002',
      documentId: 'doc-104',
      recordId: 'rec-204',
      title: 'Registered Sale Deed Digitization Request',
      surveyNumber: '219/1-4',
      village: 'Chakan',
      taluka: 'Khed',
      district: 'Pune',
      submittedDate: '02 Sep 2026, 02:20 PM',
      status: 'ACCEPTED',
      simpleStatus: 'Accepted & Certified',
      latestAction: 'Digitized, cross-verified with Sub-Registrar records & approved',
      nextAction: 'Certified Digital Record available for download'
    },
    {
      id: 'CSUB-2026-003',
      documentId: 'doc-103',
      recordId: 'rec-203',
      title: 'Mutation Extract Registration & Boundary Verification',
      surveyNumber: '94/2',
      village: 'Malegaon',
      taluka: 'Baramati',
      district: 'Pune',
      submittedDate: '28 Aug 2026, 11:15 AM',
      status: 'REJECTED',
      simpleStatus: 'Action Required / Rejected',
      latestAction: 'Discrepancy flagged against 1984 Cadastral Register',
      nextAction: 'Submit grievance or upload supplementary registration copy',
      rejectionReason: 'Extracted plot area (3.10 ha) exceeds the recorded share in the reference register (2.85 ha). Additional partition deed required.'
    }
  ]);

  const handleOpenGrievance = (sub: CitizenSubmission) => {
    setSelectedForGrievance(sub);
    setGrievanceText(sub.grievanceNote || '');
    setSupportingFile(null);
  };

  const handleSubmitGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForGrievance) return;

    // Update submission status to GRIEVANCE_SUBMITTED / REAPPLIED
    setSubmissions(prev => prev.map(s => {
      if (s.id === selectedForGrievance.id) {
        return {
          ...s,
          status: 'REAPPLIED',
          simpleStatus: 'Reapplied (Final Human Review)',
          latestAction: 'Citizen filed grievance with supplementary evidence',
          nextAction: 'Mandatory Human Officer Review (AI auto-approval strictly disabled)',
          grievanceNote: grievanceText,
          supportingDocName: supportingFile?.name || 'Partition_Deed_Supplementary.pdf'
        };
      }
      return s;
    }));

    setGrievanceSuccessMessage(`Grievance successfully submitted for ${selectedForGrievance.id}. The record has entered the Final Human Review queue.`);
    setSelectedForGrievance(null);
    setTimeout(() => setGrievanceSuccessMessage(null), 5000);
  };

  // Filter submissions by tab
  const filteredSubmissions = submissions.filter(sub => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PROCESSING') return sub.status === 'PROCESSING' || sub.status === 'UNDER_VERIFICATION';
    if (activeTab === 'ACCEPTED') return sub.status === 'ACCEPTED';
    if (activeTab === 'REJECTED') return sub.status === 'REJECTED';
    if (activeTab === 'REAPPLIED') return sub.status === 'REAPPLIED' || sub.status === 'GRIEVANCE_SUBMITTED';
    return true;
  });

  const tabDefs: { id: TabType; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Submissions', count: submissions.length },
    { 
      id: 'PROCESSING', 
      label: 'Under Review', 
      count: submissions.filter(s => s.status === 'PROCESSING' || s.status === 'UNDER_VERIFICATION').length 
    },
    { 
      id: 'ACCEPTED', 
      label: 'Accepted', 
      count: submissions.filter(s => s.status === 'ACCEPTED').length 
    },
    { 
      id: 'REJECTED', 
      label: 'Action Required / Rejected', 
      count: submissions.filter(s => s.status === 'REJECTED').length 
    },
    { 
      id: 'REAPPLIED', 
      label: 'Reapplied / Grievances', 
      count: submissions.filter(s => s.status === 'REAPPLIED' || s.status === 'GRIEVANCE_SUBMITTED').length 
    },
  ];

  // Outline / subtle-tint status badges (6px radius, ~8% bg tint, ~30% border, accent text)
  const getStatusBadge = (status: CitizenSubmission['status'], label: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[6px] bg-[#15803D]/[0.08] border border-[#15803D]/30 text-[#15803D]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </span>
        );
      case 'UNDER_VERIFICATION':
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[6px] bg-[#A16207]/[0.08] border border-[#A16207]/30 text-[#A16207]">
            <Clock className="w-3.5 h-3.5 text-[#A16207] shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[6px] bg-[#B91C1C]/[0.08] border border-[#B91C1C]/30 text-[#B91C1C]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </span>
        );
      case 'GRIEVANCE_SUBMITTED':
      case 'REAPPLIED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[6px] bg-[#334155]/[0.08] border border-[#334155]/30 text-[#334155]">
            <RotateCcw className="w-3.5 h-3.5 text-[#334155] shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Citizen Page Header: H1 on one line, Submit Document right-aligned */}
      <div className="border-b border-slate-200 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Citizen Dashboard
          </h1>
          <Link
            to="/documents/upload"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#15803D] focus-visible:ring-offset-1 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Submit Document</span>
          </Link>
        </div>

        {/* Compact, plain labeled metadata strip */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-2.5">
          <span>
            <span className="text-slate-400">Citizen:</span>{' '}
            <strong className="font-medium text-slate-800">{currentUser?.name || 'Rajesh Bharat Patil'}</strong>
          </span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">•</span>
          <span className="text-slate-700 font-medium">Verified Citizen</span>
        </div>
      </div>

      {/* Success Notification Alert (Left border only, white surface) */}
      {grievanceSuccessMessage && (
        <div className="p-3 bg-white border border-slate-200 border-l-4 border-l-[#15803D] rounded-[6px] flex items-center space-x-2.5 text-xs text-slate-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" aria-hidden="true" />
          <div>
            <span className="font-semibold text-[#15803D]">Grievance & Reapplication Registered:</span>
            <span className="ml-1 text-slate-700">{grievanceSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Submissions Section */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Header with Title, Result Count & Segmented Tablist */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">{t('myRequests')}</h2>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              {filteredSubmissions.length} of {submissions.length} records
            </span>
          </div>

          {/* Underline tab control with counts */}
          <div 
            role="tablist"
            aria-label="Filter submissions by status"
            className="flex items-center space-x-6 border-b border-slate-100 overflow-x-auto pt-1"
          >
            {tabDefs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls="submissions-list"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2.5 text-xs border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#15803D] focus-visible:ring-offset-1 cursor-pointer ${
                    isActive
                      ? 'border-[#166534] text-[#166534] font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[11px] tabular-nums ${isActive ? 'text-[#166534] font-semibold' : 'text-slate-400'}`}>
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submissions List */}
        <div id="submissions-list" role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="divide-y divide-slate-100">
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No submissions found under this status filter.
            </div>
          ) : (
            filteredSubmissions.map(sub => (
              <div 
                key={sub.id} 
                className="p-4 hover:bg-slate-50/70 transition-colors space-y-2.5"
              >
                {/* Row 1: Left: Reference ID & submitted date; Right: Single status badge + action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                      {sub.id}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">•</span>
                    <span className="text-xs text-slate-500 tabular-nums">
                      Submitted: {sub.submittedDate}
                    </span>
                  </div>

                  {/* Right: Exactly ONE right-aligned status badge, followed by actions */}
                  <div className="flex items-center space-x-2.5 shrink-0">
                    {getStatusBadge(sub.status, sub.simpleStatus)}

                    {sub.status === 'ACCEPTED' && sub.recordId && (
                      <Link
                        to={`/records/${sub.recordId}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-medium transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#15803D]"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>View Official Record</span>
                      </Link>
                    )}

                    {sub.status === 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => handleOpenGrievance(sub)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-transparent hover:bg-[#A16207]/[0.08] text-[#A16207] border border-[#A16207] hover:border-[#854d0e] rounded-[6px] text-xs font-medium transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#A16207] cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#A16207]" aria-hidden="true" />
                        <span>File Grievance & Reapply</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Title and labeled metadata inline */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{sub.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
                    <span>
                      <span className="text-slate-400">Survey No.:</span>{' '}
                      <strong className="font-medium text-slate-800 tabular-nums">{sub.surveyNumber}</strong>
                    </span>
                    <span className="text-slate-300" aria-hidden="true">•</span>
                    <span>
                      <span className="text-slate-400">Location:</span>{' '}
                      <span className="text-slate-700">{sub.village}, {sub.taluka}, {sub.district}</span>
                    </span>
                    <span className="text-slate-300" aria-hidden="true">•</span>
                    <span>
                      <span className="text-slate-400">Document Ref:</span>{' '}
                      <span className="font-mono text-slate-600 tabular-nums">{sub.documentId}</span>
                    </span>
                  </div>
                </div>

                {/* Row 3: Factual status stacked on two lines with small muted labels */}
                <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block">Current Stage</span>
                    <span className="text-slate-700">{sub.latestAction}</span>
                  </div>
                  {sub.nextAction && sub.status !== 'ACCEPTED' && (
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">Pending Action</span>
                      <span className="text-slate-700">{sub.nextAction}</span>
                    </div>
                  )}
                </div>

                {/* Rejection notice line: White surface, thin red left border (3-4px), muted red text */}
                {sub.rejectionReason && sub.status === 'REJECTED' && (
                  <div className="mt-2 p-2.5 bg-white border border-slate-200 border-l-4 border-l-[#B91C1C] rounded-[6px] text-xs text-slate-700">
                    <span className="font-semibold text-[#B91C1C]">Rejection Notice:</span>{' '}
                    <span>{sub.rejectionReason}</span>
                  </div>
                )}

                {/* Grievance detail note line: White surface, thin slate left border */}
                {sub.grievanceNote && (
                  <div className="mt-2 p-2.5 bg-white border border-slate-200 border-l-4 border-l-[#334155] rounded-[6px] text-xs text-slate-700">
                    <span className="font-semibold text-slate-800">Filed Grievance:</span>{' '}
                    <span>{sub.grievanceNote}</span>
                    {sub.supportingDocName && (
                      <span className="block mt-1 font-mono text-[11px] text-slate-500">
                        Attached Document: {sub.supportingDocName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer: Small muted footnote and plain slate utility link */}
      <div className="border-t border-slate-200 pt-3 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>Records verified under Maharashtra Land Revenue Code, 1966.</span>
        <Link
          to="/map"
          className="text-slate-500 hover:text-slate-800 text-[11px] font-medium hover:underline"
        >
          View Registered Parcels on GIS Map
        </Link>
      </div>

      {/* GRIEVANCE & REAPPLICATION MODAL */}
      {selectedForGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-fadeIn">
            {/* Header: Dark slate/navy */}
            <div className="bg-[#0F172A] text-white p-4 sm:p-5">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-slate-300" />
                <h2 className="text-sm font-semibold">File Citizen Grievance & Reapply</h2>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Submission: <span className="font-mono font-bold text-white">{selectedForGrievance.id}</span> (Survey {selectedForGrievance.surveyNumber}, {selectedForGrievance.village})
              </p>
            </div>

            <form onSubmit={handleSubmitGrievance} className="p-5 space-y-4 text-xs">
              {/* Rejection Notice: White surface, thin red left border (3-4px), muted red text */}
              <div className="p-3 bg-white border border-slate-200 border-l-4 border-l-[#B91C1C] rounded-[6px] text-xs">
                <span className="font-semibold block mb-0.5 text-[#B91C1C]">Reason for Initial Rejection:</span>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  {selectedForGrievance.rejectionReason || 'Discrepancy identified in land area or ownership record against master register.'}
                </p>
              </div>

              {/* Grievance Statement */}
              <div>
                <label htmlFor="grievance-explanation" className="block font-medium text-slate-700 mb-1">
                  Grievance Explanation / Justification
                </label>
                <textarea
                  id="grievance-explanation"
                  required
                  rows={3}
                  value={grievanceText}
                  onChange={e => setGrievanceText(e.target.value)}
                  placeholder="Explain grounds for review (e.g., partition approved under Mutation 1422, registered sale deed confirms 3.10 hectares)..."
                  className="w-full p-2 border border-slate-300 rounded-[6px] text-xs focus:ring-1 focus:ring-[#15803D] focus:outline-hidden"
                />
              </div>

              {/* Supporting Evidence File Upload */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Upload Supplementary Supporting Document (PDF / JPG)
                </label>
                <div className="border border-dashed border-slate-300 hover:border-[#15803D] rounded-[6px] p-3 text-center cursor-pointer bg-slate-50 transition">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setSupportingFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="grievance-file"
                  />
                  <label htmlFor="grievance-file" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="font-medium text-slate-700">
                      {supportingFile ? supportingFile.name : 'Select supplementary document'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Accepted formats: PDF, JPG, PNG (Max 10 MB)
                    </span>
                  </label>
                </div>
              </div>

              {/* Mandatory Human Review Notice: Left border only */}
              <div className="p-3 bg-white border border-slate-200 border-l-4 border-l-slate-500 rounded-[6px] text-[11px] leading-relaxed flex items-start space-x-2 text-slate-700">
                <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Mandatory Human Officer Review:</strong>
                  <p className="mt-0.5 text-slate-600">
                    Once reapplied, this submission cannot be auto-processed. It will be routed directly to the Tehsildar & Verification Officer worklist for manual review.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Secondary = slate outline, Primary = solid forest green */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedForGrievance(null)}
                  className="px-3.5 py-1.5 text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-[6px] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#15803D] cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Grievance & Reapply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CITIZEN ONBOARDING / EDIT PROFILE MODAL */}
      <CitizenOnboardingModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onComplete={() => setProfileModalOpen(false)}
      />
    </div>
  );
};

