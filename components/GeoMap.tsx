import React, { useEffect, useRef, useState } from 'react';
import { Notary } from '../types';
import { AlertCircle, MapPinOff, Locate } from 'lucide-react';

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
  const clusterGroup = useRef<any>(null);
  const [unmappedCount, setUnmappedCount] = useState(0);

  // Filter notaries with valid coordinates vs invalid
  const mappedNotaries = notaries.filter(n => n.latitude && n.longitude && n.latitude !== 0 && n.longitude !== 0);
  const unmappedNotaries = notaries.filter(n => !n.latitude || !n.longitude || n.latitude === 0 || n.longitude === 0);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // 1. Initialize Map (only once)
    if (!mapInstance.current) {
      // Center of Pará
      mapInstance.current = window.L.map(mapRef.current).setView([-3.5, -52.0], 6);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstance.current);
    }

    const L = window.L;
    const map = mapInstance.current;

    // 2. Initialize or Clear Cluster Group
    if (clusterGroup.current) {
      clusterGroup.current.clearLayers();
      map.removeLayer(clusterGroup.current);
    }
    
    // Create new cluster group (requires leaflet.markercluster.js loaded in index.html)
    if (L.markerClusterGroup) {
      clusterGroup.current = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
      });
    } else {
      // Fallback if plugin fails to load
      clusterGroup.current = L.layerGroup();
    }

    // 3. Define Icons
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

    // 4. Add Markers to Cluster
    mappedNotaries.forEach((notary) => {
      if (notary.latitude && notary.longitude) {
        const marker = L.marker([notary.latitude, notary.longitude], { 
          icon: notary.status === 'ATIVO' ? activeIcon : inactiveIcon 
        });

        marker.bindPopup(`
          <div class="p-1 min-w-[200px]">
            <h4 class="font-bold text-sm text-slate-800 mb-1">${notary.name}</h4>
            <div class="text-xs text-slate-600 space-y-1">
              <p><strong>Comarca:</strong> ${notary.comarca}</p>
              <p><strong>Resp:</strong> ${notary.responsibleName}</p>
              <p><strong>Endereço:</strong> ${notary.city} - ${notary.state}</p>
              <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                 <span class="font-semibold ${notary.status === 'ATIVO' ? 'text-green-600' : 'text-red-600'}">${notary.status}</span>
                 <span class="text-[10px] text-slate-400">CNS: ${notary.ensCode || 'N/A'}</span>
              </div>
            </div>
          </div>
        `);

        clusterGroup.current.addLayer(marker);
      }
    });

    // Add Cluster to Map
    map.addLayer(clusterGroup.current);
    
    // Fit bounds if we have points
    if (mappedNotaries.length > 0) {
       // Optional: fit bounds to show all markers
       // map.fitBounds(clusterGroup.current.getBounds(), { padding: [50, 50] });
    }

    setUnmappedCount(unmappedNotaries.length);

    // Cleanup not strictly necessary for simple refs, but good practice
    return () => {};
  }, [notaries]); // Re-run when notaries list changes

  return (
    <div className="flex h-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
      
      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <div ref={mapRef} className="w-full h-full bg-slate-100" />
        
        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md z-[400] text-xs border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Legenda</h4>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span>Ativo/Regular</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span>Pendente/Inativo</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
               Agrupamento ativado
            </div>
        </div>
      </div>

      {/* Sidebar: Unmapped Notaries */}
      <div className="w-64 bg-white border-l border-slate-200 flex flex-col z-10">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
           <h4 className="font-bold text-slate-800 flex items-center gap-2">
             <MapPinOff size={16} className="text-orange-500" />
             Não Mapeados
           </h4>
           <p className="text-xs text-slate-500 mt-1">
             {unmappedCount} cartórios sem coordenadas geográficas cadastradas.
           </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {unmappedNotaries.length > 0 ? (
            <div className="space-y-2">
               {unmappedNotaries.map(notary => (
                 <div key={notary.id} className="p-3 bg-white border border-slate-100 rounded-md hover:border-blue-200 hover:shadow-sm transition group">
                    <p className="text-xs font-semibold text-slate-700 truncate" title={notary.name}>{notary.name}</p>
                    <p className="text-[10px] text-slate-500 flex justify-between mt-1">
                      <span>{notary.comarca}</span>
                      <span className="text-orange-400 group-hover:text-orange-600 flex items-center gap-1">
                        <AlertCircle size={10} /> Pendente
                      </span>
                    </p>
                 </div>
               ))}
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
               <Locate size={32} className="mb-2 text-green-500 opacity-50" />
               <p className="text-sm font-medium text-green-700">Tudo Certo!</p>
               <p className="text-xs">Todos os cartórios possuem coordenadas.</p>
             </div>
          )}
        </div>
        
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-400 text-center">
          Atualize o cadastro para exibir no mapa.
        </div>
      </div>
    </div>
  );
};

export default GeoMap;