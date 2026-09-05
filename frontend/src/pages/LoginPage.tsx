import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole, User } from '../types';
import { mockUsers } from '../services/mockData';
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

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [portalType, setPortalType] = useState<LoginPortalType>('SELECT');
  
  // Officer login state
  const [selectedOfficerRole, setSelectedOfficerRole] = useState<UserRole>('verification_officer');
  const [officerEmail, setOfficerEmail] = useState('vikram.deshmukh@gov.in');
  const [officerPassword, setOfficerPassword] = useState('••••••••');
  
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
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      scopeDesc: 'Full state policy, cross-district audits, and automated approval policy configuration.',
      defaultUser: mockUsers.find(u => u.role === 'state_officer')!
    },
    {
      role: 'district_officer',
      title: 'District-level Officer',
      badge: 'District Jurisdiction',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      scopeDesc: 'District collectorate revenue oversight, taluka performance tracking, and regional escalations.',
      defaultUser: mockUsers.find(u => u.role === 'district_officer')!
    },
    {
      role: 'tehsildar',
      title: 'Tehsildar',
      badge: 'Taluka Jurisdiction',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      scopeDesc: 'Executive authority for mutation approval, survey disputes, and tehsil land records.',
      defaultUser: mockUsers.find(u => u.role === 'tehsildar')!
    },
    {
      role: 'talathi',
      title: 'Talathi / Village Officer',
      badge: 'Village Circle Jurisdiction',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      scopeDesc: 'Ground-level land register (7/12 & 8-A) maintenance, crop entries, and village parcels.',
      defaultUser: mockUsers.find(u => u.role === 'talathi')!
    },
    {
      role: 'verification_officer',
      title: 'Verification Officer',
      badge: 'Revenue Verification Scope',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      scopeDesc: 'Detailed split-screen OCR comparison, field validation correction, and candidate record sign-off.',
      defaultUser: mockUsers.find(u => u.role === 'verification_officer')!
    },
    {
      role: 'survey_officer',
      title: 'Survey / Field Officer',
      badge: 'Cadastral & Spatial Scope',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      scopeDesc: 'Spatial parcel geometry validation, survey boundary alignment, and GIS ground truth.',
      defaultUser: mockUsers.find(u => u.role === 'survey_officer')!
    }
  ];

  const handleOfficerRoleSelect = (role: UserRole) => {
    setSelectedOfficerRole(role);
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Tricolor decorative banner */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-white to-emerald-600 w-full z-50" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-emerald-900 items-center justify-center text-amber-400 font-black shadow-lg mb-3 border border-emerald-700">
          <ShieldCheck className="w-9 h-9 text-emerald-300" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">LandSync Portal Authentication</h1>
        <p className="mt-1 text-xs text-slate-600 font-medium">
          National Land Record Digitization & Cadastral Validation Platform
        </p>
      </div>

      {/* VIEW 1: SELECT ENTRY PORTAL (Citizen vs Officer) */}
      {portalType === 'SELECT' && (
        <div className="sm:mx-auto sm:w-full sm:max-w-xl space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Citizen Portal Choice Card */}
            <div
              onClick={() => setPortalType('CITIZEN')}
              className="bg-white p-6 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <UserIcon className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-800 tracking-wider">
                  Public Services
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-2">Citizen & Landowner</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Track land document digitization, submit records for verification, view certified parcels, and file grievances.
                </p>
              </div>

              <div className="mt-6 flex items-center text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                <span>Enter Citizen Portal</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Officer Portal Choice Card */}
            <div
              onClick={() => setPortalType('OFFICER')}
              className="bg-white p-6 rounded-2xl border-2 border-slate-200 hover:border-emerald-800 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4 group-hover:bg-emerald-900 group-hover:text-amber-400 transition">
                  <Landmark className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-900 tracking-wider">
                  Privileged Access
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-2">Revenue Officer</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Hierarchical verification authority for State, District, Tehsildar, Talathi, Verification, and Survey officers.
                </p>
              </div>

              <div className="mt-6 flex items-center text-xs font-bold text-emerald-900 group-hover:translate-x-1 transition-transform">
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
              ← Back to Portal Home
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: CITIZEN LOGIN & FIRST-TIME SIGN-UP */}
      {portalType === 'CITIZEN' && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fadeIn transition-all">
          <div className="bg-white py-7 px-6 shadow-md border border-slate-200 rounded-2xl sm:px-8">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-emerald-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  {citizenMode === 'SIGN_IN' ? 'Citizen Portal Sign In' : 'First-Time Citizen Registration (नवीन नोंदणी)'}
                </h2>
              </div>
              <button
                onClick={() => setPortalType('SELECT')}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                <span>Switch Portal</span>
              </button>
            </div>

            {/* Sign In vs Sign Up Tab Toggle */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCitizenMode('SIGN_IN')}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  citizenMode === 'SIGN_IN'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Registered Citizen (Sign In)
              </button>
              <button
                type="button"
                onClick={() => setCitizenMode('SIGN_UP')}
                className={`py-2 rounded-lg transition cursor-pointer ${
                  citizenMode === 'SIGN_UP'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                New Citizen? (Sign Up)
              </button>
            </div>

            {/* CITIZEN SIGN IN FORM (Strictly Email & Password Only - No Extra Login Options) */}
            {citizenMode === 'SIGN_IN' ? (
              <form className="space-y-4" onSubmit={handleCitizenSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Official Registered Email Address</label>
                  <div className="mt-1 relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={citizenEmail}
                      onChange={e => setCitizenEmail(e.target.value)}
                      required
                      placeholder="e.g. rajesh.patil@example.com"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Account Password</label>
                  <div className="mt-1 relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={citizenPassword}
                      onChange={e => setCitizenPassword(e.target.value)}
                      required
                      placeholder="Enter account password"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg shadow-sm text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Sign In to Citizen Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* CITIZEN FIRST-TIME SIGN-UP (Only Name, Mob No, Email, Password) */
              <form className="space-y-3.5" onSubmit={handleCitizenSignUp}>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                  <span className="font-bold">First-Time Registration:</span> Create your account credentials. You will complete your official government e-KYC profile in the next step.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      required
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      placeholder="Enter full name"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={signupMobile}
                      onChange={e => setSignupMobile(e.target.value)}
                      placeholder="e.g. 9822012345"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      placeholder="e.g. rajesh.patil@example.com"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder="Create account password"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg shadow-sm text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                  <span>Continue to e-KYC Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: OFFICER LOGIN WITH HIERARCHICAL AUTHORITY SELECTION */}
      {portalType === 'OFFICER' && (
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl animate-fadeIn">
          <div className="bg-white py-8 px-6 shadow-md border border-slate-200 rounded-2xl sm:px-10">
            {/* Header with Privileged Warning */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-emerald-900" />
                <h2 className="text-sm font-bold text-slate-900">Revenue Officer Authentication</h2>
              </div>
              <button
                onClick={() => setPortalType('SELECT')}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                <span>Switch Portal</span>
              </button>
            </div>

            {/* Privileged Security Banner */}
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Privileged Administrative Interface:</span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Authorized access is strictly restricted to designated state and revenue officers. All logins and document mutations are cryptographically audited.
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleOfficerCredentialsSubmit}>
              {/* Hierarchical Authority Level Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Select Officer Administrative Authority Level:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {officerAuthorities.map((auth) => {
                    const isSelected = selectedOfficerRole === auth.role;
                    return (
                      <div
                        key={auth.role}
                        onClick={() => handleOfficerRoleSelect(auth.role)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-700 bg-emerald-50/70 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                            {auth.title}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${auth.badgeColor}`}>
                            {auth.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {auth.scopeDesc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Official Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Official Gov Email</label>
                  <div className="mt-1 relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={officerEmail}
                      onChange={e => setOfficerEmail(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Official Password</label>
                  <div className="mt-1 relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={officerPassword}
                      onChange={e => setOfficerPassword(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg shadow-sm text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Proceed to Step 2: Officer Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 4: OFFICER 2FA VERIFICATION STEP */}
      {portalType === 'OFFICER_2FA' && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fadeIn">
          <div className="bg-white py-8 px-6 shadow-md border border-slate-200 rounded-2xl sm:px-10">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-2 border border-emerald-200">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Two-Factor Authentication (2FA)</h2>
              <p className="text-xs text-slate-500 mt-1">
                Official security challenge for privileged role:{' '}
                <span className="font-bold text-emerald-900">
                  {officerAuthorities.find(a => a.role === selectedOfficerRole)?.title}
                </span>
              </p>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl mb-4 text-xs">
              <div className="flex items-start space-x-2.5">
                <Smartphone className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-emerald-950">
                  <span className="font-bold block text-emerald-900">Official GovDevice Dispatch</span>
                  <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                    A 6-digit one-time authorization passcode (OTP) has been dispatched via NIC GovSMS to your registered official handheld device ending in <span className="font-bold font-mono">••••••4210</span>.
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px] text-emerald-700">
                <span className="flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Code valid for 5:00 min
                </span>
                <span className="font-medium text-slate-500">Confidential • Do not share</span>
              </div>
            </div>

            <form onSubmit={handleOfficer2FASubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Enter 6-Digit OTP</label>
                  <button 
                    type="button" 
                    onClick={() => alert('New authentication OTP dispatched to your registered official government device.')}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
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
                  className="w-full text-center font-mono font-bold text-lg py-2.5 border border-slate-300 rounded-lg tracking-widest focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPortalType('OFFICER')}
                  className="w-1/3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 px-4 rounded-lg shadow-sm text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Verify & Authorize</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-xs text-slate-500">
        <p>National Land Record Modernization & Cadastral Verification Portal • Government of India</p>
      </div>
    </div>
  );
};
