import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CadastralParcel, GisLocation } from '../types';
import { MOCK_CADASTRAL_PARCELS, getParcelsForUser } from '../services/cadastralPolygons';
import { mockApi } from '../services/mockApi';
import { LocationSelector, LocationFilterState } from '../components/ui/LocationSelector';
import { 
  MapPin, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Eye
} from 'lucide-react';
import L from 'leaflet';
import { PageHeader } from '../components/ui/PageHeader';

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
      const color = status === 'APPROVED' ? '#166534' : '#A16207';
      const size = isSelected ? 30 : 24;
      return L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${isSelected ? '12px' : '10px'};
            font-weight: bold;
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
        color: isSelected ? '#166534' : isApproved ? '#15803D' : '#A16207',
        weight: isSelected ? 3 : 2,
        fillColor: isApproved ? '#166534' : '#A16207',
        fillOpacity: isSelected ? 0.35 : 0.15,
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
          <div style="font-weight: bold; font-size: 13px; color: #0F172A;">Survey ${parcel.surveyNumber}</div>
          <div style="font-size: 11px; color: #166534; font-weight: 700; margin-bottom: 2px;">${parcel.village}, ${parcel.taluka}</div>
          <div style="font-size: 11px; color: #334155; font-weight: bold; margin-top: 4px;">Area: ${parcel.area}</div>
          <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <a href="/records/${parcel.recordId}" style="display: block; text-align: center; background: #166534; color: white; padding: 5px 8px; border-radius: 6px; font-size: 11px; text-decoration: none; font-weight: bold;">
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
          <div style="font-weight: bold; font-size: 13px; color: #0F172A;">Survey ${loc.surveyNumber}</div>
          <div style="font-size: 11px; color: #166534; font-weight: 700; margin-bottom: 2px;">${loc.village}, ${loc.tehsil}</div>
          <div style="font-size: 11px; color: #334155; font-weight: bold; margin-top: 4px;">Area: ${loc.area}</div>
          <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <a href="/records/${loc.recordId}" style="display: block; text-align: center; background: #166534; color: white; padding: 5px 8px; border-radius: 6px; font-size: 11px; text-decoration: none; font-weight: bold;">
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

  const renderBadge = (status: string) => {
    if (status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
          Certified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[#0F172A]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
        Review required
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title={isCitizen ? t('My GIS Land Parcel') : t('gisMap')}
        description="View your registered parcels and their administrative boundaries."
        actions={
          <div className="flex items-center space-x-3 text-xs bg-white border border-[#CBD5E1] px-3 py-1.5 rounded-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] inline-block" />
              <span className="font-semibold text-slate-700">{t('Certified Parcel')}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] inline-block" />
              <span className="font-semibold text-slate-700">{t('Under Verification')}</span>
            </span>
          </div>
        }
      />

      {/* Officer Cascading Location Filter */}
      {!isCitizen && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center space-x-2 mb-2 text-xs font-semibold text-slate-700">
            <Filter className="w-4 h-4 text-[#475569]" />
            <span>Spatial filter</span>
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
        <div className="lg:col-span-4 bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-[#E2E8F0] space-y-2.5 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-[#475569] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by survey #, village, owner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-[6px] focus:outline-hidden focus:ring-2 focus:ring-[#166534] focus:border-[#166534]"
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span className="tabular-nums">{visibleParcels.length} {visibleParcels.length === 1 ? 'parcel' : 'parcels'}</span>
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
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#166534] bg-white shadow-xs'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAF8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">
                        Survey {parcel.surveyNumber}
                      </span>
                      {renderBadge(parcel.status)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {parcel.village}, {parcel.taluka} Taluka • <strong className="text-slate-700">{parcel.area}</strong>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end text-[10px]">
                      <Link
                        to={`/records/${parcel.recordId}`}
                        onClick={e => e.stopPropagation()}
                        className="text-[#166534] hover:text-[#14532D] font-semibold flex items-center space-x-0.5"
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
        <div className="lg:col-span-8 bg-slate-100 rounded-[8px] border border-slate-300 shadow-inner overflow-hidden relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Selected Parcel Floating Info Card on Map */}
          {selectedParcel && (
            <div className="absolute bottom-12 left-4 right-4 z-20 bg-white/95 backdrop-blur-xs p-4 rounded-[8px] border border-slate-200 shadow-md text-xs space-y-2 animate-fadeIn max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Survey {selectedParcel.surveyNumber}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {selectedParcel.village}, {selectedParcel.taluka}
                  </span>
                </div>
                {renderBadge(selectedParcel.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-[6px] border border-slate-200">
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

              <div className="flex items-center justify-end pt-1">
                <Link
                  to={`/records/${selectedParcel.recordId}`}
                  className="px-3 py-1.5 bg-[#166534] hover:bg-[#14532D] text-white rounded-[6px] font-bold text-xs flex items-center space-x-1 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Digital Record</span>
                </Link>
              </div>
            </div>
          )}

          {/* Cadastral Representative Geometry Disclaimer Label */}
          <div className="absolute bottom-2 left-3 z-20 text-[11px] text-slate-500 bg-white/90 border border-slate-200 px-2.5 py-1 rounded-[6px] shadow-xs pointer-events-none">
            Boundary shown is representative and not a legal survey document.
          </div>
        </div>
      </div>
    </div>
  );
};
