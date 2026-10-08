import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Check, Loader2, Compass } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationService } from '../../services/locationService';

// Custom SVG Pin Icon for Leaflet to ensure zero asset path/bundler issues
const customPinIcon = L.divIcon({
  className: 'agri-map-pin',
  html: `
    <div style="
      background-color: #059669;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
      border: 2px solid white;
    ">
      <svg style="transform: rotate(45deg); width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

export function MapPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialLat = null,
  initialLng = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [selectedCoords, setSelectedCoords] = useState({
    lat: initialLat || 20.5937,
    lng: initialLng || 78.9629,
  });
  const [addressPreview, setAddressPreview] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Initialize or center map when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const startLat = initialLat !== null && !isNaN(Number(initialLat)) ? Number(initialLat) : 20.5937;
    const startLng = initialLng !== null && !isNaN(Number(initialLng)) ? Number(initialLng) : 78.9629;
    const zoomLevel = initialLat ? 13 : 5;

    setSelectedCoords({ lat: startLat, lng: startLng });

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        // Create new Leaflet map instance
        const map = L.map(mapContainerRef.current, {
          center: [startLat, startLng],
          zoom: zoomLevel,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // Create draggable marker
        const marker = L.marker([startLat, startLng], {
          icon: customPinIcon,
          draggable: true,
        }).addTo(map);

        markerRef.current = marker;

        // On marker drag end
        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          setSelectedCoords({ lat: pos.lat, lng: pos.lng });
          await updatePreview(pos.lat, pos.lng);
        });

        // On map click, move marker
        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setSelectedCoords({ lat, lng });
          await updatePreview(lat, lng);
        });

        mapInstanceRef.current = map;
      } else {
        const map = mapInstanceRef.current;
        map.invalidateSize();
        map.setView([startLat, startLng], zoomLevel);
        if (markerRef.current) {
          markerRef.current.setLatLng([startLat, startLng]);
        }
      }

      // Initial reverse geocode lookup
      updatePreview(startLat, startLng);
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, initialLat, initialLng]);

  // Clean up Leaflet on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const updatePreview = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const geo = await locationService.reverseGeocode(lat, lng);
      if (geo && geo.formattedAddress) {
        setAddressPreview(geo.formattedAddress);
      } else {
        setAddressPreview(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch {
      setAddressPreview(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleConfirm = async () => {
    setIsGeocoding(true);
    try {
      const geo = await locationService.reverseGeocode(selectedCoords.lat, selectedCoords.lng);
      onConfirm({
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        location: geo?.location || '',
        district: geo?.district || '',
        state: geo?.state || '',
        formattedAddress: geo?.formattedAddress || addressPreview,
      });
      onClose();
    } catch (err) {
      onConfirm({
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        location: '',
        district: '',
        state: '',
        formattedAddress: addressPreview,
      });
      onClose();
    } finally {
      setIsGeocoding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full h-[85vh] sm:h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pin Your Farm or Mandi Location</h3>
              <p className="text-xs text-slate-500">
                Click anywhere on the map or drag the green pin to select your exact location
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Close Map"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative w-full h-full bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Floating Address Bar on Top of Map */}
          <div className="absolute top-3 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-20 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-slate-200/80 pointer-events-auto">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Selected Location
                  </p>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 mt-0.5">
                    {isGeocoding ? 'Detecting address details...' : addressPreview || 'Move pin to locate'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Coordinates stored securely for buyer proximity matching</span>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isGeocoding}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {isGeocoding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Location</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPickerModal;
