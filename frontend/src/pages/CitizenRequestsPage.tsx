import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Upload, 
  Send, 
  Eye, 
  FileCheck2, 
  ShieldAlert,
  Search,
  Filter
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

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

export const CitizenRequestsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [search, setSearch] = useState('');

  // Grievance modal state
  const [selectedForGrievance, setSelectedForGrievance] = useState<CitizenSubmission | null>(null);
  const [grievanceText, setGrievanceText] = useState('');
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [grievanceSuccessMessage, setGrievanceSuccessMessage] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<CitizenSubmission[]>([
    {
      id: 'REQ-2026-881',
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
      latestAction: 'Routed to Verification Officer for revenue register check',
      nextAction: 'Field comparison against village revenue record'
    },
    {
      id: 'REQ-2025-104',
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
      latestAction: 'Digitized & cross-verified with Sub-Registrar records',
      nextAction: 'Certified Digital Record available for download'
    },
    {
      id: 'REQ-2026-904',
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
      latestAction: 'Area discrepancy flagged against 1984 Cadastral Register',
      nextAction: 'Apply for grievance with partition deed or registered mutation copy',
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

    setGrievanceSuccessMessage(`Grievance successfully submitted for Request ${selectedForGrievance.id}. It has been forwarded to the Tehsildar & Officer Review queue.`);
    setSelectedForGrievance(null);
    setTimeout(() => setGrievanceSuccessMessage(null), 5000);
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchSearch = sub.id.toLowerCase().includes(search.toLowerCase()) ||
                        sub.title.toLowerCase().includes(search.toLowerCase()) ||
                        sub.surveyNumber.toLowerCase().includes(search.toLowerCase()) ||
                        sub.village.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
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
        return <span className="px-2.5 py-1 text-xs font-bold rounded-[6px] bg-transparent border border-[#15803D]/30 text-[#15803D] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />{label}</span>;
      case 'UNDER_VERIFICATION':
      case 'PROCESSING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-[6px] bg-transparent border border-[#A16207]/30 text-[#A16207] flex items-center gap-1"><Clock className="w-3.5 h-3.5 shrink-0" />{label}</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-[6px] bg-transparent border border-[#B91C1C]/30 text-[#B91C1C] flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" />{label}</span>;
      case 'GRIEVANCE_SUBMITTED':
      case 'REAPPLIED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-[6px] bg-transparent border border-slate-400/30 text-slate-600 flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5 shrink-0" />{label}</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-[6px] bg-transparent border border-slate-300 text-slate-600">{label}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        title={t('mySubmissions') || 'My Submissions & Grievances'}
        description="Your verification requests and grievances."
        icon={FileText}
        actions={
          <Link
            to="/documents/upload"
            className="px-3.5 py-1.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Submit New Request</span>
          </Link>
        }
      />

      {/* Grievance Success Notice */}
      {grievanceSuccessMessage && (
        <div className="p-4 bg-white border-l-4 border-[#166534] border border-slate-200 rounded-[6px] flex items-center space-x-3 text-xs text-slate-800 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0" />
          <div>
            <span className="font-bold text-[#166534]">Grievance Registered:</span>
            <p className="text-[11px] text-slate-600 mt-0.5">{grievanceSuccessMessage}</p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search request ID, survey #, village..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#15803D] focus:border-[#15803D]"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PROCESSING', label: 'In Progress' },
            { id: 'ACCEPTED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'REAPPLIED', label: 'Reapplied' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
                activeTab === tab.id
                  ? 'text-[#166534] border-[#166534]'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
        {filteredSubmissions.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No document requests found matching your filter criteria.
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

              {/* Status Details */}
              <div className="p-3.5 bg-white rounded-lg border border-[#E2E8F0] text-xs space-y-1.5">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-slate-700 shrink-0">Current Status:</span>
                  <span className="text-slate-600">{sub.latestAction}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-[#475569] shrink-0">Required Action:</span>
                  <span className="text-[#0F172A] font-medium">{sub.nextAction}</span>
                </div>

                {/* Rejection Notice */}
                {sub.rejectionReason && (
                  <div className="mt-2 pt-2 border-t border-slate-100 bg-white border-l-[3px] border-l-[#B91C1C] pl-3 pr-2 py-2.5 rounded-r-md">
                    <span className="font-bold block mb-1 text-[#B91C1C]">Reason for Rejection:</span>
                    <p className="text-[11px] text-[#B91C1C]">{sub.rejectionReason}</p>
                  </div>
                )}

                {/* Grievance Note */}
                {sub.grievanceNote && (
                  <div className="mt-2 pt-2 border-t border-slate-100 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                    <span className="font-bold block mb-1 text-slate-700">Your Submitted Grievance:</span>
                    <p className="text-[11px] text-slate-600">{sub.grievanceNote}</p>
                    {sub.supportingDocName && (
                      <div className="mt-1 text-[10px] font-bold text-slate-700 flex items-center space-x-1">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Supporting Document: {sub.supportingDocName}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Ref Document: {sub.documentId}
                </span>

                <div className="flex items-center space-x-2">
                  {sub.status === 'ACCEPTED' && sub.recordId && (
                    <Link
                      to={`/records/${sub.recordId}`}
                      className="px-3.5 py-1.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Certified Record</span>
                    </Link>
                  )}

                  {sub.status === 'REJECTED' && (
                    <button
                      onClick={() => handleOpenGrievance(sub)}
                      className="px-3.5 py-1.5 bg-transparent border border-[#A16207] text-[#A16207] rounded-[6px] text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer hover:bg-[#A16207]/5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Apply for Grievance</span>
                    </button>
                  )}

                  {sub.status === 'REAPPLIED' && (
                    <span className="text-[11px] font-semibold text-slate-600 bg-transparent px-2.5 py-1 rounded-[6px] border border-slate-300 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Forwarded for Final Human Verification</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Grievance Modal */}
      {selectedForGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-[8px] border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-fadeIn">
            <div className="bg-white border-b border-slate-200 p-5">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-[#A16207]" />
                <h2 className="text-sm font-bold text-slate-900">Apply for Grievance & Reapply</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Request ID: <span className="font-mono font-bold text-[#0F172A]">{selectedForGrievance.id}</span> (Survey {selectedForGrievance.surveyNumber}, {selectedForGrievance.village})
              </p>
            </div>

            <form onSubmit={handleSubmitGrievance} className="p-6 space-y-4 text-xs">
              <div className="bg-white border-l-[3px] border-l-[#B91C1C] pl-3 pr-2 py-2.5 rounded-r-md border border-slate-200">
                <span className="font-bold block mb-1 text-[#B91C1C]">Reason for Rejection:</span>
                <p className="text-[11px] leading-relaxed text-[#B91C1C]">
                  {selectedForGrievance.rejectionReason}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Explain Grounds for Grievance
                </label>
                <textarea
                  required
                  rows={3}
                  value={grievanceText}
                  onChange={e => setGrievanceText(e.target.value)}
                  placeholder="State your clarification (e.g. Registered partition deed attached proves area is 3.10 hectares, discrepancy in 1984 record was rectified)..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#15803D] focus:border-[#15803D] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Supplementary Proof (PDF / JPG)
                </label>
                <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#166534] rounded-lg p-4 text-center cursor-pointer bg-slate-50 transition">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setSupportingFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="grievance-req-file"
                  />
                  <label htmlFor="grievance-req-file" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="font-semibold text-slate-700">
                      {supportingFile ? supportingFile.name : 'Click to select supplementary proof'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      PDF, JPG, PNG (Max 10 MB)
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-[6px] text-slate-600 text-[11px] leading-relaxed flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-700">Mandatory Human Officer Review:</strong>
                  <p className="mt-0.5 text-slate-500">
                    Reapplied requests are strictly routed to the Tehsildar & Verification Officer worklist. Automated AI confidence policies are disabled for reapplied grievances.
                  </p>
                </div>
              </div>

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
                  className="px-5 py-2.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Grievance & Reapply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
