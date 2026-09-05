import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getStates, getDistricts, getTalukas, getVillages } from '../../services/locationData';
import { MapPin, Lock } from 'lucide-react';

export interface LocationFilterState {
  country: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
}

interface LocationSelectorProps {
  value: LocationFilterState;
  onChange: (newValue: LocationFilterState) => void;
  showLabels?: boolean;
  compact?: boolean;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  showLabels = true,
  compact = false,
  className = ''
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const role = currentUser?.role;

  // Determine authorized scope locks based on role hierarchy
  // State Officer: locked to their state
  // District Officer: locked to state & district
  // Tehsildar / Tehsil Officer: locked to state, district & taluka
  // Talathi: locked to state, district, taluka & village
  const isStateOfficer = role === 'state_officer';
  const isDistrictOfficer = role === 'district_officer';
  const isTehsildar = role === 'tehsildar' || role === 'tehsil_officer';
  const isTalathi = role === 'talathi';

  const isStateLocked = isStateOfficer || isDistrictOfficer || isTehsildar || isTalathi;
  const isDistrictLocked = isDistrictOfficer || isTehsildar || isTalathi;
  const isTalukaLocked = isTehsildar || isTalathi;
  const isVillageLocked = isTalathi;

  // Available options derived hierarchically
  const states = getStates();
  const districts = getDistricts(value.state);
  const talukas = getTalukas(value.state, value.district);
  const villages = getVillages(value.state, value.district, value.taluka);

  // Sync with user's initial scope on mount if specified
  useEffect(() => {
    if (currentUser?.scope) {
      const scope = currentUser.scope;
      onChange({
        country: 'India',
        state: scope.state || value.state || 'Maharashtra',
        district: scope.district || value.district || 'Pune',
        taluka: (scope.taluka || scope.tehsil) || (isTehsildar || isTalathi ? 'Haveli' : value.taluka || 'ALL'),
        village: scope.village || (isTalathi ? 'Wagholi' : value.village || 'ALL'),
      });
    }
  }, [currentUser?.role]);

  const handleStateChange = (state: string) => {
    const newDistricts = getDistricts(state);
    const defaultDistrict = newDistricts[0] || '';
    const newTalukas = getTalukas(state, defaultDistrict);
    onChange({
      country: 'India',
      state,
      district: defaultDistrict,
      taluka: 'ALL',
      village: 'ALL',
    });
  };

  const handleDistrictChange = (district: string) => {
    onChange({
      ...value,
      district,
      taluka: 'ALL',
      village: 'ALL',
    });
  };

  const handleTalukaChange = (taluka: string) => {
    onChange({
      ...value,
      taluka,
      village: 'ALL',
    });
  };

  const handleVillageChange = (village: string) => {
    onChange({
      ...value,
      village,
    });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {/* Country - Fixed to India */}
      <div className="flex flex-col">
        {showLabels && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Country</span>}
        <div className="flex items-center px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600">
          <Lock className="w-3 h-3 mr-1 text-slate-400" />
          <span>India</span>
        </div>
      </div>

      {/* State Selector */}
      <div className="flex flex-col">
        {showLabels && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('state')}</span>}
        <div className="relative">
          <select
            disabled={isStateLocked}
            value={value.state}
            onChange={(e) => handleStateChange(e.target.value)}
            className={`text-xs font-semibold rounded-lg border px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors ${
              isStateLocked
                ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed'
                : 'bg-white text-slate-900 border-slate-300 hover:border-emerald-500 cursor-pointer'
            }`}
          >
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {isStateLocked && <Lock className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />}
        </div>
      </div>

      {/* District Selector */}
      <div className="flex flex-col">
        {showLabels && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('district')}</span>}
        <div className="relative">
          <select
            disabled={isDistrictLocked}
            value={value.district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className={`text-xs font-semibold rounded-lg border px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors ${
              isDistrictLocked
                ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed'
                : 'bg-white text-slate-900 border-slate-300 hover:border-emerald-500 cursor-pointer'
            }`}
          >
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {isDistrictLocked && <Lock className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />}
        </div>
      </div>

      {/* Taluka / Tehsil Selector */}
      <div className="flex flex-col">
        {showLabels && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('taluka')}</span>}
        <div className="relative">
          <select
            disabled={isTalukaLocked}
            value={value.taluka}
            onChange={(e) => handleTalukaChange(e.target.value)}
            className={`text-xs font-semibold rounded-lg border px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors ${
              isTalukaLocked
                ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed'
                : 'bg-white text-slate-900 border-slate-300 hover:border-emerald-500 cursor-pointer'
            }`}
          >
            {!isTalukaLocked && <option value="ALL">{t('allTalukas')}</option>}
            {talukas.map((tName) => (
              <option key={tName} value={tName}>{tName}</option>
            ))}
          </select>
          {isTalukaLocked && <Lock className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />}
        </div>
      </div>

      {/* Village Selector */}
      <div className="flex flex-col">
        {showLabels && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('village')}</span>}
        <div className="relative">
          <select
            disabled={isVillageLocked}
            value={value.village}
            onChange={(e) => handleVillageChange(e.target.value)}
            className={`text-xs font-semibold rounded-lg border px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors ${
              isVillageLocked
                ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed'
                : 'bg-white text-slate-900 border-slate-300 hover:border-emerald-500 cursor-pointer'
            }`}
          >
            {!isVillageLocked && <option value="ALL">{t('allVillages')}</option>}
            {villages.map((vName) => (
              <option key={vName} value={vName}>{vName}</option>
            ))}
          </select>
          {isVillageLocked && <Lock className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />}
        </div>
      </div>
    </div>
  );
};
