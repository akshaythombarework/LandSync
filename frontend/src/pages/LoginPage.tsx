import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole, User } from '../types';
import { mockUsers } from '../services/mockData';
import { getStates, getDistricts, getTalukas, getVillages } from '../services/locationData';
import { 
  ShieldCheck, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  ArrowLeft,
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Landmark,
  FileCheck2,
  MapPin,
  Mail,
  Phone,
  Smartphone
} from 'lucide-react';

type LoginPortalType = 'SELECT' | 'CITIZEN' | 'OFFICER' | 'OFFICER_2FA';

interface OfficerAuthorityDef {
  role: UserRole;
  title: string;
  badge: string;
  badgeColor: string;
  scopeDesc: string;
  defaultUser: User;
}

const LandSyncMark: React.FC<{ color?: string; size?: number }> = ({
  color = '#166534',
  size = 40,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="5" y="4" width="2.5" height="12" rx="0.5" fill={color} />
    <rect x="5" y="13.5" width="12" height="2.5" rx="0.5" fill={color} />
    <rect x="14" y="4" width="5" height="5" rx="0.5" fill={color} />
    <rect x="14" y="14.5" width="4.5" height="1.5" rx="0.5" fill={color} opacity="0.5" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [portalType, setPortalType] = useState<LoginPortalType>('SELECT');
  
  // Officer login state
  const [selectedOfficerRole, setSelectedOfficerRole] = useState<UserRole>('verification_officer');
  const [officerEmail, setOfficerEmail] = useState('vikram.deshmukh@gov.in');
  const [officerPassword, setOfficerPassword] = useState('••••••••');

  // Jurisdiction cascade state
  const [jxState, setJxState] = useState<string>('Maharashtra');
  const [jxDistrict, setJxDistrict] = useState<string>('');
  const [jxTaluka, setJxTaluka] = useState<string>('');
  const [jxVillage, setJxVillage] = useState<string>('');
  
  // 2FA state
  const [otpCode, setOtpCode] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState(false);

  // Citizen login & first-time registration state
  const [citizenMode, setCitizenMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');

  // First-time citizen registration fields (strictly: name, mob no, email, password)
  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const officerAuthorities: OfficerAuthorityDef[] = [
    {
      role: 'state_officer',
      title: 'State-level Officer',
      badge: 'Statewide Jurisdiction',
      badgeColor: '',
      scopeDesc: 'Statewide policy and cross-district audits.',
      defaultUser: mockUsers.find(u => u.role === 'state_officer')!
    },
    {
      role: 'district_officer',
      title: 'District-level Officer',
      badge: 'District Jurisdiction',
      badgeColor: '',
      scopeDesc: 'District revenue oversight and escalations.',
      defaultUser: mockUsers.find(u => u.role === 'district_officer')!
    },
    {
      role: 'tehsildar',
      title: 'Tehsildar',
      badge: 'Taluka Jurisdiction',
      badgeColor: '',
      scopeDesc: 'Mutation approval and survey dispute authority.',
      defaultUser: mockUsers.find(u => u.role === 'tehsildar')!
    },
    {
      role: 'talathi',
      title: 'Talathi / Village Officer',
      badge: 'Village Circle Jurisdiction',
      badgeColor: '',
      scopeDesc: 'Village land register (7/12 & 8-A) maintenance.',
      defaultUser: mockUsers.find(u => u.role === 'talathi')!
    },
    {
      role: 'verification_officer',
      title: 'Verification Officer',
      badge: 'Revenue Verification Scope',
      badgeColor: '',
      scopeDesc: 'OCR comparison, field validation, record sign-off.',
      defaultUser: mockUsers.find(u => u.role === 'verification_officer')!
    },
    {
      role: 'survey_officer',
      title: 'Survey / Field Officer',
      badge: 'Cadastral & Spatial Scope',
      badgeColor: '',
      scopeDesc: 'Spatial parcel geometry and GIS ground truth.',
      defaultUser: mockUsers.find(u => u.role === 'survey_officer')!
    }
  ];

  // Depth of jurisdiction cascade per role
  const JURISDICTION_DEPTH: Record<string, ('state' | 'district' | 'taluka' | 'village')[]> = {
    state_officer:       ['state'],
    district_officer:    ['state', 'district'],
    tehsildar:           ['state', 'district', 'taluka'],
    talathi:             ['state', 'district', 'taluka', 'village'],
    verification_officer:['state', 'district', 'taluka'],
    survey_officer:      ['state', 'district', 'taluka'],
  };

  const handleOfficerRoleSelect = (role: UserRole) => {
    setSelectedOfficerRole(role);
    // Reset sub-state fields; keep state pre-filled
    setJxDistrict('');
    setJxTaluka('');
    setJxVillage('');
    const authority = officerAuthorities.find(a => a.role === role);
    if (authority?.defaultUser) {
      setOfficerEmail(authority.defaultUser.email);
    }
  };

  const handleOfficerCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Move to 2FA verification step
    setOtpSentNotice(true);
    setOtpCode('');
    setPortalType('OFFICER_2FA');
  };

  // Map frontend role names to backend demo token keys
  const getRoleToken = (role: UserRole): string => {
    const roleMap: Record<string, string> = {
      admin: 'admin',
      state_officer: 'verification_officer', // fallback to closest demo user
      district_officer: 'district_officer',
      tehsil_officer: 'verification_officer',
      tehsildar: 'verification_officer',
      talathi: 'verification_officer',
      verification_officer: 'verification_officer',
      survey_officer: 'verification_officer',
      citizen: 'citizen',
    };
    return roleMap[role] || 'verification_officer';
  };

  const handleOfficer2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const authority = officerAuthorities.find(a => a.role === selectedOfficerRole);
    // Store Bearer token so api.ts sends Authorization header to backend
    const tokenKey = getRoleToken(selectedOfficerRole);
    localStorage.setItem('novaax_token', `test-token-${tokenKey}`);
    if (authority?.defaultUser) {
      login(authority.defaultUser);
    } else {
      login(selectedOfficerRole);
    }
    navigate('/dashboard');
  };

  const handleCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = localStorage.getItem('landsync_citizen_profile');
    let citizen = mockUsers.find(u => u.role === 'citizen') || mockUsers[2];
    if (saved) {
      try {
        citizen = JSON.parse(saved);
      } catch (err) {
        // use default mock citizen
      }
    }
    // Store citizen token for backend API calls
    localStorage.setItem('novaax_token', 'test-token-citizen');
    // Citizen login strictly via email and password
    login({ 
      ...citizen, 
      email: citizenEmail || citizen.email, 
      onboardingCompleted: true 
    });
    navigate('/citizen-dashboard');
  };

  const handleCitizenSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const newCitizen: User = {
      id: `usr-citizen-${Date.now().toString().slice(-4)}`,
      name: signupName || 'Citizen User',
      email: signupEmail || 'citizen@landsync.gov.in',
      role: 'citizen',
      designation: 'Citizen / Landowner',
      mobile: `+91 ${signupMobile || '9822012345'}`,
      scope: {
        country: 'India',
        state: 'Maharashtra',
      },
      onboardingCompleted: false
    };
    // Store citizen token for backend API calls
    localStorage.setItem('novaax_token', 'test-token-citizen');
    login(newCitizen);
    // Between signup and dashboard, route to extra government e-KYC collection page
    navigate('/citizen/onboarding');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex mb-3">
          <LandSyncMark color="#166534" size={40} />
        </div>
        <h1
          className="text-xl font-bold text-slate-900"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.03em' }}
        >
          LandSync Portal Authentication
        </h1>
      </div>

      {/* VIEW 1: SELECT ENTRY PORTAL (Citizen vs Officer) */}
      {portalType === 'SELECT' && (
        <div className="sm:mx-auto sm:w-full sm:max-w-xl space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Citizen Portal Choice Card */}
            <div
              onClick={() => setPortalType('CITIZEN')}
              className="bg-white p-6 rounded-[8px] border border-[#E2E8F0] hover:border-[#166534] shadow-2xs transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <UserIcon className="w-6 h-6 text-slate-700 mb-3" />
                <div className="text-[10px] font-bold uppercase text-[#475569] tracking-wider mb-1">
                  Public Services
                </div>
                <h2 className="text-sm font-bold text-slate-900">Citizen & Landowner</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Submit documents, track verification, view certified parcels, and file grievances.
                </p>
              </div>

              <div className="mt-6 flex items-center text-xs font-semibold text-[#166534] group-hover:translate-x-0.5 transition-transform">
                <span>Enter Citizen Portal</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Officer Portal Choice Card */}
            <div
              onClick={() => setPortalType('OFFICER')}
              className="bg-white p-6 rounded-[8px] border border-[#E2E8F0] hover:border-[#166534] shadow-2xs transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <Landmark className="w-6 h-6 text-slate-700 mb-3" />
                <div className="text-[10px] font-bold uppercase text-[#475569] tracking-wider mb-1">
                  Privileged Access
                </div>
                <h2 className="text-sm font-bold text-slate-900">Revenue Officer</h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Verification and review access for revenue officers.
                </p>
              </div>

              <div className="mt-6 flex items-center text-xs font-semibold text-[#166534] group-hover:translate-x-0.5 transition-transform">
                <span>Access Official Console</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              ← Back to home
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: CITIZEN LOGIN & FIRST-TIME SIGN-UP */}
      {portalType === 'CITIZEN' && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fadeIn transition-all">
          <div className="bg-white py-6 px-6 border border-[#E2E8F0] rounded-lg sm:px-8 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4 text-[#475569]" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Citizen Portal Sign In
                </h2>
              </div>
              <button
                onClick={() => setPortalType('SELECT')}
                className="text-xs text-[#475569] hover:text-slate-900 flex items-center cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                <span>Switch portal</span>
              </button>
            </div>

            {/* Sign In vs Sign Up Tab Toggle (Underline Style) */}
            <div className="flex border-b border-slate-200 mb-5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setCitizenMode('SIGN_IN')}
                className={`pb-2.5 px-4 transition cursor-pointer ${
                  citizenMode === 'SIGN_IN'
                    ? 'border-b-2 border-[#166534] text-[#166534] font-semibold'
                    : 'border-b-2 border-transparent text-[#475569] hover:text-slate-900'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setCitizenMode('SIGN_UP')}
                className={`pb-2.5 px-4 transition cursor-pointer ${
                  citizenMode === 'SIGN_UP'
                    ? 'border-b-2 border-[#166534] text-[#166534] font-semibold'
                    : 'border-b-2 border-transparent text-[#475569] hover:text-slate-900'
                }`}
              >
                Sign up
              </button>
            </div>

            {/* CITIZEN SIGN IN FORM (Email & Password) */}
            {citizenMode === 'SIGN_IN' ? (
              <form className="space-y-4" onSubmit={handleCitizenSubmit}>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Email</label>
                  <div className="mt-1 relative">
                    <Mail className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={citizenEmail}
                      onChange={e => setCitizenEmail(e.target.value)}
                      required
                      placeholder="e.g. rajesh.patil@example.com"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-[6px] focus:ring-1 focus:ring-[#166534] focus:border-[#166534] focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Password</label>
                  <div className="mt-1 relative">
                    <Lock className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={citizenPassword}
                      onChange={e => setCitizenPassword(e.target.value)}
                      required
                      placeholder="Enter password"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-[6px] focus:ring-1 focus:ring-[#166534] focus:border-[#166534] focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-[6px] text-xs font-semibold text-white bg-[#166534] hover:bg-[#14532D] transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* CITIZEN FIRST-TIME SIGN-UP */
              <form className="space-y-3.5" onSubmit={handleCitizenSignUp}>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      required
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      placeholder="Enter full name"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-[6px] focus:ring-1 focus:ring-[#166534] focus:border-[#166534] focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mobile number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={signupMobile}
                      onChange={e => setSignupMobile(e.target.value)}
                      placeholder="e.g. 9822012345"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-[6px] focus:ring-1 focus:ring-[#166534] focus:border-[#166534] focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      placeholder="e.g. rajesh.patil@example.com"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-[6px] focus:ring-1 focus:ring-[#166534] focus:border-[#166534] focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder="Create password"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-[6px] focus:ring-1 focus:ring-[#166534] focus:border-[#166534] focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-[6px] text-xs font-semibold text-white bg-[#166534] hover:bg-[#14532D] transition-colors flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  <span>Continue to e-KYC</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: OFFICER LOGIN WITH HIERARCHICAL AUTHORITY SELECTION */}
      {portalType === 'OFFICER' && (
        <div className="sm:mx-auto sm:w-full sm:max-w-xl animate-fadeIn">
          <div className="bg-white py-6 px-6 border border-slate-200 rounded-[8px] sm:px-8 shadow-2xs">
            {/* Header with Switch Portal link */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Revenue Officer Authentication</h2>
              </div>
              <button
                type="button"
                onClick={() => setPortalType('SELECT')}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ← Switch portal
              </button>
            </div>

            {/* Privileged Security Banner: White surface, thin amber left border */}
            <div className="mb-5 p-3.5 bg-white border border-slate-200 border-l-4 border-l-[#A16207] rounded-[6px] flex items-start space-x-2.5 text-xs text-slate-700">
              <AlertTriangle className="w-4 h-4 text-[#A16207] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#A16207]">Privileged Administrative Interface:</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Restricted to authorized revenue officers. All activity is audited.
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleOfficerCredentialsSubmit}>
              {/* Hierarchical Authority Level Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Administrative authority level
                </label>

                <div className="border border-slate-200 rounded-[8px] divide-y divide-slate-200 overflow-hidden bg-white">
                  {officerAuthorities.map((auth) => {
                    const isSelected = selectedOfficerRole === auth.role;
                    return (
                      <div
                        key={auth.role}
                        onClick={() => handleOfficerRoleSelect(auth.role)}
                        className={`p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white border-l-[3px] border-l-[#166534]'
                            : 'bg-white hover:bg-slate-50/70 border-l-[3px] border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'border-[#166534] bg-[#166534]' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                              {auth.title}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-[#475569]">
                            {auth.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 pl-6">
                          {auth.scopeDesc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Jurisdiction cascade ── */}
              {(() => {
                const depth = JURISDICTION_DEPTH[selectedOfficerRole] ?? ['state'];
                const states = getStates();
                const districts = jxState ? getDistricts(jxState) : [];
                const talukas = jxDistrict ? getTalukas(jxState, jxDistrict) : [];
                const villages = jxTaluka ? getVillages(jxState, jxDistrict, jxTaluka) : [];
                const selectCls = 'w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-[6px] bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#166534] focus:border-[#166534] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';
                return (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">Jurisdiction</label>

                    {/* State — always shown, read-only for state_officer */}
                    {depth.includes('state') && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">State</label>
                        {selectedOfficerRole === 'state_officer' ? (
                          <div className="px-3 py-2 text-xs border border-[#CBD5E1] rounded-[6px] bg-slate-50 text-slate-600 select-none">
                            {jxState || 'Maharashtra'}
                          </div>
                        ) : (
                          <select
                            value={jxState}
                            onChange={e => { setJxState(e.target.value); setJxDistrict(''); setJxTaluka(''); setJxVillage(''); }}
                            required
                            className={selectCls}
                          >
                            <option value="">Select state</option>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                      </div>
                    )}

                    {/* District */}
                    {depth.includes('district') && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">District</label>
                        <select
                          value={jxDistrict}
                          onChange={e => { setJxDistrict(e.target.value); setJxTaluka(''); setJxVillage(''); }}
                          required
                          disabled={!jxState}
                          className={selectCls}
                        >
                          <option value="">Select district</option>
                          {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Taluka */}
                    {depth.includes('taluka') && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">Taluka</label>
                        <select
                          value={jxTaluka}
                          onChange={e => { setJxTaluka(e.target.value); setJxVillage(''); }}
                          required
                          disabled={!jxDistrict}
                          className={selectCls}
                        >
                          <option value="">Select taluka</option>
                          {talukas.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Village */}
                    {depth.includes('village') && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">Village</label>
                        <select
                          value={jxVillage}
                          onChange={e => setJxVillage(e.target.value)}
                          required
                          disabled={!jxTaluka}
                          className={selectCls}
                        >
                          <option value="">Select village</option>
                          {villages.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Official Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Official Gov Email</label>
                  <div className="mt-1 relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={officerEmail}
                      onChange={e => setOfficerEmail(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-[6px] focus:ring-1 focus:ring-[#15803D] focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Official Password</label>
                  <div className="mt-1 relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={officerPassword}
                      onChange={e => setOfficerPassword(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-[6px] focus:ring-1 focus:ring-[#15803D] focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-[6px] text-xs font-bold text-white bg-[#166534] hover:bg-[#14532D] transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Proceed to verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 4: OFFICER 2FA VERIFICATION STEP */}
      {portalType === 'OFFICER_2FA' && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fadeIn">
          <div className="bg-white py-6 px-6 border border-slate-200 rounded-lg sm:px-8">
            <div className="text-center mb-5">
              <div className="flex justify-center mb-2">
                <KeyRound className="w-5 h-5 text-[#475569]" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Two-Factor Authentication (2FA)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verification required for{' '}
                <span className="font-semibold text-slate-900">
                  {officerAuthorities.find(a => a.role === selectedOfficerRole)?.title}
                </span>{' '}
                access.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-md mb-4 text-xs">
              <div className="flex items-start space-x-2.5">
                <Smartphone className="w-4 h-4 text-[#475569] shrink-0 mt-0.5" />
                <div className="text-slate-900">
                  <span className="font-semibold block text-slate-800">One-time password sent</span>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    A 6-digit OTP was sent by SMS to your registered number ending <span className="font-mono font-semibold">••••4210</span>.
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3 text-slate-600" />
                  Code valid for 5:00 min
                </span>
                <span className="font-medium text-slate-400">Confidential • Do not share</span>
              </div>
            </div>

            <form onSubmit={handleOfficer2FASubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">Enter 6-Digit OTP</label>
                  <button 
                    type="button" 
                    onClick={() => alert('New authentication OTP dispatched to your registered official government device.')}
                    className="text-[11px] text-[#166534] hover:text-[#14532D] font-medium cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center font-mono font-bold text-lg py-2 border border-slate-300 rounded-md tracking-widest focus:ring-1 focus:ring-[#15803D] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPortalType('OFFICER')}
                  className="w-1/3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 px-4 rounded-[6px] text-xs font-semibold text-white bg-[#166534] hover:bg-[#14532D] transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Authorize</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-xs text-slate-400">
        <p>Government of Maharashtra · Revenue Department</p>
      </div>
    </div>
  );
};
