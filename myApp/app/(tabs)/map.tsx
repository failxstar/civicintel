import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, ScrollView, SafeAreaView, StyleSheet, Platform, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { dataService, Report } from '@/services/dataService';
import { useLanguage } from '@/context/LanguageContext';
import { MapPin, Info } from 'lucide-react-native';
import MapComponent from '@/components/MapComponent';

export default function MapScreen() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
      const data = await dataService.loadReportsFromAPI();
      setReports(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const initialRegion = {
    latitude: location?.coords.latitude || 10.728,
    longitude: location?.coords.longitude || 78.559,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const getMarkerColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'garbage': return '#10b981';
      case 'road': return '#3b82f6';
      case 'water': return '#06b6d4';
      default: return '#f59e0b';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <MapComponent
          reports={reports}
          location={location}
          initialRegion={initialRegion}
          getMarkerColor={getMarkerColor}
        />

        <View className="absolute top-12 left-4 right-4 flex-row justify-between pointer-events-none">
          <View className="bg-white/90 px-4 py-2 rounded-full shadow-lg flex-row items-center border border-gray-100">
            <MapPin size={16} color="#059669" />
            <Text className="ml-2 font-black text-gray-800 text-xs uppercase tracking-tight">{reports.length} {t.activeReports}</Text>
          </View>
          <TouchableOpacity className="bg-white/90 p-2 rounded-full shadow-lg border border-gray-100">
            <Info size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View className="absolute bottom-6 left-0 right-0">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {[
              { id: 'all', label: t.allReports },
              { id: 'road', label: t.road },
              { id: 'garbage', label: t.garbage },
              { id: 'water', label: t.water },
              { id: 'streetlight', label: t.streetlight },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setFilter(item.id)}
                className={`mr-3 px-6 py-3 rounded-2xl border ${
                  filter === item.id 
                    ? 'bg-emerald-600 border-emerald-600 shadow-lg' 
                    : 'bg-white border-gray-100 shadow-sm'
                }`}
              >
                <Text className={`text-[10px] font-black uppercase tracking-[1px] ${
                  filter === item.id ? 'text-white' : 'text-gray-500'
                }`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff',
    height: Platform.OS === 'web' ? Dimensions.get('window').height : '100%'
  }
});
