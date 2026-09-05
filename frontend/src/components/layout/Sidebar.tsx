import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  LayoutDashboard, 
  Files, 
  CheckSquare, 
  FolderCheck, 
  MapPin, 
  BarChart3, 
  History, 
  Settings,
  UploadCloud,
  FileCheck,
  ShieldAlert
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const role = currentUser?.role || 'verification_officer';

  // Role-aware navigation links matching authority hierarchy
  const navItems = [
    {
      label: t('dashboard'),
      path: role === 'citizen' ? '/citizen-dashboard' : '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'state_officer', 'district_officer', 'tehsil_officer', 'tehsildar', 'talathi', 'verification_officer', 'survey_officer', 'citizen'],
    },
    {
      label: t('uploadDocument'),
      path: '/documents/upload',
      icon: UploadCloud,
      roles: ['admin', 'state_officer', 'district_officer', 'tehsil_officer', 'tehsildar', 'talathi', 'verification_officer', 'survey_officer', 'citizen'],
    },
    {
      label: t('mySubmissions') || 'My Submissions & Grievances',
      path: '/citizen/requests',
      icon: FileCheck,
      roles: ['citizen'],
      badge: t('1 Action'),
    },
    {
      label: t('mutationStatus') || 'Mutation & Process Status',
      path: '/citizen/mutations',
      icon: FolderCheck,
      roles: ['citizen'],
      badge: t('1 Active'),
    },
    {
      label: t('documents'),
      path: '/documents',
      icon: Files,
      roles: ['admin', 'state_officer', 'district_officer', 'tehsil_officer', 'tehsildar', 'talathi', 'verification_officer', 'survey_officer'],
    },
    {
      label: t('verificationQueue'),
      path: '/verification',
      icon: CheckSquare,
      roles: ['admin', 'state_officer', 'district_officer', 'tehsil_officer', 'tehsildar', 'verification_officer'],
      badge: t('2 Pending'),
    },
    {
      label: t('records'),
      path: '/records',
      icon: FolderCheck,
      roles: ['admin', 'state_officer', 'district_officer', 'tehsil_officer', 'tehsildar', 'talathi', 'verification_officer', 'survey_officer'],
    },
    {
      label: t('gisMap'),
      path: '/map',
      icon: MapPin,
      roles: ['admin', 'state_officer', 'district_officer', 'tehsil_officer', 'tehsildar', 'talathi', 'verification_officer', 'survey_officer', 'citizen'],
    },
    {
      label: t('accountProfile') || 'Account & Profile',
      path: '/citizen/account',
      icon: Settings,
      roles: ['citizen'],
    },
    {
      label: t('analytics'),
      path: '/analytics',
      icon: BarChart3,
      roles: ['admin', 'state_officer', 'district_officer', 'tehsil_officer', 'tehsildar'],
    },
    {
      label: t('auditTrail'),
      path: '/audit',
      icon: History,
      roles: ['admin', 'state_officer', 'district_officer', 'tehsildar'],
    },
    {
      label: t('settings'),
      path: '/settings',
      icon: Settings,
      roles: ['admin', 'state_officer', 'district_officer', 'tehsildar', 'verification_officer'],
    },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 space-y-1 flex-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400/80">
          {role === 'citizen' ? t('Citizen Services') : t('Revenue Administration')}
        </div>

        {filteredItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 text-emerald-400" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800 text-xs">
        <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center space-x-2 text-slate-200 font-semibold mb-1">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold">{t('Government Governance')}</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            {t('Independent rule validation & zero unverified AI authority strictly enforced.')}
          </p>
        </div>
      </div>
    </aside>
  );
};
