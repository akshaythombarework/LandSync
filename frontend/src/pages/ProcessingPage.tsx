import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockApi';
import { LandDocument, LandRecord } from '../types';
import { LoadingState } from '../components/ui/FeedbackStates';
import { PageHeader } from '../components/ui/PageHeader';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  FileText, 
  Layers, 
  Search, 
  ShieldCheck, 
  CheckSquare
} from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  desc: string;
  icon: any;
  status: 'pending' | 'active' | 'completed';
}

export const ProcessingPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.role === 'citizen') {
      navigate('/citizen/requests', { replace: true });
    }
  }, [currentUser, navigate]);

  const [doc, setDoc] = useState<LandDocument | null>(null);
  const [record, setRecord] = useState<LandRecord | null>(null);
  const [progress, setProgress] = useState(25);
  const [stages, setStages] = useState<Stage[]>([
    { id: '1', name: 'File Intake & Conversion', desc: '', icon: FileText, status: 'completed' },
    { id: '2', name: 'Image Preprocessing', desc: '', icon: Layers, status: 'completed' },
    { id: '3', name: 'Document Layout Detection', desc: 'Layout and script blocks isolated', icon: Layers, status: 'active' },
    { id: '4', name: 'Multilingual OCR Engine', desc: 'Marathi text extracted', icon: Search, status: 'pending' },
    { id: '5', name: 'Structured extraction', desc: '12 fields extracted', icon: Search, status: 'pending' },
    { id: '6', name: 'Validation', desc: 'Rules and confidence scored', icon: ShieldCheck, status: 'pending' }
  ]);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const runPipelineSimulation = async () => {
      // Step 1: Layout detection
      await new Promise(r => setTimeout(r, 800));
      setProgress(50);
      setStages(s => s.map((item, idx) => idx === 2 ? { ...item, status: 'completed' } : idx === 3 ? { ...item, status: 'active' } : item));

      // Step 2: OCR
      await new Promise(r => setTimeout(r, 900));
      setProgress(75);
      setStages(s => s.map((item, idx) => idx === 3 ? { ...item, status: 'completed' } : idx === 4 ? { ...item, status: 'active' } : item));

      // Step 3: LLM Extraction & Validation
      await new Promise(r => setTimeout(r, 900));
      setProgress(95);
      setStages(s => s.map((item, idx) => idx === 4 ? { ...item, status: 'completed' } : idx === 5 ? { ...item, status: 'active' } : item));

      // Complete backend mock action
      await new Promise(r => setTimeout(r, 800));
      setProgress(100);
      setStages(s => s.map(item => ({ ...item, status: 'completed' })));

      const targetId = documentId || 'doc-101';
      const result = await mockApi.completeProcessing(targetId);
      setDoc(result.doc);
      setRecord(result.record);
      setIsCompleted(true);
    };

    runPipelineSimulation();
  }, [documentId]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isCompleted ? 'Processing complete' : 'Processing pipeline'}
        description={`Document: ${documentId || 'DOC-2026-001'}`}
      />

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Overall Progress</span>
          <span className="text-[#0F172A] font-bold tabular-nums">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className="bg-[#166534] h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Processing Stages Stepper */}
      <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-4">
        <h2 className="text-xs font-semibold text-slate-500 mb-2">
          Processing stages
        </h2>

        <div className="space-y-3">
          {stages.map(st => {
            const Icon = st.icon;
            return (
              <div
                key={st.id}
                className={`p-3.5 rounded-lg border text-xs flex items-center justify-between transition-all bg-white ${
                  st.status === 'active'
                    ? 'border-[#166534] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                    : 'border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 shrink-0 ${
                    st.status === 'completed'
                      ? 'text-[#475569]'
                      : st.status === 'active'
                      ? 'text-[#166534]'
                      : 'text-[#94A3B8]'
                  }`} />
                  <div>
                    <h4 className="font-bold text-slate-900">{st.name}</h4>
                    {st.desc && <p className="text-[11px] text-slate-500 mt-0.5">{st.desc}</p>}
                  </div>
                </div>

                <div>
                  {st.status === 'completed' && (
                    <span className="inline-flex items-center text-xs font-medium text-[#0F172A] space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]"></span>
                      <span>Done</span>
                    </span>
                  )}
                  {st.status === 'active' && (
                    <span className="inline-flex items-center text-xs font-medium text-[#0F172A] space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse"></span>
                      <span>Running</span>
                    </span>
                  )}
                  {st.status === 'pending' && (
                    <span className="inline-flex items-center text-xs font-medium text-slate-400 space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]"></span>
                      <span>Queued</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion & Next Action Card */}
      {isCompleted && (
        <div className="bg-white border border-[#E2E8F0] border-l-[3px] border-l-[#D97706] p-5 rounded-lg space-y-4 animate-fadeIn shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#D97706]">Human verification required</span>
              <h3 className="text-sm font-bold text-slate-900">Extraction complete — review required</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Plot area confidence 58% (2.45 ha vs 2.54 ha reference). Routed for review.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              to={`/verification/${record?.id || 'rec-201'}`}
              className="flex-1 py-2.5 px-4 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-2 transition"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Open Human Review Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/documents"
              className="py-2.5 px-4 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#334155] rounded-[6px] text-xs font-semibold text-center transition"
            >
              Return to Documents
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
