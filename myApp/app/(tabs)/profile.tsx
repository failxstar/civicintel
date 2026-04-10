import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Switch, StyleSheet, Platform, Dimensions, Alert } from 'react-native';
import { 
  Settings, 
  Globe, 
  Bell, 
  Shield, 
  LogOut,
  ChevronRight,
  Award,
  MapPin
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      t.deleteConfirm || "Log Out",
      "Are you sure you want to log out and reset settings?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/onboarding/language');
          }
        }
      ]
    );
  };

  const menuItems = [
    { 
      label: t.language, 
      icon: Globe, 
      value: t.selectLanguage, 
      color: 'text-blue-600',
      action: () => router.push('/onboarding/language')
    },
    { label: t.notifications, icon: Bell, value: 'On', color: 'text-orange-600' },
    { label: t.privacySecurity, icon: Shield, value: '', color: 'text-emerald-600' },
    { label: t.helpSupport, icon: Settings, value: '', color: 'text-gray-600' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="px-6 pt-12 pb-8 bg-white border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="relative">
                <View className="w-20 h-20 rounded-3xl bg-emerald-100 items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                   <Award size={40} color="#10b981" />
                </View>
                <View className="absolute -bottom-1 -right-1 bg-emerald-500 w-6 h-6 rounded-lg border-2 border-white items-center justify-center">
                  <Award size={12} color="white" />
                </View>
              </View>
              <View className="ml-5">
                <Text className="text-2xl font-black text-gray-900 tracking-tight">{t.userName}</Text>
              </View>
            </View>
          </View>

          <View className="p-4 space-y-6">
            <View className="flex-row justify-between">
              {[
                { label: t.myReports || 'My Reports', val: '0', color: 'text-blue-600' },
                { label: t.upvotes, val: '12', color: 'text-orange-600' },
                { label: t.points, val: '850', color: 'text-emerald-600' }
              ].map((stat, i) => (
                <View key={i} className="bg-white items-center py-4 rounded-3xl w-[31%] border border-gray-50 shadow-sm">
                  <Text className="text-lg font-black text-gray-900">{stat.val}</Text>
                  <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 text-center px-1">{stat.label}</Text>
                </View>
              ))}
            </View>

            <View className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
              <View className="flex-row items-center justify-between p-6 border-b border-gray-50">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-emerald-500 mr-3" />
                  <Text className="font-black text-gray-800 uppercase tracking-widest text-[10px]">{isOnline ? t.onlineMode : t.offlineMode}</Text>
                </View>
                <Switch 
                  value={isOnline} 
                  onValueChange={setIsOnline}
                  trackColor={{ false: '#f3f4f6', true: '#d1fae5' }}
                  thumbColor={isOnline ? '#10b981' : '#9ca3af'}
                />
              </View>

              {menuItems.map((item, i) => (
                <TouchableOpacity 
                  key={i} 
                  onPress={item.action}
                  className="flex-row items-center justify-between p-6 border-b border-gray-50 active:bg-gray-50"
                >
                  <View className="flex-row items-center">
                    <View className="bg-gray-50 p-2.5 rounded-xl">
                      <item.icon size={20} color="#6b7280" />
                    </View>
                    <Text className="ml-4 font-bold text-gray-700 text-sm">{item.label}</Text>
                  </View>
                  <View className="flex-row items-center">
                    {item.value && <Text className="mr-2 text-xs font-bold text-gray-400">{item.value}</Text>}
                    <ChevronRight size={18} color="#d1d5db" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              onPress={handleLogout}
              className="bg-white py-5 rounded-[32px] flex-row justify-center items-center border border-red-50 shadow-sm active:bg-red-50"
            >
              <LogOut size={20} color="#ef4444" />
              <Text className="ml-3 font-black text-red-500 uppercase tracking-widest text-xs">{t.logout || 'Log Out'}</Text>
            </TouchableOpacity>

            <View className="items-center py-6 mt-4">
               <Text className="text-gray-300 font-mono text-[9px] tracking-tight uppercase">CivicIntel v1.0.0 (SIH 2025 Edition)</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb',
    height: Platform.OS === 'web' ? Dimensions.get('window').height : '100%'
  }
});
