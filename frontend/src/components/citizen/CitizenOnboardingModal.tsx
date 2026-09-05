import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LocationSelector, LocationFilterState } from '../ui/LocationSelector';
import { ShieldCheck, User, Phone, Mail, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface CitizenOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const CitizenOnboardingModal: React.FC<CitizenOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { currentUser, updateCitizenProfile } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState(currentUser?.name || 'Rajesh Bharat Patil');
  const [aadhaarRaw, setAadhaarRaw] = useState('4892');
  const [mobile, setMobile] = useState(currentUser?.mobile || '9822012345');
  const [email, setEmail] = useState(currentUser?.email || 'rajesh.patil@example.com');
  const [gender, setGender] = useState('Male');
  const [streetAddress, setStreetAddress] = useState('Plot 14, Survey 124/3');
  
  const [location, setLocation] = useState<LocationFilterState>({
    country: 'India',
    state: currentUser?.scope?.state || 'Maharashtra',
    district: currentUser?.scope?.district || 'Pune',
    taluka: currentUser?.scope?.taluka || 'Haveli',
    village: currentUser?.scope?.village || 'Wagholi',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const maskedAadhaar = `XXXX-XXXX-${aadhaarRaw.slice(-4) || '4892'}`;
    const fullAddress = `${streetAddress}, ${location.village}, ${location.taluka}, ${location.district}, ${location.state} - India`;
    
    updateCitizenProfile({
      name: fullName,
      aadhaarMasked: maskedAadhaar,
      mobile: `+91 ${mobile}`,
      email,
      gender,
      address: fullAddress,
      scope: {
        country: 'India',
        state: location.state,
        district: location.district,
        taluka: location.taluka,
        tehsil: location.taluka,
        village: location.village,
      },
      onboardingCompleted: true,
    });

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-8 animate-fadeIn">
        {/* Government Emblem Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-6 relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Citizen Landowner Profile Setup</h2>
              <p className="text-xs text-emerald-200">
                Official registration for certified digital land record services & request tracking
              </p>
            </div>
          </div>
        </div>

        {/* Notice Badge */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center space-x-2 text-xs text-emerald-800">
          <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Profile information is confidential, privacy-isolated, and never accessible by other citizens.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Personal Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Legal Name (as per land title)</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. Rajesh Bharat Patil"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other / Transgender</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Aadhaar / Gov ID (Last 4 Digits)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={aadhaarRaw}
                  onChange={(e) => setAadhaarRaw(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="e.g. 4892 (Stored Masked)"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Stored masked as: XXXX-XXXX-4892</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Number (OTP linked)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="9822012345"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                placeholder="rajesh.patil@example.com"
              />
            </div>
          </div>

          {/* Cascading Location Hierarchy */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block font-bold text-slate-800 mb-2">
              Primary Land Jurisdiction / Residential Jurisdiction
            </label>
            <LocationSelector
              value={location}
              onChange={setLocation}
              className="bg-slate-50 p-3 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Street Address / Landmark</label>
            <input
              type="text"
              required
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="e.g. Plot 14, Gat 124, Near Gram Panchayat"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-2 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Save & Enter Citizen Portal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
