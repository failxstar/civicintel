import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface ReportMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChangeComplete: (region: any) => void;
}

export default function ReportMap({ region, onRegionChangeComplete }: ReportMapProps) {
  // Generate Leaflet HTML with initial region
  const leafletHTML = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
            .leaflet-control-attribution { display: none !important; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map', {
              zoomControl: false,
              center: [${region.latitude}, ${region.longitude}],
              zoom: 15
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
            }).addTo(map);

            var marker = L.marker([${region.latitude}, ${region.longitude}]).addTo(map);

            // Notify React Native when the map stops moving
            map.on('moveend', function() {
              var center = map.getCenter();
              var zoom = map.getZoom();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                latitude: center.lat,
                longitude: center.lng,
                zoom: zoom
              }));
            });

            // Update marker when map moves
            map.on('move', function() {
              var center = map.getCenter();
              marker.setLatLng(center);
            });
          </script>
        </body>
      </html>
    `;
  }, [region.latitude, region.longitude]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      // Construct a region object similar to react-native-maps
      // We approximate deltas based on zoom if needed, but for reporting,
      // the lat/lng are the most critical parts.
      onRegionChangeComplete({
        ...region,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    } catch (e) {
      console.error("Error parsing message from map:", e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: leafletHTML }}
        onMessage={handleMessage}
        scrollEnabled={false}
        style={styles.map}
      />
      {/* Optional: Add an overlay indicator to show it's interactive if needed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },
  map: {
    flex: 1,
  },
});
