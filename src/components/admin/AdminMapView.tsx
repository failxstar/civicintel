import React, { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Report } from '../../App';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AdminMapViewProps {
  reports: Report[];
  onSelectReport: (report: Report) => void;
}

export function AdminMapView({ reports, onSelectReport }: AdminMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    // DYNAMIC: Center on first report or world view
    const centerLat = reports[0]?.coordinates?.lat || 11.1271;
    const centerLng = reports[0]?.coordinates?.lng || 78.6569;
    const zoom = reports.length > 0 ? 13 : 7;

    const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], zoom);
    mapRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current!.removeLayer(layer);
      }
    });

    // Add markers for each report
    reports.forEach((report) => {
      if (!mapRef.current) return;

      // Create custom icon based on severity
      const iconColor =
        report.severity >= 8 ? '#ef4444' : // red
          report.severity >= 5 ? '#eab308' : // yellow
            '#22c55e'; // green

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${iconColor};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-center;
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-weight: bold;
              font-size: 14px;
            ">${report.severity}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([report.coordinates.lat, report.coordinates.lng], {
        icon: customIcon,
      }).addTo(mapRef.current);

      // Add popup
      const statusColors = {
        pending: '#f97316',
        submitted: '#3b82f6',
        resolved: '#22c55e',
        acknowledged: '#8b5cf6',
      };

      const popupContent = `
        <div style="min-width: 250px;">
          <div style="margin-bottom: 8px;">
            <img src="${report.imageUrl}" alt="${report.title}" 
              style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;" />
          </div>
          <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1f2937;">
            ${report.title}
          </h3>
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
            ${report.ward} • ${report.street}
          </p>
          <div style="display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;">
            <span style="
              background-color: ${iconColor}15;
              color: ${iconColor};
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            ">Severity: ${report.severity}/10</span>
            <span style="
              background-color: ${statusColors[report.status]}15;
              color: ${statusColors[report.status]};
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            ">${report.status === 'submitted' ? 'In Progress' : report.status}</span>
          </div>
          <button
            onclick="window.selectReport('${report.id}')"
            style="
              width: 100%;
              background-color: #3b82f6;
              color: white;
              padding: 6px 12px;
              border: none;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              margin-top: 4px;
            "
          >View Details</button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup',
      });
    });

    // Set up global handler for report selection from popup
    (window as any).selectReport = (reportId: string) => {
      const report = reports.find((r) => r.id === reportId);
      if (report) {
        onSelectReport(report);
      }
    };

    // Fit bounds to show all markers
    if (reports.length > 0) {
      const bounds = L.latLngBounds(reports.map((r) => [r.coordinates.lat, r.coordinates.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [reports, onSelectReport]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-[calc(100vh-180px)]">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Reports Map View</h3>
        <p className="text-sm text-gray-500 mt-1">
          {reports.length} reports displayed •{' '}
          <span className="text-red-600">●</span> High Severity{' '}
          <span className="text-yellow-600">●</span> Medium{' '}
          <span className="text-green-600">●</span> Low
        </p>
      </div>
      <div ref={mapContainerRef} className="w-full h-[calc(100%-68px)]" />
    </div>
  );
}
