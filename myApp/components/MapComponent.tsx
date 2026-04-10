import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Report } from '@/services/dataService';
import { useLanguage } from '@/context/LanguageContext';

interface MapComponentProps {
  reports: Report[];
  location: any;
  initialRegion: any;
  onMarkerPress?: (report: Report) => void;
  getMarkerColor: (type: string) => string;
}

export default function MapComponent({ 
  reports, 
  initialRegion, 
  getMarkerColor 
}: MapComponentProps) {
  const { t } = useLanguage();
  return (
    <MapView
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton
    >
      {reports.map((report) => (
        <Marker
          key={report.id}
          coordinate={{
            latitude: report.coordinates.lat,
            longitude: report.coordinates.lng,
          }}
          pinColor={getMarkerColor(report.type)}
        >
          <Callout>
            <View className="p-2 w-48">
              <Text className="font-bold text-gray-900">{report.title}</Text>
              <Text className="text-xs text-gray-500 mt-1">{report.ward}</Text>
              <View className="flex-row items-center mt-2">
                <View className="bg-emerald-100 px-2 py-0.5 rounded">
                  <Text className="text-[10px] text-emerald-700 font-bold uppercase">
                    {report.status === 'resolved' ? t.statusResolved : t.statusPending}
                  </Text>
                </View>
              </View>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
