import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

interface ReportMapProps {
  region: any;
  onRegionChangeComplete: (region: any) => void;
}

export default function ReportMap({ region, onRegionChangeComplete }: ReportMapProps) {
  if (Platform.OS !== 'web') {
    return <Text>Fallback Native</Text>;
  }

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
        .center-marker {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -100%);
          z-index: 1000;
          pointer-events: none;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <svg class="center-marker" width="40" height="40" viewBox="0 0 24 24" fill="#16a34a" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="white"></circle>
      </svg>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${region?.latitude || 10.728}, ${region?.longitude || 78.559}], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '&copy; CivicIntel'
        }).addTo(map);

        map.on('moveend', function() {
           var center = map.getCenter();
           window.parent.postMessage(JSON.stringify({ 
             type: 'REGION_CHANGE', 
             latitude: center.lat, 
             longitude: center.lng 
           }), '*');
        });
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'REGION_CHANGE') {
          onRegionChangeComplete({
            latitude: data.latitude,
            longitude: data.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRegionChangeComplete]);

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
  container: { flex: 1, width: '100%', height: '100%' },
  iframe: { width: '100%', height: '100%', border: 'none' }
});
