import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { mockApi } from '../services/mockApi';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Languages,
  Check,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const isCitizen = currentUser?.role === 'citizen';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('7_12_Extract_Haveli_Survey_124_3.pdf');
  const [fileSize, setFileSize] = useState('2.4 MB');
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Marathi' | 'Auto Detect'>('Marathi');
  const [category, setCategory] = useState<'Land Record' | 'Ownership Record' | 'Mutation Record' | 'Cadastral Map' | 'Other'>('Land Record');
  const [pageCount, setPageCount] = useState(3);
  const [isUploading, setIsUploading] = useState(false);

  // Success popup state for citizen
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [acknowledgmentId, setAcknowledgmentId] = useState('');

  const handleTemplateSelect = (name: string, lang: 'English' | 'Hindi' | 'Marathi', cat: any, size: string, pages: number) => {
    setFileName(name);
    setFileSize(size);
    setPageCount(pages);
    setLanguage(lang);
    setCategory(cat);
    setSelectedFile(new File(['sample-content'], name, { type: 'application/pdf' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      setPageCount(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const newDoc = await mockApi.addDocument({
        fileName,
        fileType: fileName.endsWith('.pdf') ? 'pdf' : fileName.endsWith('.png') ? 'png' : 'jpg',
        fileSize,
        pageCount,
        uploadedBy: currentUser?.name || 'Citizen User',
        language,
        category,
      }, selectedFile);

      if (isCitizen) {
        // For Citizens: do NOT show the AI processing pipeline.
        // Instead show an animated success confirmation popup with acknowledgment ID.
        setIsUploading(false);
        setAcknowledgmentId(`REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`);
        setShowSuccessModal(true);
      } else {
        // For Officers: Proceed to automated processing pipeline
        navigate(`/documents/${newDoc.id}/processing`);
      }
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const handleResetForAnother = () => {
    setShowSuccessModal(false);
    setSelectedFile(null);
    setFileName('7_12_Extract_Haveli_Survey_124_3.pdf');
    setFileSize('2.4 MB');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        category={isCitizen ? undefined : 'Documents'}
        title={isCitizen ? 'Submit Document' : 'Upload Land Record'}
      />

      {/* Standard Revenue Document Templates */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 mb-1.5">
          <FileText className="w-4 h-4 text-[#475569]" />
          <span>Document templates</span>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">
          Load a sample document.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleTemplateSelect('7_12_Extract_Haveli_Survey_124_3.pdf', 'Marathi', 'Land Record', '2.4 MB', 3)}
            className="text-left p-3 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs transition cursor-pointer"
          >
            <div className="font-bold text-[#0F172A] truncate">7/12 Extract (Haveli)</div>
            <div className="text-[10px] text-slate-500 mt-1">Marathi · 3 Pages · Land Record</div>
          </button>

          <button
            type="button"
            onClick={() => handleTemplateSelect('Sale_Deed_Pune_Plot_45.pdf', 'English', 'Ownership Record', '4.8 MB', 8)}
            className="text-left p-3 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs transition cursor-pointer"
          >
            <div className="font-bold text-[#0F172A] truncate">Registered Sale Deed</div>
            <div className="text-[10px] text-slate-500 mt-1">English · 8 Pages · Ownership</div>
          </button>

          <button
            type="button"
            onClick={() => handleTemplateSelect('Mutation_Entry_Baramati_94.jpg', 'Marathi', 'Mutation Record', '3.1 MB', 1)}
            className="text-left p-3 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs transition cursor-pointer"
          >
            <div className="font-bold text-[#0F172A] truncate">Mutation Register (Ferfar)</div>
            <div className="text-[10px] text-slate-500 mt-1">Marathi · 1 Image · Ferfar</div>
          </button>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#E2E8F0] rounded-lg p-6 space-y-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {/* Drag & Drop Area */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Document file
          </label>
          <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#166534] rounded-lg p-8 text-center transition bg-slate-50 hover:bg-[#166534]/[0.02] relative">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.tiff"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <UploadCloud className="w-10 h-10 text-[#166534] mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-800">
              Drag & drop document here, or <span className="text-[#166534] underline hover:text-[#14532D]">browse files</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports multi-page PDF, High-Res PNG/JPEG, TIFF up to 25 MB
            </p>
          </div>
        </div>

        {/* Extraction Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Languages className="w-4 h-4 text-[#475569]" />
              <span>Document Language</span>
            </label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as any)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#15803D] focus:border-[#15803D]"
            >
              <option value="Marathi">Marathi (मराठी)</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="English">English</option>
              <option value="Auto Detect">Auto Detect Script</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#15803D] focus:border-[#15803D]"
            >
              <option value="Land Record">Land Record (7/12 Extract, Khasra)</option>
              <option value="Ownership Record">Ownership Record (Sale Deed, Title)</option>
              <option value="Mutation Record">Mutation Record (फेरफार नोंद)</option>
              <option value="Cadastral Map">Cadastral / Village Map</option>
              <option value="Other">Other Revenue Document</option>
            </select>
          </div>
        </div>

        {/* Selected File Details Summary */}
        <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#475569]" />
            <span className="font-semibold text-slate-800">{fileName}</span>
            <span className="text-slate-400 tabular-nums">({fileSize} • {pageCount} pages)</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            Ready for submission
          </span>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={isUploading}
          className="w-full py-2.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#15803D]"
        >
          {isUploading ? (
            <span>Processing Submission...</span>
          ) : (
            <>
              <span>{isCitizen ? 'Submit Request for Verification' : 'Submit for processing'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Citizen Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-[8px] max-w-md w-full p-6 sm:p-8 shadow-xl border border-slate-200 text-center relative animate-scaleUp">
            {/* Plain 44px Checkmark Icon */}
            <Check className="w-11 h-11 text-[#166534] stroke-[2.5] mx-auto mb-3" />

            <div className="text-[11px] font-bold uppercase tracking-wider text-[#15803D] mb-1">
              Submission Registered
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Request Submitted
            </h2>
            
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Your request has been received and queued for verification. Updates will be sent via SMS and portal.
            </p>

            {/* Acknowledgment Slip Card */}
            <div className="mt-5 p-4 rounded-[8px] bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Acknowledgment ID:</span>
                <span className="font-mono tabular-nums font-bold text-[#0F172A] text-sm">{acknowledgmentId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Document File:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[180px]">{fileName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Document Type:</span>
                <span className="font-medium text-slate-800">{category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Circle:</span>
                <span className="font-medium text-slate-800">Baramati Revenue Circle</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                to="/citizen/requests"
                className="w-full py-2.5 px-4 bg-[#166534] hover:bg-[#14532D] text-white rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Submission</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleResetForAnother}
                  className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-[8px] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Submit Another</span>
                </button>
                <Link
                  to="/citizen-dashboard"
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-[8px] text-xs font-semibold transition text-center flex items-center justify-center"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
