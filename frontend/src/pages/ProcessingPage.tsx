import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockApi';
import { LandDocument, LandRecord } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { 
  FileText, 
  Layers, 
  ShieldCheck, 
  Tag, 
  LayoutGrid, 
  Globe, 
  Database, 
  SpellCheck, 
  BarChart3, 
  Cpu, 
  Scale, 
  GitCompare, 
  AlertOctagon, 
  Workflow, 
  BadgeCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  CheckSquare, 
  FastForward, 
  RotateCcw,
  Loader2
} from 'lucide-react';

interface Stage {
  id: string;
  num: number;
  name: string;
  desc: string;
  detail: string;
  layer: number;
  layerName: string;
  icon: React.ElementType;
  status: 'pending' | 'active' | 'completed';
}

interface LayerGroup {
  id: number;
  name: string;
  desc: string;
  badge: string;
  stages: Stage[];
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
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 3>(1);
  const [elapsedTime, setElapsedTime] = useState(0);

  const initialStages: Stage[] = [
    // Layer 1: Ingestion & Quality Assessment
    {
      id: '1',
      num: 1,
      name: 'File Intake & Conversion',
      desc: 'Multi-page PDF/TIFF conversion & payload metadata extracted',
      detail: 'Format: PDF/A-2b • Resolution: 300 DPI • Payload size: 2.4 MB',
      layer: 1,
      layerName: 'Ingestion & Quality Assessment',
      icon: FileText,
      status: 'pending'
    },
    {
      id: '2',
      num: 2,
      name: 'Image Preprocessing',
      desc: 'Deskewing, contrast enhancement, binarization & noise reduction',
      detail: 'Deskew: -1.2° adjusted • Contrast ratio: 4.8:1 • Adaptive thresholding applied',
      layer: 1,
      layerName: 'Ingestion & Quality Assessment',
      icon: Layers,
      status: 'pending'
    },
    {
      id: '3',
      num: 3,
      name: 'Document Quality Assessment',
      desc: 'Legibility analysis, blur detection & glare score evaluation',
      detail: 'Legibility score: 94.2% • Noise ratio: Low • Quality check passed',
      layer: 1,
      layerName: 'Ingestion & Quality Assessment',
      icon: ShieldCheck,
      status: 'pending'
    },
    {
      id: '4',
      num: 4,
      name: 'Document Classification',
      desc: 'ML document type identification & template taxonomy matching',
      detail: 'Identified Class: 7/12 Extract (Record of Rights - Adhikar Patrak) (99.1% confidence)',
      layer: 1,
      layerName: 'Ingestion & Quality Assessment',
      icon: Tag,
      status: 'pending'
    },

    // Layer 2: Vision & AI Perception
    {
      id: '5',
      num: 5,
      name: 'Document Layout Detection / Layout Analysis',
      desc: 'Bounding boxes, header regions & columnar table grid isolation',
      detail: 'Isolated 6 layout zones: Header, Khata Table, Mutation Notes, Seal & Stamp',
      layer: 2,
      layerName: 'Vision & AI Perception',
      icon: LayoutGrid,
      status: 'pending'
    },
    {
      id: '6',
      num: 6,
      name: 'Multilingual Multi-pass OCR',
      desc: 'Devanagari (Marathi) & English dual-pass OCR with script recognition',
      detail: 'Primary script: Devanagari (Marathi) • Characters extracted: 1,420 • Accuracy: 98.4%',
      layer: 2,
      layerName: 'Vision & AI Perception',
      icon: Globe,
      status: 'pending'
    },
    {
      id: '7',
      num: 7,
      name: 'Structured Extraction',
      desc: 'LLM key-value schema parsing & tabular field extraction',
      detail: 'Extracted 14 key fields: Survey No, Khata No, Owner Name, Area (Ha), Encumbrances',
      layer: 2,
      layerName: 'Vision & AI Perception',
      icon: Database,
      status: 'pending'
    },
    {
      id: '8',
      num: 8,
      name: 'Normalization & Terminology Mapping',
      desc: 'Revenue terminology translation & Marathi lexical standardization',
      detail: 'Standardized archaic terms: "भोगवटदार वर्ग-१" → Class-1 Occupant, "पोट खराबा" → Uncultivable land',
      layer: 2,
      layerName: 'Vision & AI Perception',
      icon: SpellCheck,
      status: 'pending'
    },

    // Layer 3: Verification & Master Cross-Checking
    {
      id: '9',
      num: 9,
      name: 'Confidence Scoring & Record Risk',
      desc: 'Per-field confidence calculation & document risk index evaluation',
      detail: 'Overall Confidence: 74% • Plot area match confidence flagged at 58%',
      layer: 3,
      layerName: 'Verification & Master Cross-Checking',
      icon: BarChart3,
      status: 'pending'
    },
    {
      id: '10',
      num: 10,
      name: 'Validation Engine',
      desc: 'Data format constraints, data types & required field checks',
      detail: '14/14 field types validated • Syntax & character set encoding verified',
      layer: 3,
      layerName: 'Verification & Master Cross-Checking',
      icon: Cpu,
      status: 'pending'
    },
    {
      id: '11',
      num: 11,
      name: 'Business Rules Validation',
      desc: 'Statutory land rules: Khata total area math & survey division checks',
      detail: 'Calculated total area: 2.45 Ha • Pot Kharaba sub-total verified',
      layer: 3,
      layerName: 'Verification & Master Cross-Checking',
      icon: Scale,
      status: 'pending'
    },
    {
      id: '12',
      num: 12,
      name: 'Master Data Reference Matching',
      desc: 'Cross-matching with District Revenue Gazette & Cadastral GIS registry',
      detail: 'Matched Ward: Haveli, Taluka: Pune • Survey 124/3 verified against District Cadastre',
      layer: 3,
      layerName: 'Verification & Master Cross-Checking',
      icon: GitCompare,
      status: 'pending'
    },
    {
      id: '13',
      num: 13,
      name: 'Duplicate / Conflict / Anomaly Check',
      desc: 'Historical mutation ledger cross-check & variance detection',
      detail: 'Anomaly Detected: Extracted area 2.45 Ha differs from historic record (2.54 Ha)',
      layer: 3,
      layerName: 'Verification & Master Cross-Checking',
      icon: AlertOctagon,
      status: 'pending'
    },

    // Layer 4: Decision & Governance Routing
    {
      id: '14',
      num: 14,
      name: 'Uncertainty / Certainty Routing',
      desc: 'Automated triage: Route low-confidence/conflicting records to Human Review',
      detail: 'Decision: Variance exceeds 5% threshold → Routed to Officer Verification Queue',
      layer: 4,
      layerName: 'Decision & Governance Routing',
      icon: Workflow,
      status: 'pending'
    },
    {
      id: '15',
      num: 15,
      name: 'Final Verification / Verified Record',
      desc: 'Pipeline processing complete. Staged for Officer Sign-off & Audit Log',
      detail: 'Pipeline state saved • Audit trail logged • Review workspace ready',
      layer: 4,
      layerName: 'Decision & Governance Routing',
      icon: BadgeCheck,
      status: 'pending'
    }
  ];

  const [stages, setStages] = useState<Stage[]>(initialStages);

  // Group stages by Layer
  const layers: LayerGroup[] = [
    {
      id: 1,
      name: 'Ingestion & Quality Assessment',
      desc: 'Document intake, format conversion, image enhancement, & legibility pre-checks',
      badge: 'Layer 01',
      stages: stages.filter(s => s.layer === 1)
    },
    {
      id: 2,
      name: 'Vision & AI Perception',
      desc: 'Layout segmentation, Devanagari/English multi-pass OCR, LLM extraction & lexical normalization',
      badge: 'Layer 02',
      stages: stages.filter(s => s.layer === 2)
    },
    {
      id: 3,
      name: 'Verification & Master Cross-Checking',
      desc: 'Confidence scoring, statutory revenue rules, District Gazette matching & anomaly detection',
      badge: 'Layer 03',
      stages: stages.filter(s => s.layer === 3)
    },
    {
      id: 4,
      name: 'Decision & Governance Routing',
      desc: 'Risk-based automated triage, human-in-the-loop review routing & verified record staging',
      badge: 'Layer 04',
      stages: stages.filter(s => s.layer === 4)
    }
  ];

  const runPipelineSimulation = async (fast: boolean = false) => {
    setIsCompleted(false);
    setProgress(0);
    setElapsedTime(0);
    setStages(initialStages.map((st, idx) => idx === 0 ? { ...st, status: 'active' } : st));

    const totalSteps = initialStages.length;
    // Step delay: ~700ms normally (10.5s total), ~220ms in fast mode (3.3s total)
    const stepDelay = fast ? 220 : 700;

    for (let i = 0; i < totalSteps; i++) {
      await new Promise(r => setTimeout(r, stepDelay));

      const currentProgress = Math.round(((i + 1) / totalSteps) * 100);
      setProgress(currentProgress);

      setStages(prev => prev.map((st, idx) => {
        if (idx < i + 1) {
          return { ...st, status: 'completed' };
        } else if (idx === i + 1) {
          return { ...st, status: 'active' };
        } else {
          return { ...st, status: 'pending' };
        }
      }));
    }

    // Call mock API for completed backend state
    const targetId = documentId || 'doc-101';
    const result = await mockApi.completeProcessing(targetId);
    setDoc(result.doc);
    setRecord(result.record);
    setIsCompleted(true);
  };

  useEffect(() => {
    runPipelineSimulation(speedMultiplier === 3);
  }, [documentId]);

  // Elapsed timer ticker
  useEffect(() => {
    if (!isCompleted) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isCompleted]);

  const handleRestart = () => {
    runPipelineSimulation(speedMultiplier === 3);
  };

  const handleToggleSpeed = () => {
    const newSpeed = speedMultiplier === 1 ? 3 : 1;
    setSpeedMultiplier(newSpeed);
  };

  const completedCount = stages.filter(s => s.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title={isCompleted ? 'Processing complete' : 'LandSync Intelligent Processing Pipeline'}
        description={`Document Reference: ${documentId || 'DOC-2026-001'} • State Revenue Records Engine`}
      />

      {/* Progress & Controls Card */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">Overall Pipeline Execution</h3>
              {isCompleted ? (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  15/15 Stages Completed
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-full inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                  Processing Stage {completedCount + 1} of 15
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              End-to-end automated extraction, statutory validation & risk triage workflow
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleSpeed}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 border transition ${
                speedMultiplier === 3
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Toggle fast simulation speed"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>{speedMultiplier === 3 ? 'Fast Speed (3x)' : 'Normal Speed (1x)'}</span>
            </button>

            {isCompleted && (
              <button
                onClick={handleRestart}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition"
                title="Re-run processing pipeline simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-run Pipeline</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center space-x-2">
              <span>Pipeline Progress</span>
              <span className="text-[11px] font-normal text-slate-400">
                ({completedCount} of 15 stages completed)
              </span>
            </span>
            <span className="text-[#0F172A] font-bold tabular-nums">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ease-out rounded-full ${
                isCompleted ? 'bg-[#166534]' : 'bg-[#166534] bg-gradient-to-r from-[#15803D] to-[#166534]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Quick Pipeline Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">Duration</span>
              <span className="font-semibold text-slate-800 tabular-nums">00:{elapsedTime < 10 ? `0${elapsedTime}` : elapsedTime}s</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">Layers</span>
              <span className="font-semibold text-slate-800">
                {layers.filter(l => l.stages.every(s => s.status === 'completed')).length} / 4 Passed
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">Quality Index</span>
              <span className="font-semibold text-slate-800">94.2% High</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Workflow className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">Target Route</span>
              <span className="font-semibold text-[#D97706]">Human Review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layered Pipeline Stepper */}
      <div className="space-y-5">
        {layers.map((layer) => {
          const isLayerActive = layer.stages.some(s => s.status === 'active');
          const isLayerCompleted = layer.stages.every(s => s.status === 'completed');
          const layerCompletedCount = layer.stages.filter(s => s.status === 'completed').length;

          return (
            <div
              key={layer.id}
              className={`bg-white rounded-lg border transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden ${
                isLayerActive
                  ? 'border-[#166534] border-l-4 border-l-[#166534] ring-1 ring-[#166534]/10'
                  : isLayerCompleted
                  ? 'border-[#E2E8F0] border-l-4 border-l-[#15803D]'
                  : 'border-[#E2E8F0] opacity-85'
              }`}
            >
              {/* Layer Header */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded ${
                    isLayerCompleted
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : isLayerActive
                      ? 'bg-[#166534] text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {layer.badge}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      {layer.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 hidden sm:block">
                      {layer.desc}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {isLayerCompleted ? (
                    <span className="inline-flex items-center text-xs font-medium text-emerald-700 space-x-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{layer.stages.length}/{layer.stages.length} Passed</span>
                    </span>
                  ) : isLayerActive ? (
                    <span className="inline-flex items-center text-xs font-medium text-[#166534] space-x-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse"></span>
                      <span>Running ({layerCompletedCount}/{layer.stages.length})</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-slate-400 space-x-1.5 bg-slate-100 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span>Queued</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Layer Stages List */}
              <div className="p-4 space-y-2 relative">
                {/* Vertical Pipeline Connector Line */}
                <div className="absolute left-[29px] top-6 bottom-6 w-0.5 bg-slate-200 -z-0" />

                {layer.stages.map((st) => {
                  const Icon = st.icon;
                  const isActive = st.status === 'active';
                  const isDone = st.status === 'completed';

                  return (
                    <div
                      key={st.id}
                      className={`relative z-10 p-3 rounded-lg border text-xs flex items-start justify-between transition-all bg-white ${
                        isActive
                          ? 'border-[#166534] ring-1 ring-[#166534]/20 bg-emerald-50/20 shadow-sm'
                          : isDone
                          ? 'border-[#E2E8F0] hover:border-slate-300'
                          : 'border-slate-100 bg-slate-50/40'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5 pr-4">
                        {/* Icon Node Badge */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : isActive
                            ? 'bg-[#166534] border-[#166534] text-white shadow-sm ring-2 ring-emerald-200'
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}>
                          {isActive ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Stage Content */}
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                              0{st.num}
                            </span>
                            <h4 className={`font-bold text-xs ${
                              isActive ? 'text-[#166534]' : isDone ? 'text-slate-900' : 'text-slate-500'
                            }`}>
                              {st.name}
                            </h4>
                          </div>

                          <p className={`text-[11px] ${isActive ? 'text-slate-700' : 'text-slate-500'}`}>
                            {st.desc}
                          </p>

                          {/* Dynamic execution detail metadata snippet when active or done */}
                          {(isDone || isActive) && (
                            <div className="pt-1.5 flex items-center space-x-1.5">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-block ${
                                isActive
                                  ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300 animate-pulse'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {isActive ? '⚡ Running: ' : '✓ Output: '}
                                {st.detail}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status indicator pill */}
                      <div className="shrink-0 pt-0.5">
                        {isDone && (
                          <span className="inline-flex items-center text-[11px] font-medium text-[#0F172A] space-x-1.5 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]"></span>
                            <span>Done</span>
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center text-[11px] font-semibold text-[#166534] space-x-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse"></span>
                            <span>Running...</span>
                          </span>
                        )}
                        {st.status === 'pending' && (
                          <span className="inline-flex items-center text-[11px] font-medium text-slate-400 space-x-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
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
          );
        })}
      </div>

      {/* Completion & Next Action Card */}
      {isCompleted && (
        <div className="bg-white border border-[#E2E8F0] border-l-[4px] border-l-[#D97706] p-5 rounded-lg space-y-4 animate-fadeIn shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#D97706]">Human Verification Required</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded-full">
                  Stage 14 Triage Decision
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Extraction Complete — Officer Review Required</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Plot area confidence 58% (2.45 ha extracted vs 2.54 ha historic reference). Variance exceeds statutory threshold (5%). Record automatically routed to your verification queue.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1 border-t border-slate-100">
            <Link
              to={`/verification/${record?.id || 'rec-201'}`}
              className="flex-1 py-2.5 px-4 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-sm"
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
