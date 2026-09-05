import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CitizenOnboardingModal } from '../components/citizen/CitizenOnboardingModal';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  UploadCloud, 
  ArrowRight, 
  AlertTriangle, 
  ShieldAlert, 
  FileCheck2, 
  UserCheck, 
  Send,
  Upload,
  Eye,
  RotateCcw
} from 'lucide-react';

type TabType = 'ALL' | 'PROCESSING' | 'ACCEPTED' | 'REJECTED' | 'GRIEVANCED' | 'REAPPLIED';

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
      nextAction: 'None • Certified Digital Record available for download'
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
    if (activeTab === 'GRIEVANCED') return sub.status === 'GRIEVANCE_SUBMITTED';
    if (activeTab === 'REAPPLIED') return sub.status === 'REAPPLIED';
    return true;
  });

  const getStatusBadge = (status: CitizenSubmission['status'], label: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 mr-1" />{label}</span>;
      case 'UNDER_VERIFICATION':
      case 'PROCESSING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1"><Clock className="w-3.5 h-3.5 text-amber-700 mr-1" />{label}</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-rose-100 text-rose-900 border border-rose-300 flex items-center space-x-1"><AlertTriangle className="w-3.5 h-3.5 text-rose-700 mr-1" />{label}</span>;
      case 'GRIEVANCE_SUBMITTED':
      case 'REAPPLIED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-purple-100 text-purple-900 border border-purple-300 flex items-center space-x-1"><RotateCcw className="w-3.5 h-3.5 text-purple-700 mr-1" />{label}</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-800">{label}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Citizen Welcome Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">{t('citizenPortalTitle')}</h1>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded">
              Verified Citizen Profile
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Welcome, <span className="font-bold text-slate-800">{currentUser?.name}</span>. Track your submitted land records, inspect certified parcels, or file grievances.
          </p>

          {/* Privacy isolation info pill */}
          <div className="mt-3 inline-flex items-center space-x-3 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span><strong>Aadhaar ID:</strong> {currentUser?.aadhaarMasked || 'XXXX-XXXX-4892'}</span>
            <span>•</span>
            <span><strong>Registered Mobile:</strong> {currentUser?.mobile || '+91 98220 12345'}</span>
          </div>
        </div>

        <Link
          to="/documents/upload"
          className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-2 shrink-0 transition cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Submit Document for Digitization</span>
        </Link>
      </div>

      {/* Success Notification Alert */}
      {grievanceSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-3 text-xs text-emerald-900 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Grievance & Reapplication Registered:</span>
            <p className="text-[11px] text-emerald-800 mt-0.5">{grievanceSuccessMessage}</p>
          </div>
        </div>
      )}


      {/* Filter Tabs & Submissions History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header with Title & Status Tabs */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-800" />
              <h2 className="text-sm font-bold text-slate-900">{t('myRequests')}</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredSubmissions.length} of {submissions.length} Submissions
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-1">
            {[
              { id: 'ALL', label: 'All Submissions' },
              { id: 'PROCESSING', label: 'Under Review' },
              { id: 'ACCEPTED', label: 'Accepted' },
              { id: 'REJECTED', label: 'Action Required / Rejected' },
              { id: 'REAPPLIED', label: 'Reapplied / Grievances' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        <div className="divide-y divide-slate-100">
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No submissions found under this status filter.
            </div>
          ) : (
            filteredSubmissions.map(sub => (
              <div key={sub.id} className="p-5 hover:bg-slate-50/70 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-emerald-950">{sub.id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">{sub.submittedDate}</span>
                  </div>
                  {getStatusBadge(sub.status, sub.simpleStatus)}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{sub.title}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Survey No: <strong className="text-slate-800">{sub.surveyNumber}</strong> • Location: {sub.village}, {sub.taluka} Taluka, {sub.district} District
                  </p>
                </div>

                {/* Status Timeline / Workflow Step */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-700 shrink-0">Latest Progress:</span>
                    <span className="text-slate-600">{sub.latestAction}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-emerald-900 shrink-0">Next Step:</span>
                    <span className="text-emerald-800 font-medium">{sub.nextAction}</span>
                  </div>

                  {/* Rejection Reason display */}
                  {sub.rejectionReason && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-rose-900 bg-rose-50/60 p-2.5 rounded">
                      <span className="font-bold block mb-0.5">Officer Review Notice / Reason for Rejection:</span>
                      <p className="text-[11px] text-rose-800">{sub.rejectionReason}</p>
                    </div>
                  )}

                  {/* Grievance Note display */}
                  {sub.grievanceNote && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-purple-900 bg-purple-50/60 p-2.5 rounded">
                      <span className="font-bold block mb-0.5">Citizen Grievance & Supplementary Document:</span>
                      <p className="text-[11px] text-purple-800">{sub.grievanceNote}</p>
                      {sub.supportingDocName && (
                        <div className="mt-1 text-[10px] font-bold text-purple-950 flex items-center space-x-1">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Evidence Attached: {sub.supportingDocName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions per submission */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-slate-400">
                    Document Ref: {sub.documentId}
                  </div>

                  <div className="flex items-center space-x-2">
                    {sub.status === 'ACCEPTED' && sub.recordId && (
                      <Link
                        to={`/records/${sub.recordId}`}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center space-x-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Official Record</span>
                      </Link>
                    )}

                    {sub.status === 'REJECTED' && (
                      <button
                        onClick={() => handleOpenGrievance(sub)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded text-xs font-bold flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-900" />
                        <span>File Grievance & Reapply</span>
                      </button>
                    )}

                    {sub.status === 'REAPPLIED' && (
                      <span className="text-[11px] font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded border border-purple-200 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-purple-600" />
                        <span>Pending Final Human Officer Review</span>
                      </span>
                    )}

                    {sub.status === 'UNDER_VERIFICATION' && (
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                        In Verification Queue
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Citizen Helpful Links (Privacy Restricted GIS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/map"
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-500 transition flex items-start space-x-3 group"
        >
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white transition">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center">
              <span>My Certified GIS Land Parcels</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 text-emerald-700 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Visualize your approved survey parcels on the spatial map layer. Only your registered land coordinates are accessible.
            </p>
          </div>
        </Link>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start space-x-3">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Government Provenance Guarantee</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              All digitized records are cross-checked against official revenue registers and digitally signed by authorized revenue officers.
            </p>
          </div>
        </div>
      </div>

      {/* GRIEVANCE & REAPPLICATION MODAL */}
      {selectedForGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-6 h-6 text-amber-200" />
                <h2 className="text-base font-black">File Citizen Grievance & Reapply</h2>
              </div>
              <p className="text-xs text-amber-100 mt-1">
                Submission: <span className="font-mono font-bold">{selectedForGrievance.id}</span> (Survey {selectedForGrievance.surveyNumber}, {selectedForGrievance.village})
              </p>
            </div>

            <form onSubmit={handleSubmitGrievance} className="p-6 space-y-4 text-xs">
              {/* Rejection Notice */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
                <span className="font-bold block mb-1">Reason for Initial Rejection:</span>
                <p className="text-[11px] leading-relaxed text-rose-800">
                  {selectedForGrievance.rejectionReason || 'Discrepancy identified in land area or ownership record against master register.'}
                </p>
              </div>

              {/* Grievance Statement */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Grievance Explanation / Justification
                </label>
                <textarea
                  required
                  rows={3}
                  value={grievanceText}
                  onChange={e => setGrievanceText(e.target.value)}
                  placeholder="Explain why this decision should be reviewed (e.g., partition approved under Mutation 1422, attached registered sale deed proves 3.10 hectares)..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Supporting Evidence File Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Supplementary Supporting Document (PDF / JPG)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-4 text-center cursor-pointer bg-slate-50 transition">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setSupportingFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="grievance-file"
                  />
                  <label htmlFor="grievance-file" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="font-semibold text-slate-700">
                      {supportingFile ? supportingFile.name : 'Click to select supporting document'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Accepted formats: PDF, JPG, PNG (Max 10 MB)
                    </span>
                  </label>
                </div>
              </div>

              {/* MANDATORY HUMAN REVIEW WORKFLOW WARNING */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 text-[11px] leading-relaxed flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Mandatory Human Officer Review:</strong>
                  <p className="mt-0.5 text-purple-800">
                    Once reapplied, this submission <strong>CANNOT</strong> be approved by automated AI confidence rules. It will be routed directly to the Tehsildar & Verification Officer worklist for final manual decision.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedForGrievance(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-1.5 transition cursor-pointer"
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
