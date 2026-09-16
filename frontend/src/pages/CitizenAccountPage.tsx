import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Save, 
  Lock
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const CitizenAccountPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState(currentUser?.name || 'Rajesh Patil');
  const [mobile, setMobile] = useState(currentUser?.mobile || '+91 98220 12345');
  const [email, setEmail] = useState(currentUser?.email || 'rajesh.patil@example.in');
  const [fatherName, setFatherName] = useState('Dattatray Patil');
  const [dob, setDob] = useState('1978-06-14');
  const [gender, setGender] = useState('Male');
  const [preferredLang, setPreferredLang] = useState('mr');
  const [addressLine, setAddressLine] = useState('House No. 42, Near Maruti Temple');
  const [village, setVillage] = useState('Baramati');
  const [taluka, setTaluka] = useState('Baramati');
  const [district, setDistrict] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('413102');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        category="Citizen Services"
        title="Citizen Account & KYC Profile"
        description="Your registered identity, contact, and postal details."
        icon={User}
        badge={
          <span className="px-2 py-0.5 text-[11px] font-bold border border-[#15803D]/30 text-[#15803D] bg-transparent rounded-[6px] uppercase tracking-wider inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
            UIDAI e-KYC Verified
          </span>
        }
      />

      {saveSuccess && (
        <div className="p-4 bg-white border border-slate-200 border-l-[3px] border-l-[#15803D] rounded-[8px] flex items-center gap-3 text-slate-900 text-sm font-medium animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-[#15803D] flex-shrink-0" />
          <div>
            <div className="font-bold text-slate-900">Profile Updated Successfully</div>
            <div className="text-xs text-slate-600 mt-0.5">Your official citizen profile and contact records have been updated in the state registry.</div>
          </div>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Official Government Identity (Aadhaar / e-KYC) */}
        <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#15803D]" />
              <h2 className="text-sm font-bold text-slate-900">Official government identity (Aadhaar / e-KYC)</h2>
            </div>
            <span className="text-xs text-slate-500">
              Verified — cannot be edited
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Citizen ID
              </label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-mono font-semibold text-slate-800 text-sm">
                {currentUser?.id || 'usr-citizen-1'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Aadhaar number
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-slate-800 font-mono text-sm">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser?.aadhaarMasked || 'XXXX-XXXX-4892'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                e-KYC status
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 border-l-[3px] border-l-[#15803D] rounded-[6px] text-slate-900 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>Active & Certified</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Verified land parcels
              </label>
              <div className="p-2.5 bg-white border border-slate-200 rounded-[6px] text-slate-800 text-sm font-bold flex items-center justify-between">
                <span>3 Land Parcels (7.18 Ha)</span>
                <span className="text-xs font-semibold text-[#166534]">Baramati, Pune</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <User className="w-4 h-4 text-[#15803D]" />
            <h2 className="text-sm font-bold text-slate-900">Personal details</h2>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full legal name (as per Aadhaar / 7/12)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#166534] text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Father's / husband's name
              </label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#166534] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date of birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#166534] text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#166534] text-slate-900 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered mobile (for OTP & notices)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#166534] text-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#166534] text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Postal Address */}
        <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#15803D]" />
              <h2 className="text-sm font-bold text-slate-900">Postal address</h2>
            </div>
            <span className="text-xs text-slate-500">For statutory revenue notices</span>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Street address / house / survey number
              </label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#166534] text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Village / city
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#166534] text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Taluka / tehsil
                </label>
                <input
                  type="text"
                  value={taluka}
                  onChange={(e) => setTaluka(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#166534] text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#166534] text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  PIN code
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#166534] text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[6px] bg-[#166534] hover:bg-[#14532D] text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
