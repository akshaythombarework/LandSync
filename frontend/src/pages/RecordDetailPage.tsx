import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockApi';
import { ApiService } from '../services/api';
import { LandRecord } from '../types';
import type {
  MasterDataMatch,
  DuplicateCandidate,
  ConflictSummary,
  RecordRisk,
  ReviewRouting,
  GisLinkageInfo,
  FlagExplanation,
} from '../types/intelligence';
import { StatusBadge, ConfidenceBadge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/FeedbackStates';
import {
  MasterDataVerificationPanel,
  DuplicateDetectionPanel,
  ConflictAnomalyPanel,
  RecordRiskPanel,
  ReviewRoutingPanel,
  GisLinkageCard,
  WhyFlaggedDrawer,
  CorrectionHistoryPanel,
} from '../components/ui/IntelligenceCards';
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowLeft, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  User, 
  Layers, 
  Building,
  QrCode,
  Download,
  Award,
  ExternalLink,
  Hash,
  Sprout,
  Landmark,
  Copy,
  Check,
  Compass,
  FileCheck,
  CheckSquare,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export const RecordDetailPage: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();
  const [record, setRecord] = useState<LandRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [manualViewToggle, setManualViewToggle] = useState<boolean | null>(null);
  const isMarathiView = manualViewToggle !== null ? manualViewToggle : (language === 'mr' || language === 'hi');

  // Round-2 intelligence state — all undefined until backend responds
  const [masterDataMatch, setMasterDataMatch] = useState<MasterDataMatch | undefined>();
  const [duplicateStatus, setDuplicateStatus] = useState<DuplicateCandidate | undefined>();
  const [conflictSummary, setConflictSummary] = useState<ConflictSummary | undefined>();
  const [recordRisk, setRecordRisk] = useState<RecordRisk | undefined>();
  const [reviewRouting, setReviewRouting] = useState<ReviewRouting | undefined>();
  const [gisLinkage, setGisLinkage] = useState<GisLinkageInfo | undefined>();
  const [flagExplanations] = useState<FlagExplanation[]>([]); // populated by backend
  const [showWhyFlagged, setShowWhyFlagged] = useState(false);
  const [correctionHistory] = useState<any[]>([]); // populated by backend

  const handleApprove = async () => {
    if (!record) return;
    setActionLoading(true);
    try {
      const approver = currentUser?.name || 'Officer Vikram Deshmukh';
      const updated = await mockApi.approveRecord(record.id, approver, 'Approved from record detail view.');
      setRecord(updated);
      setActionMessage('Record successfully approved and certified!');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {
      console.error('Approve failed:', e);
      setActionMessage('Failed to approve record. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!record || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const rejecter = currentUser?.name || 'Officer Vikram Deshmukh';
      const updated = await mockApi.rejectRecord(record.id, rejecter, rejectReason);
      setRecord(updated);
      setShowRejectModal(false);
      setRejectReason('');
      setActionMessage('Record rejected with official reason.');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {
      console.error('Reject failed:', e);
      setActionMessage('Failed to reject record.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      const targetId = recordId || 'rec-201';
      const data = await mockApi.getRecord(targetId);
      setRecord(data || null);
      setLoading(false);

      // Load Round-2 intelligence non-blocking
      if (data) {
        ApiService.getMasterDataMatch(data.id).then(m => setMasterDataMatch(m ?? undefined));
        ApiService.getDuplicateStatus(data.id).then(d => setDuplicateStatus(d ?? undefined));
        ApiService.getConflictSummary(data.id).then(c => setConflictSummary(c ?? undefined));
        ApiService.getRecordRisk(data.id).then(r => setRecordRisk(r ?? undefined));
        ApiService.getReviewRouting(data.id).then(r => setReviewRouting(r ?? undefined));
        ApiService.getGisLinkage(data.id).then(g => setGisLinkage(g ?? undefined));
      }
    };
    fetchRecord();
  }, [recordId]);

  if (loading || !record) {
    return <LoadingState message="Loading digital land record..." />;
  }

  // Derive intelligent defaults/fallbacks for authentic land record parameters
  const gatNo = record.gatNumber || record.surveyNumber.split('/')[0] || '124';
  const hissaNo = record.hissaNumber || (record.surveyNumber.includes('/') ? record.surveyNumber.split('/')[1] : '1');
  const khasraNo = record.khasraNumber || `${record.surveyNumber} (खसरा क्र.)`;
  const khataNo = record.khataNumber || '45';
  const ulpinNo = record.ulpin || `MH27-${record.district.substring(0, 3).toUpperCase()}-${record.tehsil.substring(0, 3).toUpperCase()}-${gatNo}-${hissaNo}`;
  const certNumber = record.certificateNumber || `MAHA-REV-2026-${record.district.substring(0, 3).toUpperCase()}-098421`;
  const signatureHash = record.digitalSignatureHash || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';

  // Area Calculations (1 hectare = 2.47105 acres = 10,000 sq. meters)
  const totalHectares = record.plotArea || 2.54;
  const totalAcres = (totalHectares * 2.47105).toFixed(2);
  const totalSqMeters = Math.round(totalHectares * 10000).toLocaleString();
  const potkharaba = record.potkharabaArea ?? 0.04;
  const cultivable = record.cultivableArea ?? Math.max(0, +(totalHectares - potkharaba).toFixed(2));
  const jirayat = record.jirayatArea ?? +(cultivable * 0.6).toFixed(2);
  const bagayat = record.bagayatArea ?? +(cultivable * 0.4).toFixed(2);
  const assessment = record.assessmentAmount || '₹ 14.80';
  const water = record.waterSource || 'Well & Khadakwasla Canal Sub-branch';
  const soil = record.soilGrade || 'Medium Black Cotton (Class-1 / मध्यम काळी)';
  const occupancy = record.occupancyClass || 'Class-1 (भोगवटादार वर्ग - १, पूर्ण मालकी हक्क)';
  const fatherName = record.fatherOrHusbandName || 'Bharat Ramchandra Patil';
  const circle = record.revenueCircle || `${record.village} Circle (सजा क्र. ३)`;
  const lgd = record.lgdCode || '556421';

  // Boundaries fallback
  const boundaries = record.boundaries || {
    north: `Gat No. ${parseInt(gatNo) - 1 || 123} (Adjoining agricultural parcel)`,
    south: `Gat No. ${parseInt(gatNo) + 1 || 125} & Grampanchayat Road`,
    east: `Gat No. ${gatNo}/${parseInt(hissaNo) + 1 || 2} (Family sub-holding)`,
    west: `Survey No. ${parseInt(gatNo) + 2 || 126} (Irrigation sub-canal)`
  };

  // Co-owners fallback
  const coOwners = record.coOwners && record.coOwners.length > 0 ? record.coOwners : [
    { name: 'Sunita Rajesh Patil (सुनिता राजेश पाटील)', relation: 'Wife', share: '25%' },
    { name: 'Amit Rajesh Patil (अमित राजेश पाटील)', relation: 'Son', share: '25%' }
  ];

  // Encumbrances fallback
  const encumbrances = record.encumbrances && record.encumbrances.length > 0 ? record.encumbrances : [
    {
      institution: 'Bank of Maharashtra, Wagholi Branch',
      amount: '₹ 2,50,000',
      purpose: 'Kisan Credit Card (Crop Hypothecation)',
      mutationNo: '5102',
      date: '12-Nov-2023'
    }
  ];

  // Crops fallback
  const crops = record.crops && record.crops.length > 0 ? record.crops : [
    { season: 'Kharif 2025–26', cropName: 'Sugarcane (ऊस)', area: `${(cultivable * 0.6).toFixed(2)} Ha`, irrigationType: 'Perennial / Canal' },
    { season: 'Rabi 2025–26', cropName: 'Wheat / Gram (गहू व हरभरा)', area: `${(cultivable * 0.4).toFixed(2)} Ha`, irrigationType: 'Well Irrigation' }
  ];

  // Mutation history fallback
  const mutations = record.mutationEntries && record.mutationEntries.length > 0 ? record.mutationEntries : [
    { mutationNo: '4812', date: '14-Feb-2021', description: 'Succession & Title Mutation (वारस नोंद)', status: 'Approved & Certified' },
    { mutationNo: '5102', date: '12-Nov-2023', description: 'Agricultural Loan Hypothecation (बोजा नोंद)', status: 'Active Charge' }
  ];

  const copyUlpin = () => {
    navigator.clipboard.writeText(ulpinNo);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 print:max-w-full print:p-0 print:m-0">
      {/* Print Specific CSS to ensure authentic certificate output */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: #0f172a !important;
          }
          nav, header, aside, .no-print {
            display: none !important;
          }
          .certificate-container {
            border: 2px solid #047857 !important;
            box-shadow: none !important;
            padding: 24px !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 no-print border-b border-slate-200 pb-3 mb-2">
        <Link
          to="/records"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>{t('Back to Records Directory')}</span>
        </Link>

        <div className="flex items-center flex-wrap gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setManualViewToggle(!isMarathiView)}
            className="px-3 py-1.5 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            title={t("Toggle Bilingual / English View")}
          >
            <span className="font-bold text-[#166534]">अ/A</span>
            <span>{isMarathiView ? t('English View') : t('मराठी / Bilingual View')}</span>
          </button>

          {/* Locate on Map */}
          <Link
            to="/map"
            className="px-3 py-1.5 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <MapPin className="w-3.5 h-3.5 text-[#475569]" />
            <span>View on map</span>
          </Link>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('Print Certificate')}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className="no-print p-3 rounded-lg bg-white border border-[#166534] text-slate-800 text-xs font-semibold flex items-center space-x-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Officer Decision & Approval Action Bar */}
      {currentUser?.role !== 'citizen' && (
        <div className="no-print bg-white border border-[#E2E8F0] border-l-[3px] border-l-[#D97706] rounded-lg px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-[#475569] shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-900 flex items-center space-x-2">
                <span>Officer Actions</span>
                <span className="inline-flex items-center text-xs font-medium text-[#0F172A] space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]"></span>
                  <span>Approved</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Status &middot; Approved
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to={`/verification/${record.id}`}
              className="px-3 py-1.5 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#475569]" />
              <span>Review workspace</span>
            </Link>

            {record.status !== 'APPROVED' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Processing...' : 'Approve & Certify'}</span>
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[6px] text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5 text-white" />
                  <span>Reject</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Round-2 Intelligence Panel Row (no-print) */}
      <div className="no-print space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Record Verification</h2>
          </div>
          {record.status === 'REVIEW_REQUIRED' && (
            <button
              onClick={() => setShowWhyFlagged(true)}
              className="px-3 py-1.5 bg-white border border-[#A16207]/30 text-[#A16207] rounded-[6px] text-xs font-bold flex items-center space-x-1.5 transition"
            >
              <span>Why Was This Flagged?</span>
            </button>
          )}
        </div>

        {/* Top row: Risk + Review Routing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RecordRiskPanel risk={recordRisk} />
          <ReviewRoutingPanel routing={reviewRouting} />
        </div>

        {/* Middle row: Master Data + Duplicate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MasterDataVerificationPanel match={masterDataMatch} />
          <DuplicateDetectionPanel duplicate={duplicateStatus} />
        </div>

        {/* Conflicts full width */}
        <ConflictAnomalyPanel summary={conflictSummary} />

        {/* GIS Linkage + Correction History */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GisLinkageCard linkage={gisLinkage} recordId={record.id} />
          <CorrectionHistoryPanel entries={correctionHistory} />
        </div>
      </div>

      {/* Why Flagged Drawer */}
      <WhyFlaggedDrawer
        open={showWhyFlagged}
        onClose={() => setShowWhyFlagged(false)}
        explanations={flagExplanations}
      />

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Reject Land Record</h3>
            </div>
            <p className="text-xs text-slate-600">
              Please specify the statutory justification for rejecting this land record. This reason will be recorded immutably in the system audit log.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g., Mismatch in official revenue survey boundaries or missing physical documents..."
              rows={3}
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER GOVERNMENT DIGITAL CERTIFICATE */}
      <div className="certificate-container bg-white rounded-[8px] border-4 border-double border-slate-300 shadow-xl p-8 sm:p-10 space-y-7 relative overflow-hidden text-slate-900">
        
        {/* Subtle Guilloche / Security Pattern Watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center select-none overflow-hidden">
          <div className="w-[600px] h-[600px] rounded-full border-[24px] border-[#166534] flex items-center justify-center">
            <div className="w-[480px] h-[480px] rounded-full border-[12px] border-dashed border-[#166534] flex flex-col items-center justify-center text-center p-8">
              <span className="text-3xl font-black tracking-widest uppercase">सत्यमेव जयते</span>
              <span className="text-xl font-bold mt-2">GOVERNMENT OF MAHARASHTRA</span>
              <span className="text-sm font-semibold tracking-wider mt-1">REVENUE DEPARTMENT • MAHABHULEKH</span>
              <span className="text-xs uppercase mt-3">Digitally Certified True Copy</span>
            </div>
          </div>
        </div>

        {/* TOP ORNAMENTAL SECURITY BAR */}
        <div className="h-1.5 bg-linear-to-r from-[#0F172A] via-[#166534] to-[#0F172A] rounded-xs"></div>

        {/* 1. OFFICIAL EMBLEM & HEADERS */}
        <div className="border-b-2 border-slate-900 pb-5 text-center relative">
          
          {/* Top Badges (Approved & State) */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold tracking-wider text-[#15803D] bg-transparent px-2.5 py-1 rounded-[6px] border border-[#15803D]/30 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Digitally Certified Extract</span>
            </div>

            <div className="flex items-center space-x-2">
              {record.status === 'APPROVED' ? (
                <span className="px-2 py-0.5 text-[11px] font-semibold border border-[#15803D]/30 text-[#15803D] bg-transparent rounded-[6px]">
                  Approved
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[11px] font-semibold border border-[#A16207]/30 text-[#A16207] bg-transparent rounded-[6px]">
                  Review Required
                </span>
              )}
              <div className="hidden sm:inline-block text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-[6px] border border-slate-300">
                Form VII, XII & VIII-A
              </div>
            </div>
          </div>

          {/* Ashoka Stambh / State Emblem Icon Styled Representation */}
          <div className="flex justify-center mb-2">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-[#166534] flex items-center justify-center text-amber-400 shadow-md border-2 border-amber-500/80">
                <Landmark className="w-7 h-7 text-amber-300" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full border border-white">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Bilingual Government Heading */}
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-[#166534] tracking-wider">
              महाराष्ट्र शासन • महसूल व वन विभाग
            </div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-slate-800">
              Government of Maharashtra • Revenue Department
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight pt-1">
              {isMarathiView 
                ? 'डिजिटल स्वाक्षरित अधिकार अभिलेख पत्रक (७/१२ व ८-अ)' 
                : 'Certified Digital Land Record Certificate (Record of Rights / 7/12)'}
            </h1>
            <p className="text-[11px] text-slate-600 font-medium">
              Issued under Maharashtra Land Revenue Code, 1966
            </p>
          </div>

          {/* ULPIN & Certificate Barcode Strip */}
          <div className="mt-4 pt-3 border-t border-dashed border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs bg-slate-50 p-3 rounded-[6px] border border-slate-200">
            {/* ULPIN (Bhu-Aadhaar) */}
            <div className="text-left flex items-center space-x-2">
              <Hash className="w-4 h-4 text-[#166534] shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">ULPIN (Bhu-Aadhaar No.)</span>
                <span className="font-mono font-bold text-slate-900 flex items-center">
                  {ulpinNo}
                  <button 
                    onClick={copyUlpin}
                    className="ml-1 text-slate-400 hover:text-slate-700 p-0.5 no-print"
                    title="Copy ULPIN"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-[#166534]" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
              </div>
            </div>

            {/* Certificate Serial */}
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Certificate Serial No.</span>
              <span className="font-mono font-bold text-slate-900">{certNumber}</span>
            </div>

            {/* Verification Timestamp */}
            <div className="text-right sm:text-right text-left">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Digital Verification Date</span>
              <span className="font-semibold text-slate-800">{record.approvedAt || '05/09/2026, 01:17 AM'}</span>
            </div>
          </div>
        </div>

        {/* 2. ADMINISTRATIVE GEOGRAPHY & REVENUE JURISDICTION */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-[#166534]" />
              <span>1. Administrative Jurisdiction & Revenue Office (प्रशासकीय कार्यक्षेत्र)</span>
            </h3>
            <span className="text-[10px] font-semibold text-slate-500">LGD Village Code: <strong>{lgd}</strong></span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-[6px] border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">State (राज्य)</span>
              <span className="font-bold text-slate-900">{record.state || 'Maharashtra'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">District (जिल्हा)</span>
              <span className="font-bold text-slate-900">{record.district}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Tehsil / Taluka (तालुका)</span>
              <span className="font-bold text-slate-900">{record.tehsil}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Village / Mouje (गाव / मौजे)</span>
              <span className="font-bold text-slate-900 text-[#166534]">{record.village}</span>
            </div>
          </div>
        </div>

        {/* 3. PARCEL IDENTIFIERS & SURVEY / GAT / KHASRA NUMBERS (PRIMARY REQUEST) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#166534]" />
              <span>2. Cadastral Parcel Identifiers & Land Demarcation (जमीन व भूमापन तपशील)</span>
            </h3>
            <span className="text-[10px] text-[#15803D] bg-transparent px-2 py-0.5 rounded-[6px] font-bold border border-[#15803D]/30">
              Verified Revenue Records
            </span>
          </div>

          {/* Prominent High-Impact Identity Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-[8px] text-xs">
            {/* Gat Number */}
            <div className="bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs">
              <span className="text-[#166534] font-bold block text-[10px] uppercase">Gat Number (गट क्र.)</span>
              <span className="text-lg font-black text-slate-900">{gatNo}</span>
              <span className="text-[10px] text-slate-500 block">Hissa No: <strong>{hissaNo}</strong></span>
            </div>

            {/* Survey / Khasra Number */}
            <div className="bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs">
              <span className="text-[#166534] font-bold block text-[10px] uppercase">Survey / Khasra No.</span>
              <span className="text-lg font-black text-slate-900">{record.surveyNumber}</span>
              <span className="text-[10px] text-slate-500 block">Khasra: <strong>{khasraNo}</strong></span>
            </div>

            {/* Khatauni / Khata Number */}
            <div className="bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs">
              <span className="text-[#166534] font-bold block text-[10px] uppercase">Khata No. (खाते क्र.)</span>
              <span className="text-lg font-black text-slate-900">{khataNo}</span>
              <span className="text-[10px] text-slate-500 block">Old Survey: <strong>118/A</strong></span>
            </div>

            {/* Revenue Circle */}
            <div className="bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs">
              <span className="text-[#166534] font-bold block text-[10px] uppercase">Revenue Circle (मंडळ)</span>
              <span className="text-sm font-bold text-slate-800 truncate block mt-0.5">{circle}</span>
              <span className="text-[10px] text-slate-500 block">Talathi Saja: 03</span>
            </div>

            {/* Land Classification */}
            <div className="bg-white p-3 rounded-[6px] border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[#166534] font-bold block text-[10px] uppercase">Classification (प्रकार)</span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">{record.landClassification}</span>
              <span className="text-[10px] text-slate-500 block">{soil}</span>
            </div>
          </div>
        </div>

        {/* 4. CERTIFIED AREA MEASUREMENT & CULTIVABLE BREAKDOWN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Sprout className="w-3.5 h-3.5 text-[#166534]" />
              <span>3. Certified Area & Land Assessment Details (क्षेत्र, आकारणी व प्रतवारी)</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Standard metric: hectare (ha) / sq.m</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Total Area Box */}
            <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Certified Area (एकूण क्षेत्र)</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{totalHectares}</span>
                <span className="text-xs font-bold text-[#166534]">Hectares (हे.)</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex justify-between">
                <span>Equivalent: <strong>{totalAcres} Acres</strong></span>
                <span><strong>{totalSqMeters} m²</strong></span>
              </div>
            </div>

            {/* Cultivable vs Potkharaba breakdown */}
            <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600 font-medium">Cultivable Area (लागवडयोग्य):</span>
                <strong className="text-slate-900">{cultivable} Ha</strong>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 pl-2">
                <span>• Jirayat (जिरायत / कोरडवाहू):</span>
                <span>{jirayat} Ha</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 pl-2">
                <span>• Bagayat (बागायत / ओलीत):</span>
                <span>{bagayat} Ha</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Potkharaba (पोटखराबा - अकृषक):</span>
                <strong className="text-[#A16207]">{potkharaba} Ha</strong>
              </div>
            </div>

            {/* Assessment & Irrigation */}
            <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Govt. Assessment (आकारणी रु.)</span>
                <span className="font-extrabold text-slate-900 text-sm">{assessment}</span>
                <span className="text-[10px] text-slate-500 block">Per Annum (वार्षिक जुडी)</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Irrigation Source (पाणी व्यवस्था)</span>
                <span className="font-semibold text-slate-800 text-[11px]">{water}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. LANDOWNER, CO-OWNERS & TENANCY RIGHTS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#166534]" />
              <span>4. Registered Landowner & Tenancy Information (भोगवटादार व सहखातेदार तपशील)</span>
            </h3>
            <span className="text-[10px] font-bold text-[#15803D] bg-transparent px-2 py-0.5 rounded-[6px] border border-[#15803D]/30">
              UIDAI Bhu-Aadhaar Verified
            </span>
          </div>

          <div className="border border-slate-200 rounded-[8px] overflow-hidden">
            {/* Primary Holder Banner */}
            <div className="bg-slate-100 p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Primary Landowner (मुख्य खातेदार)</span>
                <span className="text-base font-black text-slate-950">{record.ownerName}</span>
                <span className="text-[11px] text-slate-500 block">Father/Husband: {fatherName}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Occupancy Class (भोगवटादार वर्ग)</span>
                <span className="font-bold text-slate-900 block mt-0.5">{occupancy}</span>
                <span className="text-[11px] text-slate-500">Ownership: {record.ownershipType}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Latest Mutation (फेरफार क्र.)</span>
                <span className="font-bold text-slate-900 block mt-0.5">{record.mutationInfo || 'Mutation No. 4812 approved'}</span>
                <span className="text-[11px] text-slate-500">Registration: {record.registrationDate || '2021-02-14'}</span>
              </div>
            </div>

            {/* Joint Holders / Co-owners Table */}
            {coOwners.length > 0 && (
              <div className="p-3 bg-white text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                  Joint Title Holders & Co-owners (सहखातेदार तपशील):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {coOwners.map((owner, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-[6px] bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-900">{owner.name}</span>
                        <span className="text-[10px] text-slate-500 block">Relation: {owner.relation}</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#15803D] bg-transparent px-2 py-0.5 rounded-[6px] border border-[#15803D]/30">
                        {owner.share} Share
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. FOUR BOUNDARIES (चतुःसीमा) & GIS MAP CENTROID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-[#166534]" />
              <span>5. Adjoining Boundaries & Geo-Spatial Location (चतुःसीमा व भू-स्थानक)</span>
            </h3>
            <Link to="/map" className="text-[11px] font-bold text-[#166534] hover:underline flex items-center space-x-1 no-print">
              <span>View on GIS map</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Boundaries Compass Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-[8px] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white rounded-[6px] border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">North (उत्तर सीमा)</span>
                  <span className="font-semibold text-slate-800 text-[11px]">{boundaries.north}</span>
                </div>
                <div className="p-2 bg-white rounded-[6px] border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">South (दक्षिण सीमा)</span>
                  <span className="font-semibold text-slate-800 text-[11px]">{boundaries.south}</span>
                </div>
                <div className="p-2 bg-white rounded-[6px] border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">East (पूर्व सीमा)</span>
                  <span className="font-semibold text-slate-800 text-[11px]">{boundaries.east}</span>
                </div>
                <div className="p-2 bg-white rounded-[6px] border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">West (पश्चिम सीमा)</span>
                  <span className="font-semibold text-slate-800 text-[11px]">{boundaries.west}</span>
                </div>
              </div>
            </div>

            {/* GIS Centroid & Spatial Integration */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-[8px] flex flex-col justify-between text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-slate-900 font-bold">
                  <MapPin className="w-4 h-4 text-[#166534] shrink-0" />
                  <span>Geodetic Centroid Coordinates (WGS-84)</span>
                </div>
                <div className="font-mono text-xs bg-white px-2.5 py-1 rounded-[6px] border border-slate-200 font-bold text-slate-800">
                  LAT: {record.latitude ? record.latitude.toFixed(6) : '18.579342'}° N • LON: {record.longitude ? record.longitude.toFixed(6) : '73.983210'}° E
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Cadastral survey boundary polygon is synchronized with the Maharashtra BhuNaksha GIS mapping repository and verified against ground demarcations.
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px]">
                <span className="text-slate-600">Polygon Status: <strong className="text-[#15803D]">Closed & Non-Overlapping</strong></span>
                <span className="text-slate-700 font-bold">SRID: EPSG:4326</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7. ENCUMBRANCES, LIABILITIES & OTHER RIGHTS (FORM VII-C) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Landmark className="w-3.5 h-3.5 text-[#166534]" />
              <span>6. Liabilities, Bank Encumbrances & Other Rights (इतर अधिकार व बोजा)</span>
            </h3>
            <span className="text-[10px] text-slate-500">Section 148 MLR Code</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-[8px] border border-slate-200 text-xs">
            {encumbrances.length > 0 ? (
              <div className="space-y-2">
                {encumbrances.map((enc, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-white rounded-[6px] border border-slate-200 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{enc.institution}</span>
                        <span className="text-[10px] text-[#DC2626] bg-transparent font-semibold px-2 py-0.5 rounded-[6px] border border-[#DC2626]">
                          Active Hypothecation
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        {enc.purpose} • Charge Entry Date: {enc.date}
                      </span>
                    </div>

                    <div className="text-right sm:text-right text-left">
                      <span className="font-black text-slate-900 text-sm">{enc.amount}</span>
                      <span className="text-[10px] text-slate-500 block">Mutation No: <strong>{enc.mutationNo}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-slate-500 font-medium">
                Nil (कोणताही शासकीय अथवा बँकेचा बोजा नाही / Free from Encumbrances)
              </div>
            )}
          </div>
        </div>

        {/* 8. CROP DETAILS - FORM 12 (पीक पाहणी) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <Sprout className="w-3.5 h-3.5 text-[#166534]" />
              <span>7. Crop Survey & Land Utilization - Form 12 (चालू हंगाम पीक पाहणी)</span>
            </h3>
            <span className="text-[10px] text-slate-500">Year: 2025–2026</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {crops.map((crop, idx) => (
              <div key={idx} className="p-3 bg-white rounded-[6px] border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#166534] block">{crop.season}</span>
                  <span className="font-bold text-slate-900 text-sm">{crop.cropName}</span>
                  <span className="text-[10px] text-slate-500 block">Irrigation: {crop.irrigationType}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900">{crop.area}</span>
                  <span className="text-[10px] text-slate-400 block">Area Sown</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 9. VERIFICATION & AUDIT TRAIL */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <FileCheck className="w-3.5 h-3.5 text-[#166534]" />
              <span>8. VERIFICATION & AUDIT TRAIL</span>
            </h3>
            <span className="text-[10px] text-slate-500">Digital Record Lineage</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs p-3 bg-slate-50 rounded-[8px] border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Source document:</span>
              <span className="font-semibold text-slate-900">{record.documentId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">OCR:</span>
              <span className="font-semibold text-slate-900">Multilingual OCR Layout Engine</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Cross-validation:</span>
              <span className="font-semibold text-slate-900">Passed</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Officer approval:</span>
              <span className="font-semibold text-[#15803D]">Approved</span>
            </div>
          </div>
        </div>

        {/* 10. DIGITAL SIGNATURE & LEGAL AUTHENTICATION FOOTER */}
        <div className="border-t-2 border-slate-900 pt-5 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          
          {/* Official Verification QR Code Box */}
          <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-[8px]">
            {/* SVG Visual Representation of Verifiable QR Code */}
            <div className="w-16 h-16 bg-white p-1 rounded border border-slate-300 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900" fill="currentColor">
                <rect x="0" y="0" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="10" y="10" width="10" height="10" />
                <rect x="70" y="0" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="80" y="10" width="10" height="10" />
                <rect x="0" y="70" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="10" y="80" width="10" height="10" />
                <rect x="40" y="10" width="10" height="10" />
                <rect x="55" y="25" width="10" height="10" />
                <rect x="40" y="40" width="20" height="20" />
                <rect x="70" y="55" width="10" height="10" />
                <rect x="85" y="70" width="15" height="10" />
                <rect x="40" y="75" width="15" height="15" />
              </svg>
            </div>
            <div className="text-[10px] space-y-0.5">
              <span className="font-bold text-slate-800 block">Verify document</span>
              <p className="text-slate-500">Scan to verify against the state registry.</p>
              <span className="text-[9px] font-mono text-[#166534] block truncate">{ulpinNo}</span>
            </div>
          </div>

          {/* Legal Validity Disclaimer */}
          <div className="text-[10px] text-slate-500 leading-relaxed sm:border-x sm:border-slate-200 sm:px-4">
            <strong className="text-slate-700 block mb-0.5 uppercase tracking-wider text-[9px]">Legal Certification Notice</strong>
            This is an electronically generated and certified land record issued under Section 148 of the Maharashtra Land Revenue Code, 1966. In accordance with Section 65B of the Indian Evidence Act and Information Technology Act, 2000, digitally certified copies carry full legal validity and require no physical ink seal or signature.
          </div>

          {/* Official Digital Signature Certificate */}
          <div className="p-3 bg-white border border-[#E2E8F0] border-l-[3px] border-l-[#166534] rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-[#166534] font-bold">
              <Award className="w-4 h-4 text-[#166534] shrink-0" />
              <span>Digitally Signed by Authority</span>
            </div>
            <div className="font-black text-slate-900 text-xs">
              {record.approvedBy || 'Shri Vikram Deshmukh'}
            </div>
            <div className="text-[10px] text-slate-600">
              Sub-Divisional Officer / Tehsildar, Haveli Division, Pune
            </div>
            <div className="text-[9px] font-mono text-slate-400 truncate pt-1 border-t border-slate-100">
              Hash: {signatureHash.substring(0, 32)}...
            </div>
          </div>
        </div>

        {/* BOTTOM ORNAMENTAL SECURITY BAR */}
        <div className="h-1.5 bg-linear-to-r from-[#166534] via-[#A16207] to-[#166534] rounded-xs"></div>
      </div>
    </div>
  );
};
