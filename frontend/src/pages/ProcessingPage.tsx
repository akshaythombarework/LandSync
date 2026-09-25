import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockApi';
import { LandDocument, LandRecord } from '../types';
import { ArrowRight } from 'lucide-react';

interface Stage {
  id: string;
  num: number;
  name: string;
  desc?: string;
  detail?: string;
  layer: number;
  layerName: string;
  status: 'pending' | 'active' | 'completed';
}

interface LayerGroup {
  id: number;
  name: string;
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
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const initialStages: Stage[] = [
    // Layer 1: Ingestion & Quality
    {
      id: '1',
      num: 1,
      name: 'File Intake & Conversion',
      layer: 1,
      layerName: 'Layer 1 — Ingestion & Quality',
      status: 'pending'
    },
    {
      id: '2',
      num: 2,
      name: 'Image Preprocessing',
      layer: 1,
      layerName: 'Layer 1 — Ingestion & Quality',
      status: 'pending'
    },
    {
      id: '3',
      num: 3,
      name: 'Document Quality Assessment',
      layer: 1,
      layerName: 'Layer 1 — Ingestion & Quality',
      status: 'pending'
    },
    {
      id: '4',
      num: 4,
      name: 'Document Classification',
      layer: 1,
      layerName: 'Layer 1 — Ingestion & Quality',
      status: 'pending'
    },

    // Layer 2: Vision & Layout
    {
      id: '5',
      num: 5,
      name: 'Document Layout Detection / Layout Analysis',
      layer: 2,
      layerName: 'Layer 2 — Vision & Layout',
      status: 'pending'
    },
    {
      id: '6',
      num: 6,
      name: 'Multilingual Multi-pass OCR',
      layer: 2,
      layerName: 'Layer 2 — Vision & Layout',
      status: 'pending'
    },
    {
      id: '7',
      num: 7,
      name: 'Structured Extraction',
      layer: 2,
      layerName: 'Layer 2 — Vision & Layout',
      status: 'pending'
    },
    {
      id: '8',
      num: 8,
      name: 'Normalization & Terminology Mapping',
      layer: 2,
      layerName: 'Layer 2 — Vision & Layout',
      status: 'pending'
    },

    // Layer 3: Verification
    {
      id: '9',
      num: 9,
      name: 'Confidence Scoring & Record Risk',
      layer: 3,
      layerName: 'Layer 3 — Verification',
      status: 'pending'
    },
    {
      id: '10',
      num: 10,
      name: 'Validation Engine',
      layer: 3,
      layerName: 'Layer 3 — Verification',
      status: 'pending'
    },
    {
      id: '11',
      num: 11,
      name: 'Business Rules Validation',
      layer: 3,
      layerName: 'Layer 3 — Verification',
      status: 'pending'
    },
    {
      id: '12',
      num: 12,
      name: 'Master Data Reference Matching',
      layer: 3,
      layerName: 'Layer 3 — Verification',
      status: 'pending'
    },
    {
      id: '13',
      num: 13,
      name: 'Duplicate / Conflict / Anomaly Check',
      layer: 3,
      layerName: 'Layer 3 — Verification',
      status: 'pending'
    },

    // Layer 4: Routing
    {
      id: '14',
      num: 14,
      name: 'Uncertainty / Certainty Routing',
      layer: 4,
      layerName: 'Layer 4 — Routing',
      status: 'pending'
    },
    {
      id: '15',
      num: 15,
      name: 'Final Verification / Verified Record',
      layer: 4,
      layerName: 'Layer 4 — Routing',
      status: 'pending'
    }
  ];

  const [stages, setStages] = useState<Stage[]>(initialStages);

  // Group stages by Layer
  const layers: LayerGroup[] = [
    {
      id: 1,
      name: 'Layer 1 — Ingestion & Quality',
      stages: stages.filter(s => s.layer === 1)
    },
    {
      id: 2,
      name: 'Layer 2 — Vision & Layout',
      stages: stages.filter(s => s.layer === 2)
    },
    {
      id: 3,
      name: 'Layer 3 — Verification',
      stages: stages.filter(s => s.layer === 3)
    },
    {
      id: 4,
      name: 'Layer 4 — Routing',
      stages: stages.filter(s => s.layer === 4)
    }
  ];

  const runPipelineSimulation = async () => {
    setIsCompleted(false);
    setElapsedTime(0);
    setStages(initialStages.map((st, idx) => idx === 0 ? { ...st, status: 'active' } : st));

    const totalSteps = initialStages.length;
    const stepDelay = 600;

    for (let i = 0; i < totalSteps; i++) {
      await new Promise(r => setTimeout(r, stepDelay));

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
    let isMounted = true;
    const fetchInitialDoc = async () => {
      if (documentId) {
        const found = await mockApi.getDocument(documentId);
        if (found && isMounted) {
          setDoc(found);
        }
      }
    };
    fetchInitialDoc();
    runPipelineSimulation();

    return () => {
      isMounted = false;
    };
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

  // Contextual subtitle details
  const docRef = record?.displayId || doc?.displayId || (documentId?.startsWith('doc-') ? 'DOC-2026-001' : (documentId || 'LR-PUN-00107'));
  const docType = doc?.category === 'Land Record' ? '7/12 Extract' : (doc?.category || '7/12 Extract');
  const parcelLocation = record?.village && record?.tehsil ? `${record.village}, ${record.tehsil}` : 'Wagholi, Haveli';
  const subtitle = `${docRef} · ${docType} · ${parcelLocation}`;

  // Terminal state metrics
  const outcomeText = record?.status === 'APPROVED' ? 'Verified' : 'Routed for review';
  const qualityIndex = `${record?.overallConfidence || doc?.overallConfidence || 74}%`;
  const targetRoute = record?.status === 'APPROVED' ? 'Direct Approval' : 'Human Review';

  return (
    <div className="min-h-full bg-[#F8FAF8] -m-5 md:-m-7 p-5 md:p-7">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0]">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Processing Pipeline</h1>
            <p className="text-xs text-[#475569] mt-0.5">
              {subtitle}
            </p>
          </div>
          <Link
            to="/verification"
            className="text-xs font-medium text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1 self-start sm:self-auto transition"
          >
            <span>←</span>
            <span>Back to queue</span>
          </Link>
        </div>

        {/* 4 Layers Stepper */}
        <div className="space-y-6">
          {layers.map((layer) => (
            <div key={layer.id} className="space-y-2">
              <h2 className="text-xs font-semibold text-[#475569] tracking-normal">
                {layer.name}
              </h2>

              <div className="space-y-2">
                {layer.stages.map((st) => {
                  const isActive = st.status === 'active';
                  const isDone = st.status === 'completed';

                  return (
                    <div
                      key={st.id}
                      className="bg-white border border-[#E2E8F0] rounded-[8px] px-4 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-medium text-[#475569] tabular-nums">
                          {st.num < 10 ? `0${st.num}` : st.num}
                        </span>
                        <span className="text-xs font-medium text-[#0F172A]">
                          {st.name}
                        </span>
                      </div>

                      {/* Status Indicator: dot + text */}
                      <div className="flex items-center space-x-1.5 text-xs shrink-0">
                        {isDone && (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                            <span className="font-medium text-[#0F172A]">Done</span>
                          </>
                        )}
                        {isActive && (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#166534] animate-pulse" />
                            <span className="font-medium text-[#0F172A]">Running</span>
                          </>
                        )}
                        {st.status === 'pending' && (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
                            <span className="font-medium text-[#475569]">Queued</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Terminal Post-Completion Summary Block */}
        {isCompleted && (
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-[#E2E8F0]">
              <div>
                <span className="text-[11px] font-medium text-[#475569] block mb-1">Outcome</span>
                <div className="flex items-center space-x-1.5 text-xs">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      outcomeText === 'Verified' ? 'bg-[#15803D]' : 'bg-[#166534]'
                    }`}
                  />
                  <span className="font-semibold text-[#0F172A]">{outcomeText}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-[#475569] block mb-1">Quality Index</span>
                <span className="text-xs font-semibold text-[#0F172A] tabular-nums">{qualityIndex}</span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-[#475569] block mb-1">Target Route</span>
                <span className="text-xs font-semibold text-[#0F172A]">{targetRoute}</span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-[#475569] block mb-1">Total Duration</span>
                <span className="text-xs font-semibold text-[#0F172A] tabular-nums">{elapsedTime}s</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to={`/verification/${record?.id || 'rec-201'}`}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold rounded-[6px] transition shadow-sm"
              >
                <span>Open Verification Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingPage;
