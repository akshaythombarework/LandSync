import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockApi';
import { LandDocument, LandRecord } from '../types';
import { LoadingState } from '../components/ui/FeedbackStates';
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
    { id: '1', name: 'File Intake & Conversion', desc: 'Validated PDF structure & rendered 3 page images', icon: FileText, status: 'completed' },
    { id: '2', name: 'Image Preprocessing', desc: 'Deskewed rotation (+1.2°), contrast enhancement applied', icon: Layers, status: 'completed' },
    { id: '3', name: 'Document Layout Detection', desc: 'Header, 7/12 table grid, and Devanagari blocks isolated', icon: Layers, status: 'active' },
    { id: '4', name: 'Multilingual OCR Engine', desc: 'Recognized Marathi (मराठी) text blocks with coordinates', icon: Search, status: 'pending' },
    { id: '5', name: 'LLM Structured Extraction', desc: 'Mapped 12 fields (Owner, Survey, Khasra, Area, Village, Tehsil)', icon: Search, status: 'pending' },
    { id: '6', name: 'Validation & Confidence Engine', desc: 'Rule checking, Master Dataset comparison, confidence scoring', icon: ShieldCheck, status: 'pending' }
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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-black text-slate-900">
          {isCompleted ? 'Document Processing & Intelligence Complete' : 'AI Processing Pipeline Active'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Target: <span className="font-semibold text-slate-700">{documentId || 'DOC-2026-001'}</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span>Overall Pipeline Progress</span>
          <span className="text-blue-700">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-700 to-indigo-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Processing Stages Stepper */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Pipeline Stages & Subsystem Execution
        </h2>

        <div className="space-y-3">
          {stages.map(st => {
            const Icon = st.icon;
            return (
              <div
                key={st.id}
                className={`p-3.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                  st.status === 'completed'
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : st.status === 'active'
                    ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-100'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-md ${
                    st.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : st.status === 'active'
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{st.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{st.desc}</p>
                  </div>
                </div>

                <div>
                  {st.status === 'completed' && (
                    <span className="inline-flex items-center text-emerald-700 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> Done
                    </span>
                  )}
                  {st.status === 'active' && (
                    <span className="inline-flex items-center text-blue-700 font-bold text-xs">
                      <Clock className="w-4 h-4 mr-1 animate-spin text-blue-600" /> Running
                    </span>
                  )}
                  {st.status === 'pending' && (
                    <span className="text-slate-400 text-xs">Queued</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion & Next Action Card */}
      {isCompleted && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 p-6 rounded-xl shadow-md text-slate-900 space-y-4 animate-fadeIn">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 rounded uppercase tracking-wider">
                  Human Verification Required
                </span>
                <span className="text-xs text-slate-500">• Confidence: 74%</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Extraction Finished with Flagged Ambiguities
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                The automated AI extraction mapped 10 land attributes. However, <strong className="text-amber-950 font-bold">Plot Area</strong> scored 58% confidence and differs from reference register (2.45 ha vs 2.54 ha). In accordance with statutory human-in-the-loop governance, this record has been routed to the Verification Officer.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to={`/verification/${record?.id || 'rec-201'}`}
              className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center space-x-2 transition"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Open Split-Screen Human Review Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/documents"
              className="py-3 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold text-center transition"
            >
              Return to Documents List
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
