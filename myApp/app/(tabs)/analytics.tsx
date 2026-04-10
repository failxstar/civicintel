import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, StyleSheet, Platform } from 'react-native';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle,
  Activity,
  ArrowRight
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { dataService, Report } from '@/services/dataService';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    (async () => {
      const data = await dataService.loadReportsFromAPI();
      setReports(data || []);
    })();
  }, []);

  const resolvedCount = reports.filter(r => r.status === 'resolved').length;
  const resolutionRate = reports.length > 0 ? Math.round((resolvedCount / reports.length) * 100) : 0;

  const statsCards = [
    {
      title: t.activeReports || 'Total Reports',
      value: reports.length,
      icon: BarChart3,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      title: t.resolutionRate,
      value: `${resolutionRate}%`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    {
      title: t.avgResolution,
      value: '1.7d',
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100'
    },
    {
      title: t.activeCitizens,
      value: Math.max(12, Math.floor(reports.length * 0.7)),
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100'
    }
  ];

  const types = [
    { label: t.garbage, count: reports.filter(r => r.type === 'garbage').length, color: 'bg-emerald-500' },
    { label: t.road, count: reports.filter(r => r.type === 'road').length, color: 'bg-blue-500' },
    { label: t.water, count: reports.filter(r => r.type === 'water').length, color: 'bg-cyan-500' },
    { label: t.streetlight, count: reports.filter(r => r.type === 'streetlight').length, color: 'bg-amber-500' },
  ];

  const maxTypeCount = Math.max(...types.map(t => t.count), 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View className="bg-white px-6 pt-4 pb-6 border-b border-gray-100">
          <Text className="text-2xl font-black text-gray-900 tracking-tight">{t.analyticsDashboard}</Text>
          <Text className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-1">{t.siliguriMunicipalCorporation || t.municipalCorporation}</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 pt-6 space-y-6">
          
          {/* Stats Grid */}
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {statsCards.map((stat, i) => (
              <View 
                key={i} 
                className={`w-[48%] ${stat.bg} ${stat.border} border rounded-3xl p-5 shadow-sm shadow-black/5`}
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View className="bg-white/60 p-2 rounded-xl">
                    <stat.icon size={20} color={stat.color.replace('text-', '').replace('-600', '')} className={stat.color} />
                  </View>
                  <TrendingUp size={14} color="#10b981" />
                </View>
                <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.title}</Text>
                <Text className="text-2xl font-black text-gray-900">{stat.value}</Text>
              </View>
            ))}
          </View>

          {/* Issue Types Chart */}
          <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <Activity size={18} color="#111827" />
                <Text className="text-lg font-black text-gray-900 ml-2">{t.topIssueTypes || 'Incident Distribution'}</Text>
              </View>
              <TouchableOpacity>
                <Text className="text-emerald-600 text-xs font-bold font-mono">HISTORY</Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-6">
              {types.map((type, i) => (
                <View key={i} className="space-y-2">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-bold text-gray-700">{type.label}</Text>
                    <Text className="text-xs font-black text-gray-400">{type.count} {t.reports || 'Reports'}</Text>
                  </View>
                  <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <View 
                      style={{ width: `${(type.count / maxTypeCount) * 100}%` }}
                      className={`h-full rounded-full ${type.color}`} 
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* performance metrics */}
          <View className="bg-emerald-900 rounded-[32px] p-6 shadow-xl">
             <Text className="text-emerald-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Performance AI</Text>
             <Text className="text-white text-xl font-black mb-6">{t.cityHealthIndicators}</Text>
             
             <View className="space-y-5">
               <View className="flex-row items-center justify-between">
                 <Text className="text-emerald-100/70 text-sm font-medium">{t.complianceRate}</Text>
                 <Text className="text-white font-black">94.2%</Text>
               </View>
               <View className="bg-emerald-800 h-1.5 rounded-full">
                 <View className="bg-emerald-400 w-[94%] h-full rounded-full" />
               </View>

               <View className="flex-row items-center justify-between">
                 <Text className="text-emerald-100/70 text-sm font-medium">{t.citizenResponse}</Text>
                 <Text className="text-white font-black">8.4/10</Text>
               </View>
               <View className="bg-emerald-800 h-1.5 rounded-full">
                 <View className="bg-emerald-400 w-[84%] h-full rounded-full" />
               </View>
             </View>
          </View>

          {/* Critical Areas */}
          <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <Text className="text-lg font-black text-gray-900 mb-4">{t.criticalAreas || 'Critical Zones'}</Text>
            <View className="space-y-3">
              {[
                { ward: 'Ward 12', status: 'Priority', color: 'bg-red-500' },
                { ward: 'Ward 5', status: 'Stable', color: 'bg-emerald-500' },
                { ward: 'Ward 24', status: 'Warning', color: 'bg-amber-500' },
              ].map((area, i) => (
                <TouchableOpacity key={i} className="flex-row items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <View className="flex-row items-center">
                    <View className={`w-3 h-3 rounded-full ${area.color} border-2 border-white shadow-sm`} />
                    <Text className="ml-3 font-bold text-gray-800">{area.ward}</Text>
                  </View>
                  <ArrowRight size={16} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="items-center py-6">
            <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">{t.copyright}</Text>
          </View>
          
          <View className="h-10" />
        </View>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    height: Platform.OS === 'web' ? Dimensions.get('window').height : '100%',
  }
});
