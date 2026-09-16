import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ReviewPolicyMode } from '../types';
import { 
  Settings, 
  ShieldCheck, 
  User, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Save, 
  Info,
  Scale
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

export const SettingsPage: React.FC = () => {
  const { currentUser, reviewPolicy, updateReviewPolicy } = useAuth();
  const { t } = useLanguage();

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'state_officer' || currentUser?.role === 'district_officer';

  const [selectedMode, setSelectedMode] = useState<ReviewPolicyMode>(reviewPolicy.mode);
  const [threshold, setThreshold] = useState<number>(reviewPolicy.confidenceThreshold || 97);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) return;

    updateReviewPolicy({
      mode: selectedMode,
      confidenceThreshold: threshold,
      criticalIssuesForceReview: true
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <PageHeader
        title={t('settings')}
      />

      {savedSuccess && (
        <div className="p-3 bg-white border border-[#166534] rounded-[6px] flex items-center space-x-2 text-xs text-slate-800 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
          <span className="font-semibold">Policy settings saved and applied.</span>
        </div>
      )}

      {/* Officer identity — single line */}
      <div className="text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{currentUser?.name}</span>
        {currentUser?.designation ? <> · <span>{t(currentUser.designation)}</span></> : null}
        {currentUser?.scope?.state ? <> · <span>{t(currentUser.scope.state)}</span></> : null}
        {currentUser?.scope?.district ? <> · <span>{t(currentUser.scope.district)}</span></> : null}
        {' · '}
        {isAuthorized ? (
          <span className="text-slate-500">Authorized to modify policy</span>
        ) : (
          <span className="text-slate-400">Read-only</span>
        )}
      </div>

      {/* HUMAN REVIEW & AUTO-APPROVAL POLICY CONFIGURATION FORM */}
      <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-[#475569] shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Approval policy
              </h2>
              <p className="text-xs text-slate-500">
                Choose whether documents require manual officer approval or allow auto-approval above a threshold.
              </p>
            </div>
          </div>

          {!isAuthorized && (
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold flex items-center space-x-1 border border-slate-300">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Read-Only Policy</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSavePolicy} className="space-y-6">
          {/* Policy Choices Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            style={!isAuthorized ? { opacity: 0.85 } : undefined}
            title={!isAuthorized ? 'Your role cannot modify this policy.' : undefined}
          >
            {/* Mode A: Mandatory Human Review */}
            <div
              role="radio"
              aria-checked={selectedMode === 'MANDATORY_HUMAN_REVIEW'}
              aria-disabled={!isAuthorized}
              onClick={() => { if (isAuthorized) setSelectedMode('MANDATORY_HUMAN_REVIEW'); }}
              onKeyDown={e => { if (isAuthorized && (e.key === 'Enter' || e.key === ' ')) setSelectedMode('MANDATORY_HUMAN_REVIEW'); }}
              tabIndex={isAuthorized ? 0 : -1}
              title={!isAuthorized ? 'Your role cannot modify this policy.' : undefined}
              className={`p-4 rounded-lg border flex flex-col justify-between bg-white ${
                isAuthorized
                  ? selectedMode === 'MANDATORY_HUMAN_REVIEW'
                    ? 'border-[#166534] shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer'
                    : 'border-[#E2E8F0] hover:border-slate-300 cursor-pointer'
                  : 'border-[#E2E8F0] cursor-not-allowed select-none'
              }`}
            >
              <div>
                <div className="flex items-center mb-2">
                  {/* Custom radio circle */}
                  <span
                    className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border mr-2 shrink-0 ${
                      isAuthorized
                        ? selectedMode === 'MANDATORY_HUMAN_REVIEW'
                          ? 'border-[#166534] bg-[#166534]'
                          : 'border-slate-300 bg-white'
                        : 'border-[#94A3B8] bg-white'
                    }`}
                  >
                    {isAuthorized && selectedMode === 'MANDATORY_HUMAN_REVIEW' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="font-bold text-xs text-slate-900">Manual review</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every document requires officer review and approval before a digital record is issued.
                </p>
              </div>
            </div>

            {/* Mode B: Auto-approval above threshold */}
            <div
              role="radio"
              aria-checked={selectedMode === 'AI_AUTO_APPROVAL'}
              aria-disabled={!isAuthorized}
              onClick={() => { if (isAuthorized) setSelectedMode('AI_AUTO_APPROVAL'); }}
              onKeyDown={e => { if (isAuthorized && (e.key === 'Enter' || e.key === ' ')) setSelectedMode('AI_AUTO_APPROVAL'); }}
              tabIndex={isAuthorized ? 0 : -1}
              title={!isAuthorized ? 'Your role cannot modify this policy.' : undefined}
              className={`p-4 rounded-lg border flex flex-col justify-between bg-white ${
                isAuthorized
                  ? selectedMode === 'AI_AUTO_APPROVAL'
                    ? 'border-[#166534] shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer'
                    : 'border-[#E2E8F0] hover:border-slate-300 cursor-pointer'
                  : 'border-[#E2E8F0] cursor-not-allowed select-none'
              }`}
            >
              <div>
                <div className="flex items-center mb-2">
                  {/* Custom radio circle */}
                  <span
                    className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border mr-2 shrink-0 ${
                      isAuthorized
                        ? selectedMode === 'AI_AUTO_APPROVAL'
                          ? 'border-[#166534] bg-[#166534]'
                          : 'border-slate-300 bg-white'
                        : 'border-[#94A3B8] bg-white'
                    }`}
                  >
                    {isAuthorized && selectedMode === 'AI_AUTO_APPROVAL' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="font-bold text-xs text-slate-900">Auto-approval above threshold</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Documents at or above the confidence threshold may be auto-approved, subject to validation rules.
                </p>
              </div>
            </div>
          </div>

          {/* Threshold Slider (Visible when Mode B is selected) */}
          {selectedMode === 'AI_AUTO_APPROVAL' && (
            <div className="p-4 bg-slate-50/50 border border-[#E2E8F0] rounded-lg space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Auto-approval threshold</span>
                <span className="font-mono font-bold text-xs text-[#0F172A] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                  {threshold}%
                </span>
              </div>
              <input
                type="range"
                min="90"
                max="99"
                step="1"
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                disabled={!isAuthorized}
                className="w-full accent-[#166534] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>90% minimum</span>
                <span>99% maximum</span>
              </div>
            </div>
          )}

          {/* CRITICAL POLICY INVARIANT NOTIFICATION */}
          <div className="p-4 bg-white border border-[#E2E8F0] border-l-[3px] border-l-[#D97706] rounded-lg space-y-2 text-xs text-[#334155]">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
              <span className="font-bold text-[#D97706]">System rule</span>
            </div>
            <p className="text-xs leading-relaxed text-[#334155]">
              The threshold does not override:
            </p>
            <ul className="list-disc pl-5 text-xs space-y-1 text-[#334155]">
              <li>Validation rule failures or math mismatches</li>
              <li>Critical warnings (e.g. plot area mismatch)</li>
              <li>Missing mandatory fields</li>
              <li>Duplicate or conflicting survey records</li>
              <li>Reapplied submissions from grievances</li>
            </ul>
            <p className="text-xs text-[#334155] pt-1 font-medium">
              If any critical validation fails, human review is required.
            </p>
          </div>



          {/* Action Button */}
          {isAuthorized && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold shadow-xs flex items-center space-x-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save policy</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

