import React, { useEffect, useRef } from 'react';
import { Notary } from '../types';

// Declare Leaflet Types globally since we are loading via CDN
declare global {
  interface Window {
    L: any;
  }
}

interface GeoMapProps {
  notaries: Notary[];
}

const GeoMap: React.FC<GeoMapProps> = ({ notaries }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Initialize Map if not already initialized
    if (!mapInstance.current) {
      // Coordinates for center of Pará
      mapInstance.current = window.L.map(mapRef.current).setView([-3.5, -52.0], 6);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstance.current);
    }

    // Add Markers
    const L = window.L;
    
    // Clear existing markers
    mapInstance.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
            mapInstance.current.removeLayer(layer);
        }
    });

    const activeIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const inactiveIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

    notaries.forEach((notary) => {
      // Default coords if missing (center of PA approximately for demo purposes if no data)
      const lat = notary.latitude || -1.4557 + (Math.random() * 2 - 1); 
      const lng = notary.longitude || -48.4902 + (Math.random() * 2 - 1);

      if (lat && lng) {
        L.marker([lat, lng], { icon: notary.status === 'ATIVO' ? activeIcon : inactiveIcon })
          .addTo(mapInstance.current)
          .bindPopup(`
            <div class="p-1">
              <strong class="text-sm text-slate-800">${notary.name}</strong><br/>
              <span class="text-xs text-slate-500">${notary.comarca}</span><br/>
              <span class="text-xs font-semibold ${notary.status === 'ATIVO' ? 'text-green-600' : 'text-red-600'}">${notary.status}</span>
            </div>
          `);
      }
    });

    // Cleanup
    return () => {
      // We don't destroy the map on re-renders to prevent flickering, just update markers
    };
  }, [notaries]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm border border-slate-200 z-0">
      <div ref={mapRef} className="w-full h-full bg-slate-100" />
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md z-[400] text-xs">
          <h4 className="font-bold text-slate-800 mb-2">Legenda</h4>
          <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>Ativo/Regular</span>
          </div>
          <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>Pendente/Inativo</span>
          </div>
      </div>
    </div>
  );
};

export default GeoMap;