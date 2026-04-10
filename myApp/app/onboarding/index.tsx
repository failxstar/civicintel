import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/onboarding/language');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Circuit-like background patterns */}
      <View style={styles.circuitContainer}>
        <View className="absolute top-20 left-10 w-40 h-[1px] bg-blue-200 opacity-30 transform -rotate-45" />
        <View className="absolute top-40 right-10 w-64 h-[1px] bg-blue-300 opacity-20 transform rotate-45" />
        <View className="absolute bottom-60 left-20 w-32 h-[1px] bg-emerald-200 opacity-40 transform -rotate-12" />
      </View>

      <Animated.View 
        style={[
          styles.logoContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View className="bg-white p-8 rounded-full shadow-2xl border border-gray-50 items-center justify-center">
             <View className="relative">
                {/* Tech/Circuit aesthetic overlay */}
                <View style={styles.hexBorder} />
                <Shield size={100} color="#0284c7" />
             </View>
             <Text className="text-3xl font-light text-gray-800 tracking-[8px] mt-6 uppercase">
               CIVIC<Text className="font-bold">INTEL</Text>
             </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdfa', // Very light mint/white
    justifyContent: 'center',
    alignItems: 'center',
  },
  circuitContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  logoContainer: {
    alignItems: 'center',
  },
  hexBorder: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderWidth: 2,
    borderColor: '#e0f2fe',
    borderRadius: 20,
    transform: [{ rotate: '45deg' }],
  }
});
