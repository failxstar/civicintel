import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Report } from '@/services/dataService';

interface MapComponentProps {
  reports: Report[];
  location: any;
  initialRegion: any;
  onMarkerPress?: (report: Report) => void;
  getMarkerColor: (type: string) => string;
}

export default function MapComponent({ reports, location, initialRegion, getMarkerColor }: MapComponentProps) {
  
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; background: #f9fafb; font-family: system-ui, -apple-system, sans-serif; }
        html, body, #map { height: 100%; width: 100vw; }
        .custom-popup .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        
        .user-location-marker {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-location-dot {
          width: 16px;
          height: 16px;
          background-color: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${initialRegion?.latitude || 10.728}, ${initialRegion?.longitude || 78.559}], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '&copy; CivicIntel'
        }).addTo(map);

        var reports = ${JSON.stringify(reports || [])};
        
        reports.forEach(function(report) {
           var color = report.type === 'garbage' ? '#10b981' : 
                       report.type === 'road' ? '#3b82f6' : 
                       report.type === 'water' ? '#06b6d4' : '#f59e0b';
           
           var circle = L.circleMarker([report.coordinates.lat, report.coordinates.lng], {
              color: '#ffffff',
              weight: 2,
              fillColor: color,
              fillOpacity: 0.9,
              radius: 8
           }).addTo(map);
           
           var html = "<div style='padding:4px; min-width:120px;'>" +
                      "<b style='color:#111827; font-size:14px;'>" + report.title + "</b><br>" +
                      "<span style='color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:800;'>" + report.ward + "</span>" +
                      "</div>";

           circle.bindPopup(html, { className: 'custom-popup' });
        });

        var userLocation = ${location ? JSON.stringify(location.coords) : 'null'};
        if (userLocation) {
           var userIcon = L.divIcon({
              className: 'user-location-marker',
              html: "<div class='user-location-dot'></div>",
              iconSize: [22, 22],
              iconAnchor: [11, 11]
           });
           
           var userMarker = L.marker([userLocation.latitude, userLocation.longitude], { 
              icon: userIcon,
              zIndexOffset: 1000 
           }).addTo(map);
           
           userMarker.bindPopup("<div style='padding:4px;'><b style='color:#3b82f6; font-size:14px;'>You are here</b></div>", { className: 'custom-popup' });
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <iframe 
        style={styles.iframe as any}
        srcDoc={mapHtml}
        frameBorder="0"
        scrolling="no"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#f9fafb',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  }
});
