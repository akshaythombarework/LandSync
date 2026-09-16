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
  Layers,
  UserCheck
} from 'lucide-react';

interface NavSection {
  title: string;
  items: {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: string[];
    badge?: string;
  }[];
}

export const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const role = currentUser?.role || 'verification_officer';
  const isCitizen = role === 'citizen';

  const officerRoles = [
    'admin',
    'state_officer',
    'district_officer',
    'tehsil_officer',
    'tehsildar',
    'talathi',
    'verification_officer',
    'survey_officer',
  ];

  const sections: NavSection[] = isCitizen
    ? [
        {
          title: t('Overview'),
          items: [
            {
              label: t('dashboard') || 'Citizen Portal',
              path: '/citizen-dashboard',
              icon: LayoutDashboard,
              roles: ['citizen'],
            },
          ],
        },
        {
          title: t('Citizen Services') || 'Land & Records Services',
          items: [
            {
              label: t('uploadDocument') || 'Submit Document',
              path: '/documents/upload',
              icon: UploadCloud,
              roles: ['citizen'],
            },
            {
              label: t('mySubmissions') || 'My Submissions',
              path: '/citizen/requests',
              icon: FileCheck,
              roles: ['citizen'],
              badge: '1',
            },
            {
              label: t('mutationStatus') || 'Mutation (e-Ferfar)',
              path: '/citizen/mutations',
              icon: FolderCheck,
              roles: ['citizen'],
              badge: '1',
            },
            {
              label: t('gisMap') || 'My Cadastral Parcel',
              path: '/map',
              icon: MapPin,
              roles: ['citizen'],
            },
          ],
        },
        {
          title: t('Account'),
          items: [
            {
              label: t('accountProfile') || 'Profile & KYC',
              path: '/citizen/account',
              icon: Settings,
              roles: ['citizen'],
            },
          ],
        },
      ]
    : [
        {
          title: t('Overview'),
          items: [
            {
              label: t('dashboard') || 'Dashboard',
              path: '/dashboard',
              icon: LayoutDashboard,
              roles: officerRoles,
            },
          ],
        },
        {
          title: t('Documents'),
          items: [
            {
              label: t('documents') || 'Document Repository',
              path: '/documents',
              icon: Files,
              roles: officerRoles,
            },
            {
              label: t('uploadDocument') || 'Upload & Ingestion',
              path: '/documents/upload',
              icon: UploadCloud,
              roles: officerRoles,
            },
          ],
        },
        {
          title: t('Verification'),
          items: [
            {
              label: t('verificationQueue') || 'Verification Queue',
              path: '/verification',
              icon: CheckSquare,
              roles: ['admin', 'state_officer', 'district_officer', 'tehsil_officer', 'tehsildar', 'verification_officer'],
              badge: '2',
            },
          ],
        },
        {
          title: t('Land Records'),
          items: [
            {
              label: t('records') || 'Records Directory',
              path: '/records',
              icon: FolderCheck,
              roles: officerRoles,
            },
            {
              label: t('gisMap') || 'Cadastral GIS Map',
              path: '/map',
              icon: MapPin,
              roles: officerRoles,
            },
          ],
        },
        {
          title: t('Monitoring'),
          items: [
            {
              label: t('analytics') || 'Analytics',
              path: '/analytics',
              icon: BarChart3,
              roles: ['admin', 'state_officer', 'district_officer', 'tehsil_officer', 'tehsildar'],
            },
            {
              label: t('auditTrail') || 'Audit Trail',
              path: '/audit',
              icon: History,
              roles: ['admin', 'state_officer', 'district_officer', 'tehsildar'],
            },
          ],
        },
        {
          title: t('Administration'),
          items: [
            {
              label: t('settings') || 'System Settings',
              path: '/settings',
              icon: Settings,
              roles: ['admin', 'state_officer', 'district_officer', 'tehsildar', 'verification_officer'],
            },
          ],
        },
      ];

  return (
    <aside className="w-60 lg:w-64 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800 select-none">
      <div className="p-3 space-y-4 flex-1 overflow-y-auto">
        {sections.map(section => {
          const visibleItems = section.items.filter(item => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-0.5">
              <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.title}
              </div>

              {visibleItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2.5 py-2 rounded-[6px] text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[rgba(22,101,52,0.08)] text-[#166534] border-l-2 border-[#166534] pl-[9px]'
                          : 'text-[#CBD5E1] hover:bg-white/5 hover:text-white border-l-2 border-transparent pl-[9px]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center space-x-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#166534]' : 'text-[#CBD5E1]'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-600/25 text-amber-300 shrink-0 ml-1.5">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer — minimal government attribution */}
      <div className="p-3 border-t border-[#16324F]">
        <p className="text-[10px] text-slate-600 leading-snug px-2.5">
          DoLR — LandSync Platform<br />
          Revenue Administration System
        </p>
      </div>
    </aside>
  );
};
