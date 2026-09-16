import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Download, 
  Search, 
  ChevronRight, 
  UserCheck, 
  Scale, 
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/ui/PageHeader';

interface MutationStep {
  id: number;
  label: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  completedDate?: string;
  actor?: string;
}

interface MutationRecordItem {
  id: string;
  mutationNumber: string;
  type: string;
  surveyNumber: string;
  village: string;
  taluka: string;
  district: string;
  applicant: string;
  submissionDate: string;
  expectedCompletionDate: string;
  currentStatus: 'UNDER_NOTICE' | 'PENDING_VERIFICATION' | 'SANCTIONED' | 'OBJECTION_PENDING';
  currentStatusLabel: string;
  currentStatusMarathi: string;
  steps: MutationStep[];
  noticeNumber?: string;
  noticeExpiryDate?: string;
  notes?: string;
}

export const CitizenMutationPage: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedMutation, setSelectedMutation] = useState<string>('MUT-MH-2026-1422');

  const mutations: MutationRecordItem[] = [
    {
      id: 'MUT-MH-2026-1422',
      mutationNumber: 'Mutation No. 1422 (फेरफार क्र. १४२२)',
      type: 'Sale Deed Mutation (खरेदीखत फेरफार)',
      surveyNumber: '124/3',
      village: 'Baramati',
      taluka: 'Baramati',
      district: 'Pune',
      applicant: 'Rajesh Patil',
      submissionDate: '18-Feb-2026',
      expectedCompletionDate: '15-Mar-2026',
      currentStatus: 'UNDER_NOTICE',
      currentStatusLabel: 'Statutory 15-Day Public Notice Active',
      currentStatusMarathi: '१५ दिवसांची जाहीर नोटीस सुरू',
      noticeNumber: 'NOT-BAR-2026-904',
      noticeExpiryDate: '05-Mar-2026',
      notes: 'Form 9 & Form 13 notices served to co-sharers and adjacent survey holders. Day 11 of 15 statutory period.',
      steps: [
        {
          id: 1,
          label: 'Application & Inward',
          description: 'Document digitized, registered in e-Ferfar ledger',
          status: 'COMPLETED',
          completedDate: '18-Feb-2026',
          actor: 'Citizen Portal / CSC e-Seva'
        },
        {
          id: 2,
          label: 'Scrutiny & Notice Generation',
          description: 'Talathi verified registered sale deed number and generated Form 9 notice',
          status: 'COMPLETED',
          completedDate: '20-Feb-2026',
          actor: 'Village Revenue Officer (Talathi)'
        },
        {
          id: 3,
          label: '15-Day Public Notice Period',
          description: 'Mandatory statutory objection window under Sec 150 MLR Code. Expiring in 4 days.',
          status: 'IN_PROGRESS',
          completedDate: 'In Progress (Day 11/15)',
          actor: 'Tehsil Revenue Circle'
        },
        {
          id: 4,
          label: 'Talathi Field Panchnama',
          description: 'Physical site boundary check and spot report submission',
          status: 'PENDING',
          actor: 'Talathi (Baramati Circle)'
        },
        {
          id: 5,
          label: 'Circle Officer Sanction Order',
          description: 'Final quasi-judicial verification & order certification',
          status: 'PENDING',
          actor: 'Circle Officer / Naib Tehsildar'
        },
        {
          id: 6,
          label: 'Record-of-Rights (7/12) Update',
          description: 'Digitally signed 7/12 extract generated with certified mutation note',
          status: 'PENDING',
          actor: 'National Land Registry System'
        }
      ]
    },
    {
      id: 'MUT-MH-2025-0982',
      mutationNumber: 'Mutation No. 982 (फेरफार क्र. ९८२)',
      type: 'Succession & Heirship (वारस नोंद)',
      surveyNumber: '88/2',
      village: 'Koregaon Mul',
      taluka: 'Haveli',
      district: 'Pune',
      applicant: 'Rajesh Patil & Family',
      submissionDate: '10-Dec-2025',
      expectedCompletionDate: '20-Jan-2026',
      currentStatus: 'SANCTIONED',
      currentStatusLabel: 'Sanctioned & 7/12 Certified',
      currentStatusMarathi: 'मंजूर व ७/१२ वर नोंद प्रमाणित',
      noticeNumber: 'NOT-HAV-2025-412',
      noticeExpiryDate: '26-Dec-2025',
      notes: 'Heirship certificate verified without objection. Mutation approved by Circle Officer Haveli.',
      steps: [
        {
          id: 1,
          label: 'Application & Inward',
          description: 'Heirship affidavit & death certificate uploaded',
          status: 'COMPLETED',
          completedDate: '10-Dec-2025',
          actor: 'Citizen Portal'
        },
        {
          id: 2,
          label: 'Scrutiny & Notice Generation',
          description: 'Verified family tree document and generated notice',
          status: 'COMPLETED',
          completedDate: '12-Dec-2025',
          actor: 'Talathi (Haveli)'
        },
        {
          id: 3,
          label: '15-Day Public Notice Period',
          description: 'Notice displayed at Gram Panchayat office; 0 objections received',
          status: 'COMPLETED',
          completedDate: '27-Dec-2025',
          actor: 'Gram Panchayat Notice Board'
        },
        {
          id: 4,
          label: 'Talathi Field Panchnama',
          description: 'Panchnama executed in presence of Sarpanch & panchas',
          status: 'COMPLETED',
          completedDate: '03-Jan-2026',
          actor: 'Talathi'
        },
        {
          id: 5,
          label: 'Circle Officer Sanction Order',
          description: 'Sanction order approved and digitally signed',
          status: 'COMPLETED',
          completedDate: '11-Jan-2026',
          actor: 'Circle Officer Haveli'
        },
        {
          id: 6,
          label: 'Record-of-Rights (7/12) Update',
          description: 'Names updated in Row 2 of 7/12 extract; mutation seal certified',
          status: 'COMPLETED',
          completedDate: '12-Jan-2026',
          actor: 'RoR Engine'
        }
      ]
    },
    {
      id: 'MUT-MH-2026-1701',
      mutationNumber: 'Mutation No. 1701 (फेरफार क्र. १७०१)',
      type: 'Land Partition & Boundary Demarcation (वाटप फेरफार)',
      surveyNumber: '45/1A',
      village: 'Shirur',
      taluka: 'Shirur',
      district: 'Pune',
      applicant: 'Rajesh Patil',
      submissionDate: '01-Feb-2026',
      expectedCompletionDate: '28-Mar-2026',
      currentStatus: 'PENDING_VERIFICATION',
      currentStatusLabel: 'Under Revenue Officer Field Scrutiny',
      currentStatusMarathi: 'महसूल अधिकाऱ्यांच्या तपासणी अंतर्गत',
      notes: 'Cadastral map boundary comparison identified variance with master parcel grid. Scheduled for joint field measurement.',
      steps: [
        {
          id: 1,
          label: 'Application & Inward',
          description: 'Registered partition deed submitted',
          status: 'COMPLETED',
          completedDate: '01-Feb-2026',
          actor: 'Citizen Portal'
        },
        {
          id: 2,
          label: 'Scrutiny & Notice Generation',
          description: 'Notices issued to co-parceners and adjacent landholders',
          status: 'COMPLETED',
          completedDate: '05-Feb-2026',
          actor: 'Talathi Shirur'
        },
        {
          id: 3,
          label: '15-Day Public Notice Period',
          description: 'Statutory 15 days completed with no third-party claim',
          status: 'COMPLETED',
          completedDate: '20-Feb-2026',
          actor: 'Tehsil Office'
        },
        {
          id: 4,
          label: 'Talathi Field Panchnama',
          description: 'Awaiting joint field verification with Land Records Inspector (DILR)',
          status: 'IN_PROGRESS',
          actor: 'Talathi & DILR Surveyor'
        },
        {
          id: 5,
          label: 'Circle Officer Sanction Order',
          description: 'Final order pending field measurement report',
          status: 'PENDING',
          actor: 'Circle Officer'
        },
        {
          id: 6,
          label: 'Record-of-Rights (7/12) Update',
          description: 'Partition sub-pot numbers creation pending',
          status: 'PENDING',
          actor: 'RoR Engine'
        }
      ]
    }
  ];

  const filteredMutations = mutations.filter(m => {
    const matchesSearch = 
      m.mutationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.surveyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'UNDER_NOTICE') return matchesSearch && m.currentStatus === 'UNDER_NOTICE';
    if (statusFilter === 'SANCTIONED') return matchesSearch && m.currentStatus === 'SANCTIONED';
    if (statusFilter === 'PENDING') return matchesSearch && m.currentStatus === 'PENDING_VERIFICATION';
    return matchesSearch;
  });

  const activeItem = mutations.find(m => m.id === selectedMutation) || mutations[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Mutation (e-Ferfar) & Process Lifecycle"
        description="Track mutation applications and their statutory stages."
        icon={FileSpreadsheet}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-[8px] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Applications</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{mutations.length}</div>
          </div>
          <FileSpreadsheet className="w-5 h-5 text-slate-500 flex-shrink-0" />
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Public Notices Active</div>
            <div className="text-2xl font-bold text-[#A16207] mt-1">1</div>
          </div>
          <Clock className="w-5 h-5 text-slate-500 flex-shrink-0" />
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Panchnama Pending</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">1</div>
          </div>
          <UserCheck className="w-5 h-5 text-slate-500 flex-shrink-0" />
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Sanctioned Entries</div>
            <div className="text-2xl font-bold text-[#166534] mt-1">1</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-slate-500 flex-shrink-0" />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Applications List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search mutation or survey no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-[6px] px-2.5 py-2 font-medium bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#166534]/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNDER_NOTICE">Public Notice Active</option>
                <option value="PENDING">Under Field Scrutiny</option>
                <option value="SANCTIONED">Sanctioned & Certified</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredMutations.map((mut) => {
                const isSelected = mut.id === selectedMutation;
                return (
                  <div
                    key={mut.id}
                    onClick={() => setSelectedMutation(mut.id)}
                    className={`p-4 rounded-[8px] border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-slate-200 border-l-[3px] border-l-[#166534] bg-white shadow-sm' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm leading-snug">
                          {mut.mutationNumber}
                        </div>
                        <div className="text-xs font-semibold text-[#166534] mt-0.5">
                          {mut.type}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-semibold border ${
                        mut.currentStatus === 'SANCTIONED'
                          ? 'border-[#15803D]/30 text-[#15803D] bg-transparent'
                          : mut.currentStatus === 'UNDER_NOTICE'
                          ? 'border-[#A16207]/30 text-[#A16207] bg-transparent'
                          : 'border-[#334155]/30 text-[#334155] bg-transparent'
                      }`}>
                        {mut.currentStatus === 'SANCTIONED' ? 'Certified' : mut.currentStatus === 'UNDER_NOTICE' ? 'Notice Period' : 'Scrutiny'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400">Parcel:</span> Survey {mut.surveyNumber}
                      </div>
                      <div>
                        <span className="text-slate-400">Village:</span> {mut.village}
                      </div>
                      <div>
                        <span className="text-slate-400">Applied:</span> {mut.submissionDate}
                      </div>
                      <div className="flex items-center gap-1 text-[#166534] font-semibold justify-end">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredMutations.length === 0 && (
                <div className="text-center py-8 text-sm text-slate-500">
                  No mutation processes found matching your criteria.
                </div>
              )}
            </div>
          </div>

          {/* Quick Notice Info Box */}
          <div className="bg-white rounded-[8px] border border-slate-200 p-4 text-xs text-slate-600">
            Sec. 150 MLRC: 15-day public notice required before sanction.
          </div>
        </div>

        {/* Right Column: Detailed Lifecycle Tracker for Selected Mutation */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Tracking ID: {activeItem.id}</span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{activeItem.mutationNumber}</h2>
                  <div className="text-sm font-semibold text-[#166534] mt-0.5">{activeItem.type}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => alert(`Downloading statutory notice copy for ${activeItem.mutationNumber}...`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Notice PDF
                  </button>
                  <Link
                    to="/map"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    View on Map
                  </Link>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`mt-4 p-3.5 rounded-[6px] border border-slate-200 bg-white flex items-center justify-between gap-3 ${
                activeItem.currentStatus === 'SANCTIONED'
                  ? 'border-l-[4px] border-l-[#15803D]'
                  : activeItem.currentStatus === 'UNDER_NOTICE'
                  ? 'border-l-[4px] border-l-[#A16207]'
                  : 'border-l-[4px] border-l-[#334155]'
              }`}>
                <div className="flex items-center gap-2.5">
                  {activeItem.currentStatus === 'SANCTIONED' ? (
                    <CheckCircle2 className="w-5 h-5 text-[#15803D] flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-[#A16207] flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500">Current Stage</div>
                    <div className="text-sm font-semibold text-slate-900">{activeItem.currentStatusLabel} ({activeItem.currentStatusMarathi})</div>
                  </div>
                </div>
                {activeItem.noticeExpiryDate && (
                  <div className="text-right text-xs">
                    <div className="text-slate-500 font-medium">Notice Window Closes:</div>
                    <div className="font-bold text-[#0F172A]">{activeItem.noticeExpiryDate}</div>
                  </div>
                )}
              </div>

              {/* Metadata Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-[6px] border border-slate-200">
                  <div className="text-slate-500 font-medium">Land Parcel</div>
                  <div className="font-bold text-slate-900 mt-0.5">Survey {activeItem.surveyNumber}</div>
                </div>
                <div className="bg-white p-2.5 rounded-[6px] border border-slate-200">
                  <div className="text-slate-500 font-medium">Jurisdiction</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeItem.village}, {activeItem.taluka}</div>
                </div>
                <div className="bg-white p-2.5 rounded-[6px] border border-slate-200">
                  <div className="text-slate-500 font-medium">Application Date</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeItem.submissionDate}</div>
                </div>
                <div className="bg-white p-2.5 rounded-[6px] border border-slate-200">
                  <div className="text-slate-500 font-medium">Est. Completion</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeItem.expectedCompletionDate}</div>
                </div>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="p-6">
              <div className="text-sm font-bold text-slate-900 mb-6 flex items-center justify-between">
                <span>Revenue Lifecycle Stages & Milestones</span>
              </div>

              <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activeItem.steps.map((step) => {
                  const isDone = step.status === 'COMPLETED';
                  const isInProgress = step.status === 'IN_PROGRESS';

                  return (
                    <div key={step.id} className="relative">
                      {/* Node circle */}
                      <div className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone 
                          ? 'bg-[#166534] text-white border border-[#166534]' 
                          : isInProgress 
                          ? 'bg-white border-2 border-[#A16207] text-[#A16207] ring-2 ring-[#A16207]/20'
                          : 'bg-white border border-slate-300 text-slate-400'
                      }`}>
                        {isDone ? '✓' : step.id}
                      </div>

                      <div className="pl-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className={`text-sm font-bold ${
                            isDone ? 'text-slate-900' : isInProgress ? 'text-[#A16207]' : 'text-slate-500'
                          }`}>
                            {step.label}
                          </h4>
                          {step.completedDate && (
                            <span className={`text-xs px-2 py-0.5 rounded-[6px] border font-medium ${
                              isDone ? 'border-[#15803D]/30 text-[#15803D] bg-transparent' : 'border-[#A16207]/30 text-[#A16207] bg-transparent font-semibold'
                            }`}>
                              {step.completedDate}
                            </span>
                          )}
                        </div>

                        {step.actor && (
                          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-[4px]">
                            <span className="font-semibold text-slate-700">Authority:</span>
                            <span>{step.actor}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Remarks / Action Notes */}
              {activeItem.notes && (
                <div className="mt-8 p-4 rounded-[8px] bg-white border border-slate-200 text-xs text-slate-700">
                  <div className="font-bold text-slate-900 mb-1">
                    Remarks
                  </div>
                  {activeItem.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

