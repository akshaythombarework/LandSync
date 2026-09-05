import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { Language } from '../../services/translations';
import { 
  ShieldCheck, 
  UserCircle, 
  LogOut, 
  ChevronDown, 
  MapPin, 
  Globe, 
  Check, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  ExternalLink,
  Edit3
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, switchRole, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isCitizen = currentUser?.role === 'citizen';

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(e.target.value as UserRole);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Tricolor decorative government banner */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-white to-emerald-600 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Platform Name */}
          <Link to={isCitizen ? '/citizen-dashboard' : '/dashboard'} className="flex items-center space-x-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-amber-400 font-black shadow-inner border border-emerald-700">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-slate-900">LandSync</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 rounded border border-emerald-300 uppercase tracking-wider">
                  {t('govBadge')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {t('portalSubtitle')}
              </p>
            </div>
          </Link>

          {/* Center: Current Administrative Scope / Jurisdiction */}
          <div className="hidden md:flex items-center px-3 py-1.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-bold">{isCitizen ? t('Citizen Ward:') : `${t('jurisdictionScope')}:`}</span>
            <span className="font-medium text-emerald-800">
              {currentUser?.scope?.state ? t(currentUser.scope.state) : t('Maharashtra')}
              {currentUser?.scope?.district ? ` • ${t(currentUser.scope.district)}` : ''}
              {currentUser?.scope?.taluka || currentUser?.scope?.tehsil ? ` • ${t(currentUser.scope.taluka || currentUser.scope.tehsil || '')}` : ''}
              {currentUser?.scope?.village ? ` • ${t(currentUser.scope.village)}` : ''}
            </span>
          </div>

          {/* Right Actions: Language Switcher, Role Section & Interactive User Profile */}
          <div className="flex items-center space-x-3">
            {/* Global Language Switcher */}
            <div className="flex items-center space-x-1 bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <div className="relative">
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer pr-4 appearance-none text-xs"
                  aria-label={t('Select UI Language')}
                >
                  <option value="en">English (EN)</option>
                  <option value="hi">हिंदी (HI)</option>
                  <option value="mr">मराठी (MR)</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Role Section: Static Badge showing exact logged-in role. No role dropdown in citizen or officer interface. */}
            <div className="flex items-center space-x-1.5 bg-emerald-100/90 border border-emerald-300 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
              <span className="text-emerald-950 font-bold hidden sm:inline">{t('Role:')}</span>
              <span className="font-semibold text-emerald-950">
                {t(
                  currentUser?.role === 'citizen'
                    ? 'Citizen / Landowner'
                    : currentUser?.role === 'state_officer'
                    ? 'State Revenue Officer'
                    : currentUser?.role === 'district_officer'
                    ? 'District Revenue Officer'
                    : currentUser?.role === 'tehsildar'
                    ? 'Tehsildar'
                    : currentUser?.role === 'talathi'
                    ? 'Village Officer (Talathi)'
                    : currentUser?.role === 'verification_officer'
                    ? 'Verification Officer'
                    : currentUser?.role === 'survey_officer'
                    ? 'Survey / Cadastral Officer'
                    : currentUser?.role === 'admin'
                    ? 'System Administrator'
                    : currentUser?.designation || 'Authorized Officer'
                )}
              </span>
            </div>

            {/* Profile Section (Interactive button opens User Information Dropdown) */}
            <div className="relative pl-2 border-l border-slate-200" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer text-left focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                aria-expanded={isProfileOpen}
                title={t('View user profile information')}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs shrink-0">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-bold text-slate-800 leading-tight">{currentUser?.name}</p>
                  <p className="text-slate-500 text-[10px] leading-tight">{currentUser?.designation ? t(currentUser.designation) : ''}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Information Popup Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-3 px-4 z-50 animate-scaleUp">
                  {/* User Header */}
                  <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-sm shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{currentUser?.name}</h3>
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-900 rounded border border-emerald-200 mt-0.5">
                        {isCitizen ? t('Verified Citizen / Landowner') : (currentUser?.designation ? t(currentUser.designation) : '')}
                      </span>
                    </div>
                  </div>

                  {/* User Information Details */}
                  <div className="py-3 space-y-2.5 text-xs">
                    {currentUser?.aadhaarMasked && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" /> {t('Aadhaar ID:')}
                        </span>
                        <span className="font-mono font-bold text-slate-800">{currentUser.aadhaarMasked}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {t('Registered Mobile:')}
                      </span>
                      <span className="font-medium text-slate-800">{currentUser?.mobile || '+91 98220 12345'}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> {t('Official Email')}:
                      </span>
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">
                        {currentUser?.email || 'rajesh.patil@example.in'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {t('Jurisdiction Scope')}:
                      </span>
                      <span className="font-medium text-slate-800">
                        {t(currentUser?.scope?.village || 'Baramati')}, {t(currentUser?.scope?.district || 'Pune')}
                      </span>
                    </div>
                  </div>

                  {/* Action: Update Profile Info */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <Link
                      to={isCitizen ? '/citizen/account' : '/settings'}
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t('accountProfile')}</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
