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
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-emerald-800" />
          <span>{t('settings')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review administrative scope and configure AI document approval and verification policies.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-2 text-xs text-emerald-900 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Governance policy settings successfully saved and applied to the ingestion pipeline.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Officer Profile & Scope Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-900">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('Officer Identity & Jurisdiction')}</h3>
              <p className="text-[11px] text-slate-500">{t('Authorized administrative credentials')}</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">{t('Full Name')}</span>
              <span className="font-bold text-slate-800">{currentUser?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">{t('Designation & Role Authority')}</span>
              <span className="font-bold text-emerald-900">{currentUser?.designation ? t(currentUser.designation) : ''}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">{t('Geographic Administrative Scope')}</span>
              <span className="font-semibold text-slate-800">
                {currentUser?.scope?.state ? t(currentUser.scope.state) : t('Maharashtra')}
                {currentUser?.scope?.district ? ` • ${t(currentUser.scope.district)}` : ''}
                {currentUser?.scope?.taluka || currentUser?.scope?.tehsil ? ` • ${t(currentUser.scope.taluka || currentUser.scope.tehsil || '')}` : ''}
                {currentUser?.scope?.village ? ` • ${t(currentUser.scope.village)}` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">{t('Policy Modification Permission')}</span>
              <span className={`font-bold inline-flex items-center space-x-1 ${isAuthorized ? 'text-emerald-700' : 'text-slate-500'}`}>
                {isAuthorized ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('Authorized Administrative Role')}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('Read-Only (Requires State/District Admin Role)')}</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* System Invariant Guards */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-900">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('Zero Unverified AI Authority')}</h3>
              <p className="text-[11px] text-slate-500">{t('Core legal & validation safeguards')}</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold block">{t('Validation Errors Override')}</span>
                <span className="text-[10px] text-slate-500">{t('AI confidence cannot override rule errors')}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px] border border-emerald-300">
                {t('ACTIVE')}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold block">{t('Reapplied Grievances')}</span>
                <span className="text-[10px] text-slate-500">{t('Always routes to human officer review')}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px] border border-emerald-300">
                {t('ENFORCED')}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold block">{t('Cryptographic Provenance')}</span>
                <span className="text-[10px] text-slate-500">{t('Full audit trail from source file to GIS')}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px] border border-emerald-300">
                {t('ACTIVE')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HUMAN REVIEW & AUTO-APPROVAL POLICY CONFIGURATION FORM */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-800 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Document Approval & Human Review Policy
              </h2>
              <p className="text-xs text-slate-500">
                Configure whether processed documents require mandatory human sign-off or permit AI-assisted approval.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode A: Mandatory Human Review */}
            <label
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedMode === 'MANDATORY_HUMAN_REVIEW'
                  ? 'border-emerald-700 bg-emerald-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              } ${!isAuthorized ? 'pointer-events-none' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 flex items-center">
                    <input
                      type="radio"
                      name="policyMode"
                      value="MANDATORY_HUMAN_REVIEW"
                      checked={selectedMode === 'MANDATORY_HUMAN_REVIEW'}
                      onChange={() => setSelectedMode('MANDATORY_HUMAN_REVIEW')}
                      disabled={!isAuthorized}
                      className="mr-2 text-emerald-700 focus:ring-emerald-500"
                    />
                    Mode A: Mandatory Human Review
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Highest Assurance
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every processed land record document <strong>must be reviewed and explicitly approved</strong> by an authorized human revenue officer before a digital land record is issued.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-emerald-800">
                Zero auto-approval • 100% human verification required
              </div>
            </label>

            {/* Mode B: AI-Assisted Auto Approval */}
            <label
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedMode === 'AI_AUTO_APPROVAL'
                  ? 'border-emerald-700 bg-emerald-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              } ${!isAuthorized ? 'pointer-events-none' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 flex items-center">
                    <input
                      type="radio"
                      name="policyMode"
                      value="AI_AUTO_APPROVAL"
                      checked={selectedMode === 'AI_AUTO_APPROVAL'}
                      onChange={() => setSelectedMode('AI_AUTO_APPROVAL')}
                      disabled={!isAuthorized}
                      className="mr-2 text-emerald-700 focus:ring-emerald-500"
                    />
                    Mode B: AI-Assisted Auto Approval
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    Threshold Protected
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Documents at or above the configured confidence threshold ({threshold}%) may be automatically approved, <strong>subject to strict independent validation rules</strong>.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-amber-800">
                Auto-approves only clean records ≥ {threshold}% confidence
              </div>
            </label>
          </div>

          {/* Threshold Slider (Visible when Mode B is selected) */}
          {selectedMode === 'AI_AUTO_APPROVAL' && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Auto-Approval Confidence Threshold:</span>
                <span className="font-mono font-bold text-sm text-emerald-900 bg-white px-2.5 py-1 rounded border border-emerald-300">
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
                className="w-full accent-emerald-700 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>90% (Strict minimum)</span>
                <span className="font-bold text-emerald-800">97% (Initial Standard Threshold)</span>
                <span>99% (Near certainty)</span>
              </div>
            </div>
          )}

          {/* CRITICAL POLICY INVARIANT NOTIFICATION */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Mandatory System Invariant Notice:</span>
              <p className="text-[11px] leading-relaxed">
                The {threshold}% confidence threshold alone <strong>MUST NOT</strong> automatically override:
              </p>
              <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-950 font-medium">
                <li>Independent validation rule failures or math mismatches</li>
                <li>Critical warnings (e.g. mismatched plot areas vs. revenue registers)</li>
                <li>Missing mandatory information (landowner name, survey/khasra number)</li>
                <li>Duplicate or conflict survey records</li>
                <li>Reapplied submissions following citizen grievance handling</li>
              </ul>
              <p className="text-[10px] text-amber-800 pt-1">
                If any critical validation issue exists, human verification remains strictly mandatory regardless of AI confidence score.
              </p>
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2 text-[11px] text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              <strong>Administrative Workflow Notice:</strong> This configuration defines an internal application workflow policy for the LandSync digitization platform. It does not replace statutory revenue laws or state legal requirements for manual gazette records.
            </p>
          </div>

          {/* Action Button */}
          {isAuthorized && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Review Policy</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
