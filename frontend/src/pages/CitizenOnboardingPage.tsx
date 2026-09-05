import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  User, 
  CreditCard, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle,
  Building,
  Lock,
  Phone,
  Mail
} from 'lucide-react';

export const CitizenOnboardingPage: React.FC = () => {
  const { currentUser, updateCitizenProfile } = useAuth();
  const navigate = useNavigate();

  // Pre-filled from sign-up
  const initialName = currentUser?.name || 'Rajesh Bharat Patil';
  const initialMobile = currentUser?.mobile ? currentUser.mobile.replace('+91 ', '') : '9822012345';
  const initialEmail = currentUser?.email || 'citizen@landsync.gov.in';

  // Government e-KYC fields
  const [aadhaar, setAadhaar] = useState('4892');
  const [fatherName, setFatherName] = useState('Bharat Govind Patil');
  const [dob, setDob] = useState('1982-05-18');
  const [gender, setGender] = useState('Male');

  // Postal & Revenue Notice Address
  const [houseNo, setHouseNo] = useState('Plot No. 14, Gat No. 124');
  const [street, setStreet] = useState('Near Gram Panchayat Office, Wagholi-Koregaon Road');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [taluka, setTaluka] = useState('Haveli');
  const [village, setVillage] = useState('Wagholi');
  const [pincode, setPincode] = useState('412207');

  // Landholding Linking
  const [surveyNo, setSurveyNo] = useState('124/3');
  const [landArea, setLandArea] = useState('2.45');
  const [khataNo, setKhataNo] = useState('KH-8842');

  // Statutory declaration
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert('Please check the statutory declaration to proceed with e-KYC registration.');
      return;
    }

    setIsSubmitting(true);
    const maskedAadhaar = `XXXX-XXXX-${aadhaar.slice(-4) || '4892'}`;
    const fullAddress = `${houseNo}, ${street}, ${village}, Taluka ${taluka}, District ${district}, ${state} - ${pincode}`;

    const updatedProfile = {
      name: initialName,
      aadhaarMasked: maskedAadhaar,
      mobile: `+91 ${initialMobile}`,
      email: initialEmail,
      gender,
      address: fullAddress,
      scope: {
        country: 'India',
        state,
        district,
        taluka,
        tehsil: taluka,
        village,
      },
      onboardingCompleted: true,
    };

    updateCitizenProfile(updatedProfile);

    // Save in localStorage so user is NEVER asked again on subsequent visits
    localStorage.setItem('landsync_citizen_profile', JSON.stringify({
      ...currentUser,
      ...updatedProfile
    }));
    localStorage.setItem('landsync_has_signed_up', 'true');

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/citizen-dashboard', { replace: true });
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-700/50">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            Step 2 of 2 • One-Time Government e-KYC Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Citizen & Landowner Profile Verification
          </h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm mt-2 leading-relaxed">
            Please provide your official government identity and residential address as required under the Maharashtra Land Revenue Code for certified digital land services and statutory legal notices.
          </p>
        </div>
      </div>

      {/* Verified Account Credentials Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">{initialName}</div>
            <div className="text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{initialEmail}</span>
              <span>•</span>
              <span>+91 {initialMobile}</span>
            </div>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Basic Account Created
        </span>
      </div>

      {/* Main Official Information Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Government Identity (Aadhaar & Personal) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">1. Official Identity & Demographic Details (UIDAI e-KYC)</h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              UIDAI Aadhaar Verified
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Aadhaar Card Number (12 Digits)</label>
              <input
                type="text"
                required
                maxLength={12}
                value={aadhaar}
                onChange={e => setAadhaar(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 548291044892"
                className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Masked format: XXXX-XXXX-4892</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Father's / Husband's Full Name</label>
              <input
                type="text"
                required
                value={fatherName}
                onChange={e => setFatherName(e.target.value)}
                placeholder="e.g. Bharat Govind Patil"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Transgender">Transgender</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Permanent & Statutory Notice Address */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900">2. Permanent & Communication Address (for Revenue Notices)</h2>
          </div>

          <div className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Flat / House / Plot / Survey Number</label>
                <input
                  type="text"
                  required
                  value={houseNo}
                  onChange={e => setHouseNo(e.target.value)}
                  placeholder="e.g. Plot No. 14, Gat No. 124"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street / Landmark / Locality</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="e.g. Near Gram Panchayat Office"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  readOnly
                  value={state}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Taluka / Tehsil</label>
                <input
                  type="text"
                  required
                  value={taluka}
                  onChange={e => setTaluka(e.target.value)}
                  placeholder="e.g. Haveli"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Village / Town</label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  placeholder="e.g. Wagholi"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">6-Digit PIN Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 412207"
                  className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Primary Landholding Identification */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">3. Primary Landholding Linkage (for 7/12 Synchronization)</h2>
            </div>
            <span className="text-[11px] text-slate-500">Record-of-Rights Integration</span>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Gat / Survey Number</label>
              <input
                type="text"
                required
                value={surveyNo}
                onChange={e => setSurveyNo(e.target.value)}
                placeholder="e.g. 124/3"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Recorded Area (Hectares)</label>
              <input
                type="text"
                value={landArea}
                onChange={e => setLandArea(e.target.value)}
                placeholder="e.g. 2.45 Ha"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Khata / Account Number</label>
              <input
                type="text"
                value={khataNo}
                onChange={e => setKhataNo(e.target.value)}
                placeholder="e.g. KH-8842"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Statutory Legal Undertaking */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-950">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-800 border-amber-300 focus:ring-emerald-500"
            />
            <span className="leading-relaxed">
              <strong>Statutory Declaration:</strong> I hereby declare that the personal demographic details, Aadhaar number, permanent residential address, and land parcel references submitted above belong to me and are accurate in accordance with the Maharashtra Land Revenue Code, 1966. I understand that this information will be verified against the state revenue master index.
            </span>
          </label>
        </div>

        {/* Submit & Enter Dashboard */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !agreed}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{isSubmitting ? 'Verifying e-KYC...' : 'Complete e-KYC & Enter Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
