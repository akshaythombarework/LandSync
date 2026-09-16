import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Language } from '../../services/translations';
import { 
  LogOut, 
  ChevronDown, 
  MapPin, 
  CreditCard, 
  Phone, 
  Mail, 
  Edit3
} from 'lucide-react';

/* ── Survey-plot corner mark ────────────────────────────────────────
   Two perpendicular lines (L-shape) + filled square at the vertex.
   Works at 20px and 40px. Single colour via `fill` / `stroke` props.
──────────────────────────────────────────────────────────────────── */
const LandSyncMark: React.FC<{ color?: string; size?: number }> = ({
  color = '#F8FAF8',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Vertical arm */}
    <rect x="5" y="4" width="2.5" height="12" rx="0.5" fill={color} />
    {/* Horizontal arm */}
    <rect x="5" y="13.5" width="12" height="2.5" rx="0.5" fill={color} />
    {/* Corner square (survey pin) */}
    <rect x="14" y="4" width="5" height="5" rx="0.5" fill={color} />
    {/* Small corner accent */}
    <rect x="14" y="14.5" width="4.5" height="1.5" rx="0.5" fill={color} opacity="0.5" />
  </svg>
);

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isCitizen = currentUser?.role === 'citizen';

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabel =
    currentUser?.role === 'citizen'              ? 'Citizen'
    : currentUser?.role === 'state_officer'      ? 'State Officer'
    : currentUser?.role === 'district_officer'   ? 'District Officer'
    : currentUser?.role === 'tehsildar'          ? 'Tehsildar'
    : currentUser?.role === 'talathi'            ? 'Talathi'
    : currentUser?.role === 'verification_officer' ? 'Verification Officer'
    : currentUser?.role === 'survey_officer'     ? 'Survey Officer'
    : currentUser?.role === 'admin'              ? 'Administrator'
    : currentUser?.designation || 'Officer';

  const getInitials = (name?: string) => {
    if (!name) return 'RP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const wardText = `${currentUser?.scope?.state ? t(currentUser.scope.state) : t('Maharashtra')}${currentUser?.scope?.district ? ` · ${t(currentUser.scope.district)}` : ''}${currentUser?.scope?.taluka || currentUser?.scope?.tehsil ? ` · ${t(currentUser.scope.taluka || currentUser.scope.tehsil || '')}` : ''}${currentUser?.scope?.village ? ` · ${t(currentUser.scope.village)}` : ''}`;

  // Thin vertical divider between header zones
  const Divider = () => (
    <span
      className="shrink-0 self-center"
      style={{
        display: 'inline-block',
        width: 1,
        height: 20,
        background: 'rgba(255,255,255,0.08)',
      }}
      aria-hidden="true"
    />
  );

  return (
    <header
      className="bg-[#0F172A] sticky top-0 z-30"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">

          {/* ── Brand ── */}
          <Link
            to={isCitizen ? '/citizen-dashboard' : '/dashboard'}
            className="flex items-center space-x-3 cursor-pointer shrink-0"
          >
            <LandSyncMark color="#22C55E" size={26} />
            <span
              className="text-[#F8FAF8] leading-none select-none"
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
                fontSize: 21,
                letterSpacing: '0.06em',
                fontWeight: 700,
              }}
            >
              LandSync
            </span>
          </Link>

          {/* ── Right group ── */}
          <div className="flex items-center gap-4">

            {/* Ward context */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#94A3B8' }} />
              <span style={{ color: '#94A3B8' }}>Ward:</span>
              <span className="font-medium" style={{ color: '#F8FAF8' }}>{wardText}</span>
            </div>

            <Divider />

            {/* Language selector */}
            <div className="relative flex items-center text-xs">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-transparent font-medium focus:outline-none cursor-pointer pr-4 appearance-none text-xs"
                style={{ color: '#CBD5E1' }}
                aria-label={t('Select UI Language')}
              >
                <option value="en" className="bg-[#0F172A] text-slate-200">EN</option>
                <option value="hi" className="bg-[#0F172A] text-slate-200">HI</option>
                <option value="mr" className="bg-[#0F172A] text-slate-200">MR</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
            </div>

            {/* Role label — muted, no background */}
            <span className="hidden sm:inline-block text-xs font-medium" style={{ color: '#94A3B8' }}>
              {roleLabel}
            </span>

            <Divider />

            {/* User block */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1 rounded hover:bg-slate-800/60 transition cursor-pointer text-left focus:outline-none"
                aria-expanded={isProfileOpen}
                title={t('View user profile information')}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white"
                  style={{ background: '#334155' }}
                >
                  {getInitials(currentUser?.name)}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-medium leading-tight" style={{ color: '#F8FAF8' }}>
                    {currentUser?.name || 'Rajesh Bharat Patil'}
                  </p>
                  <p className="leading-tight mt-0.5 text-[11px]" style={{ color: '#94A3B8' }}>
                    {isCitizen ? 'Citizen / Landowner' : (currentUser?.designation ? t(currentUser.designation) : roleLabel)}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                  style={{ color: '#94A3B8' }}
                />
              </button>

              {/* Profile dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#E2E8F0] py-3 px-4 z-50 animate-fadeIn text-slate-800">
                  {/* User header */}
                  <div className="flex items-center space-x-3 pb-3 border-b border-[#E2E8F0]">
                    <div className="w-10 h-10 rounded-full bg-[#334155] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(currentUser?.name)}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{currentUser?.name}</h3>
                      <p className="text-[11px] text-[#475569] leading-tight mt-0.5 truncate">
                        {isCitizen ? t('Verified Citizen / Landowner') : (currentUser?.designation ? t(currentUser.designation) : roleLabel)}
                      </p>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div className="py-3 space-y-2 text-xs">
                    {currentUser?.aadhaarMasked && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#475569] shrink-0" /> Aadhaar ID
                        </span>
                        <span className="font-mono font-bold text-slate-800">{currentUser.aadhaarMasked}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#475569] shrink-0" /> Mobile
                      </span>
                      <span className="font-medium text-slate-800">{currentUser?.mobile || '+91 98220 12345'}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#475569] shrink-0" /> Email
                      </span>
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">
                        {currentUser?.email || 'officer@gov.in'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#475569] shrink-0" /> Jurisdiction
                      </span>
                      <span className="font-medium text-slate-800">
                        {t(currentUser?.scope?.village || 'Baramati')}, {t(currentUser?.scope?.district || 'Pune')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                    <Link
                      to={isCitizen ? '/citizen/account' : '/settings'}
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full py-2 px-3 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Account &amp; Profile</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-[#334155] border border-[#CBD5E1] rounded-[6px] text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition"
                    >
                      <LogOut className="w-3.5 h-3.5 text-[#475569] shrink-0" />
                      <span>Sign out</span>
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
