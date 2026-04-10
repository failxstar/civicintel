import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { MapPin, Navigation } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';

export default function LocationScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [locationData, setLocationData] = useState<any>(null);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
         accuracy: Location.Accuracy.Balanced,
      });

      // Reverse Geocode
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        setLocationData({
          city: addr.city || addr.town || addr.village || addr.hamlet || 'Unknown City',
          state: addr.state || 'Tamil Nadu',
          coords: `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`
        });
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('has_completed_onboarding', 'true');
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View className="bg-white p-3 rounded-full shadow-sm">
           <MapPin size={24} color="#059669" />
        </View>
        <Text style={styles.title}>CivicIntel</Text>
        <Text style={styles.subtitle}>{t.demoLabel}</Text>
      </View>

      <View style={styles.cardContainer}>
        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#059669" />
            <Text className="text-gray-500 mt-4">{t.detectingLocation}</Text>
          </View>
        ) : locationData ? (
          <View style={styles.card}>
            <View className="flex-row items-center mb-4">
              <Navigation size={18} color="#059669" />
              <Text className="text-green-800 font-bold ml-2">{t.locationDetected}</Text>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text style={styles.label}>{t.city} <Text style={styles.value}>{locationData.city}</Text></Text>
              </View>
              <View className="mt-2">
                <Text style={styles.label}>{t.state} <Text style={styles.value}>{locationData.state}</Text></Text>
              </View>
              <View className="mt-3 flex-row items-center">
                 <View className="w-2 h-2 rounded-full bg-red-400 mr-2" />
                 <Text className="text-gray-400 text-xs">{locationData.coords}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
             <Text className="text-red-500 text-center">{t.locationError}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.buttonMain}
          onPress={handleFinish}
          disabled={loading}
        >
          <View className="flex-row items-center justify-center">
             <Navigation size={16} color="white" />
             <Text style={styles.buttonMainText} className="ml-2">{t.useThisLocation}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.buttonSecondary}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.buttonSecondaryText}>{t.enterDifferentLocation}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdfa',
    padding: 24,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#059669',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ecfdf5',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  label: {
    fontSize: 16,
    color: '#065f46',
    fontWeight: '500',
  },
  value: {
    color: '#065f46',
    fontWeight: '700',
  },
  footer: {
    paddingBottom: 40,
  },
  buttonMain: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonMainText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonSecondaryText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
