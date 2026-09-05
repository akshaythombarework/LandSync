import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CadastralParcel, GisLocation } from '../types';
import { MOCK_CADASTRAL_PARCELS, getParcelsForUser } from '../services/cadastralPolygons';
import { mockApi } from '../services/mockApi';
import { LocationSelector, LocationFilterState } from '../components/ui/LocationSelector';
import { StatusBadge } from '../components/ui/Badge';
import { 
  MapPin, 
  Search, 
  Filter, 
  Layers, 
  Navigation, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Eye
} from 'lucide-react';
import L from 'leaflet';

export const GisMapPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const isCitizen = currentUser?.role === 'citizen';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polygonsRef = useRef<L.Polygon[]>([]);

  const [selectedParcel, setSelectedParcel] = useState<CadastralParcel | null>(null);
  const [liveLocations, setLiveLocations] = useState<GisLocation[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLiveGis = async () => {
      try {
        const locations = await mockApi.getGisLocations();
        setLiveLocations(locations);
      } catch (err) {
        console.warn('Failed to load live GIS locations:', err);
      }
    };
    fetchLiveGis();
  }, []);

  // Geographic filter for officers
  const [locationFilter, setLocationFilter] = useState<LocationFilterState>({
    country: 'India',
    state: currentUser?.scope?.state || 'Maharashtra',
    district: currentUser?.scope?.district || 'Pune',
    taluka: (currentUser?.scope?.taluka || currentUser?.scope?.tehsil) || (currentUser?.role === 'tehsildar' ? 'Haveli' : 'ALL'),
    village: currentUser?.scope?.village || (currentUser?.role === 'talathi' ? 'Wagholi' : 'ALL'),
  });

  // Fetch authorized parcels
  const authorizedParcels = getParcelsForUser(
    isCitizen, 
    currentUser?.name, 
    isCitizen ? undefined : {
      state: locationFilter.state,
      district: locationFilter.district,
      taluka: locationFilter.taluka,
      village: locationFilter.village
    }
  );

  // Search filter
  const visibleParcels = authorizedParcels.filter(p => {
    const match = p.ownerName.toLowerCase().includes(search.toLowerCase()) ||
                  p.surveyNumber.toLowerCase().includes(search.toLowerCase()) ||
                  p.village.toLowerCase().includes(search.toLowerCase());
    return match;
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered around Pune district (or citizen's parcel)
      const centerCoords: [number, number] = isCitizen && visibleParcels[0] 
        ? visibleParcels[0].center 
        : [18.5204, 73.8567];

      const zoomLevel = isCitizen ? 14 : 11;
      const map = L.map(mapContainerRef.current).setView(centerCoords, zoomLevel);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers & polygons
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    polygonsRef.current.forEach(p => p.remove());
    polygonsRef.current = [];

    // Custom marker icon factory
    const createCustomIcon = (status: string, isSelected: boolean) => {
      const color = status === 'APPROVED' ? '#059669' : '#d97706';
      const size = isSelected ? 34 : 28;
      return L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${isSelected ? '14px' : '11px'};
            font-weight: bold;
            transition: all 0.2s ease;
          ">
            📍
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
      });
    };

    // Render Polygons and Center Markers
    visibleParcels.forEach(parcel => {
      const isSelected = selectedParcel?.recordId === parcel.recordId;
      const isApproved = parcel.status === 'APPROVED';

      // 1. Render Cadastral Polygon Geometry
      const polygon = L.polygon(parcel.coordinates, {
        color: isSelected ? '#047857' : isApproved ? '#059669' : '#d97706',
        weight: isSelected ? 4 : 2,
        fillColor: isApproved ? '#10b981' : '#f59e0b',
        fillOpacity: isSelected ? 0.55 : 0.25,
        dashArray: isApproved ? undefined : '4, 4'
      }).addTo(map);

      polygon.on('click', () => {
        handleSelectParcel(parcel);
      });

      polygonsRef.current.push(polygon);

      // 2. Render Centroid Pin Marker
      const marker = L.marker(parcel.center, {
        icon: createCustomIcon(parcel.status, isSelected)
      }).addTo(map);

      // Popup Content
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 190px;">
          <div style="font-weight: bold; font-size: 13px; color: #064e3b;">${isCitizen ? 'My Land Parcel' : parcel.ownerName}</div>
          <div style="font-size: 11px; color: #047857; font-weight: 700; margin-bottom: 2px;">Survey No: ${parcel.surveyNumber}</div>
          <div style="font-size: 11px; color: #64748b;">${parcel.village}, ${parcel.taluka} Taluka</div>
          <div style="font-size: 11px; color: #065f46; font-weight: bold; margin-top: 4px;">Area: ${parcel.area}</div>
          <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <a href="/records/${parcel.recordId}" style="display: block; text-align: center; background: #065f46; color: white; padding: 5px 8px; border-radius: 6px; font-size: 11px; text-decoration: none; font-weight: bold;">
              View Official Land Record
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        handleSelectParcel(parcel);
      });

      markersRef.current.push(marker);
    });

    // 3. Render live database GIS location markers not already represented by cadastral polygons
    const parcelRecordIds = new Set(visibleParcels.map(p => p.recordId));
    liveLocations.forEach(loc => {
      if (parcelRecordIds.has(loc.recordId) || !loc.latitude || !loc.longitude) return;
      if (isCitizen && currentUser?.name && !loc.ownerName.toLowerCase().includes(currentUser.name.toLowerCase())) return;
      if (search) {
        const query = search.toLowerCase();
        const match = loc.ownerName.toLowerCase().includes(query) ||
                      loc.surveyNumber.toLowerCase().includes(query) ||
                      loc.village.toLowerCase().includes(query);
        if (!match) return;
      }

      const liveMarker = L.marker([loc.latitude, loc.longitude], {
        icon: createCustomIcon(loc.status, false)
      }).addTo(map);

      const livePopup = document.createElement('div');
      livePopup.innerHTML = `
        <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 190px;">
          <div style="font-weight: bold; font-size: 13px; color: #064e3b;">${loc.ownerName}</div>
          <div style="font-size: 11px; color: #047857; font-weight: 700; margin-bottom: 2px;">Survey No: ${loc.surveyNumber}</div>
          <div style="font-size: 11px; color: #64748b;">${loc.village}, ${loc.tehsil}</div>
          <div style="font-size: 11px; color: #065f46; font-weight: bold; margin-top: 4px;">Area: ${loc.area}</div>
          <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <a href="/records/${loc.recordId}" style="display: block; text-align: center; background: #065f46; color: white; padding: 5px 8px; border-radius: 6px; font-size: 11px; text-decoration: none; font-weight: bold;">
              View Official Land Record
            </a>
          </div>
        </div>
      `;
      liveMarker.bindPopup(livePopup);
      markersRef.current.push(liveMarker);
    });

  }, [visibleParcels.length, selectedParcel?.recordId, isCitizen, liveLocations.length, search]);

  const handleSelectParcel = (parcel: CadastralParcel) => {
    setSelectedParcel(parcel);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(parcel.center, 15, { duration: 1.2 });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-emerald-800" />
            <span>{isCitizen ? t('My Certified GIS Land Parcel') : t('gisMap')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isCitizen
              ? t('Privacy-protected spatial view displaying only your verified cadastral boundaries.')
              : t('Interactive cadastral parcel visualization and boundary verification layer across authorized jurisdiction.')}
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            <span className="font-semibold text-slate-700">{t('Certified Parcel')}</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="font-semibold text-slate-700">{t('Under Verification')}</span>
          </span>
        </div>
      </div>

      {/* Officer Cascading Location Filter */}
      {!isCitizen && (
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center space-x-2 mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t('Authorized Officer Spatial Filter')}</span>
          </div>
          <LocationSelector
            value={locationFilter}
            onChange={setLocationFilter}
            showLabels={false}
          />
        </div>
      )}

      {/* Main Map Workspace Layout (Directory Sidebar + Leaflet Canvas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[640px]">
        {/* Left Side: Parcel Directory Filter (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-slate-50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by survey #, village, owner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>{visibleParcels.length} Parcels Displayed</span>
              <span className="font-semibold text-emerald-800">Click parcel to highlight polygon</span>
            </div>
          </div>

          {/* List of Mapped Parcels */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
            {visibleParcels.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No parcels match the current geographic filter.
              </div>
            ) : (
              visibleParcels.map(parcel => {
                const isSelected = selectedParcel?.recordId === parcel.recordId;
                return (
                  <div
                    key={parcel.recordId}
                    onClick={() => handleSelectParcel(parcel)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/80 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">
                        {isCitizen ? 'My Land Parcel' : parcel.ownerName}
                      </span>
                      <StatusBadge status={parcel.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-emerald-800 font-bold">
                      Survey No: {parcel.surveyNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {parcel.village}, {parcel.taluka} Taluka • <strong className="text-slate-700">{parcel.area}</strong>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">
                        Centroid: {parcel.center[0].toFixed(4)}, {parcel.center[1].toFixed(4)}
                      </span>
                      <Link
                        to={`/records/${parcel.recordId}`}
                        onClick={e => e.stopPropagation()}
                        className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center space-x-0.5"
                      >
                        <span>View Record</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Leaflet Interactive Map Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-100 rounded-xl border border-slate-300 shadow-inner overflow-hidden relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map Top Status Badge */}
          <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 shadow-sm flex items-center space-x-1.5 pointer-events-none">
            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cadastral Spatial Layer ({isCitizen ? 'Citizen Ward' : locationFilter.district})</span>
          </div>

          {/* Selected Parcel Floating Info Card on Map */}
          {selectedParcel && (
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-xs p-4 rounded-xl border border-emerald-300 shadow-lg text-xs space-y-2 animate-fadeIn max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Selected Parcel Geometry
                  </span>
                  <h3 className="font-black text-sm text-slate-900">
                    {isCitizen ? 'My Land Parcel' : selectedParcel.ownerName}
                  </h3>
                </div>
                <StatusBadge status={selectedParcel.status} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Survey Number</span>
                  <span className="font-bold text-slate-800">{selectedParcel.surveyNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Plot Area</span>
                  <span className="font-bold text-slate-800">{selectedParcel.area}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Location</span>
                  <span className="font-semibold text-slate-700">{selectedParcel.village}, {selectedParcel.taluka}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Record ID</span>
                  <span className="font-mono font-semibold text-slate-700">{selectedParcel.displayId}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">Polygon perimeter highlighted</span>
                <Link
                  to={`/records/${selectedParcel.recordId}`}
                  className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded font-bold text-xs flex items-center space-x-1 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Digital Record</span>
                </Link>
              </div>
            </div>
          )}

          {/* Cadastral Representative Geometry Disclaimer Banner */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 backdrop-blur-xs text-slate-200 px-3 py-1 rounded-full text-[10px] shadow-sm pointer-events-none hidden sm:block">
            Notice: Representative Cadastral Geometry (Integration-Ready Boundary Layer)
          </div>
        </div>
      </div>
    </div>
  );
};
