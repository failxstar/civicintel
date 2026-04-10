import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  RefreshControl,
  Modal,
  SafeAreaView,
  Dimensions,
  Platform,
  StyleSheet,
  Alert
} from 'react-native';
import * as Location from 'expo-location';
import { 
  Bell, MapPin, Search, ArrowRight, MessageCircle, ThumbsUp, Activity, Filter, Camera, 
  X, Building2, AlertTriangle, Mic, ChevronRight, ShieldAlert, Settings, Globe, Wifi, 
  Clock, ArrowUp, Trash2, Play, Square, Volume2, Pause
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { dataService, Report, Comment } from '@/services/dataService';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationName, setLocationName] = useState(t.detectingLocation);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0, accuracy: 0 });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newComment, setNewComment] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [playingAudio, setPlayingAudio] = useState(false);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  
  const colorScheme = useColorScheme();

  const fetchReports = async () => {
    const data = await dataService.loadReportsFromAPI();
    setReports(data || []);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  useEffect(() => {
    let isMounted = true;
    let locationSubscription: any = null;
    let webInterval: any = null;

    const init = async () => {
      try {
        const url = await dataService.getApiUrl();
        if (!isMounted) return;
        setCurrentApiUrl(url);
        setCustomApiUrl(url);
        fetchReports();
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setLocationName(t.locationAccessNeeded);
          return;
        }

        const updateAddress = async (lat: number, lon: number) => {
          if (!isMounted) return;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
              { 
                headers: { 
                  'Accept-Language': 'en',
                  'User-Agent': 'CivicIntel-Mobile-App/1.0 (contact: support@civicintel.com)'
                } 
              }
            );
            const data = await response.json();
            if (isMounted && data && data.address) {
              const addr = data.address;
              const name = addr.hamlet || addr.village || addr.town || addr.neighbourhood || addr.suburb || addr.road;
              const city = addr.city || addr.district || addr.state;
              setLocationName(`${name ? name + ', ' : ''}${city || ''}`);
            }
          } catch (e) {}
        };

        // Initial Position
        const initialLocation = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced 
        });
        if (isMounted) {
          setCoordinates({ 
            lat: initialLocation.coords.latitude, 
            lng: initialLocation.coords.longitude,
            accuracy: initialLocation.coords.accuracy || 0
          });
          updateAddress(initialLocation.coords.latitude, initialLocation.coords.longitude);
        }

        if (Platform.OS === 'web') {
          // Safer polling for web to avoid EventListener issues
          webInterval = setInterval(async () => {
            try {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              if (isMounted) {
                setCoordinates({ lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy: 0 });
                updateAddress(loc.coords.latitude, loc.coords.longitude);
              }
            } catch (e) {}
          }, 60000);
        } else {
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 10000,
              distanceInterval: 10,
            },
            (location) => {
              if (isMounted) {
                setCoordinates({ 
                  lat: location.coords.latitude, 
                  lng: location.coords.longitude,
                  accuracy: location.coords.accuracy || 0
                });
                updateAddress(location.coords.latitude, location.coords.longitude);
              }
            }
          );
        }
      } catch (err) {
        console.warn('Location init warning:', err);
      }
    };

    init();

    const unsubscribe = dataService.subscribe((updatedReports) => {
      if (!isMounted) return;
      setReports(updatedReports);
      setSelectedReport(prev => {
        if (!prev) return null;
        const matching = updatedReports.find(r => r.id === prev.id);
        return matching ? { ...matching } : prev;
      });
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      if (webInterval) clearInterval(webInterval);
      if (locationSubscription && typeof locationSubscription.remove === 'function') {
        try { locationSubscription.remove(); } catch (e) {}
      }
    };
  }, []);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} ${t.minutesAgo}`;
    if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
    return `${diffDays} ${t.daysAgo}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getDepartmentInfo = (issueType: string) => {
    const styles: Record<string, { name: string; hex: string; bg: string }> = {
      'road': { name: 'PWD', hex: '#1d4ed8', bg: 'bg-blue-50' },
      'garbage': { name: 'WMD', hex: '#16a34a', bg: 'bg-green-50' },
      'streetlight': { name: 'ED', hex: '#b45309', bg: 'bg-amber-50' },
      'water': { name: 'WSD', hex: '#0e7490', bg: 'bg-cyan-50' },
    };
    return styles[issueType.toLowerCase()] || { name: 'MC', hex: '#374151', bg: 'bg-gray-50' };
  };

  const handleUpvote = (reportId: string) => {
    dataService.toggleUpvote(reportId, 'user');
    // The subscription will handle the UI update
  };

  const handleLocalDelete = (reportId: string) => {
    const confirmDelete = () => {
      dataService.deleteReport(reportId);
      setSelectedReport(null);
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this report?')) confirmDelete();
    } else {
      Alert.alert(
        "Delete Report",
        "Are you sure you want to permanently remove this report?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: confirmDelete }
        ]
      );
    }
  };

  const handleLocalComment = async () => {
    if (!newComment.trim() || !selectedReport) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      timestamp: new Date(),
      author: 'Demo User'
    };

    // Optimistic Update
    const updatedComments = [...(selectedReport.comments || []), comment];
    setSelectedReport(prev => prev ? { ...prev, comments: updatedComments } : null);
    
    const originalComment = newComment;
    setNewComment('');

    try {
      await dataService.addComment(selectedReport.id, comment);
    } catch (error: any) {
      console.error('Comment error:', error);
      // Rollback on failure
      setNewComment(originalComment);
      setSelectedReport(prev => prev ? { 
        ...prev, 
        comments: (prev.comments || []).filter(c => c.id !== comment.id) 
      } : null);
      
      Alert.alert(
        "Comment Failed",
        "We couldn't save your comment. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    }
  };

  const playVoiceNote = async (url: string) => {
    try {
      if (playingAudio && currentSound) {
        await currentSound.pauseAsync();
        setPlayingAudio(false);
        return;
      }

      if (currentSound) {
        await currentSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri: url });
      setCurrentSound(sound);
      setPlayingAudio(true);
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudio(false);
          sound.unloadAsync();
          setCurrentSound(null);
        }
      });
    } catch (e) {
      console.error('Audio playback error', e);
      Alert.alert('Playback Error', 'Could not play the voice note.');
    }
  };

  const closeDetailModal = () => {
    setSelectedReport(null);
    if (currentSound) {
      currentSound.unloadAsync();
      setCurrentSound(null);
      setPlayingAudio(false);
    }
  };

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ward.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* Header Section */}
        <View className="bg-white px-5 pt-4 pb-5 shadow-sm border-b border-gray-100">
          <View className="flex-row justify-between items-center mb-5">
            <View>
              <Text className="text-3xl font-black text-green-600 tracking-tighter">CivicIntel</Text>
              <TouchableOpacity 
                onPress={() => setIsLocationModalVisible(true)}
                className="flex-row items-center bg-gray-50 px-2 py-1.5 rounded-xl border border-gray-100 mt-1"
              >
                <MapPin size={12} color="#16a34a" />
                <Text className="text-[10px] font-black text-gray-700 ml-1 uppercase tracking-tight" numberOfLines={1}>
                  {locationName}
                </Text>
                <ChevronRight size={10} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              onPress={() => setIsSettingsModalVisible(true)}
              className="bg-gray-100 p-2.5 rounded-2xl"
            >
              <Settings size={22} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3.5">
            <Search size={18} color="#9ca3af" />
            <TextInput
              placeholder={t.search}
              className="flex-1 ml-3 text-base text-gray-900 font-medium"
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <ScrollView 
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
        >
          {filteredReports.map((report) => {
            const dept = getDepartmentInfo(report.type);
            return (
              <TouchableOpacity 
                key={report.id} 
                activeOpacity={0.9}
                onPress={() => setSelectedReport(report)}
                className="bg-white rounded-[32px] mb-6 overflow-hidden shadow-sm border border-gray-100"
              >
                <View className="px-6 py-5 flex-row justify-between items-center border-b border-gray-50">
                  <View className="flex-row items-center">
                    <View className={`${dept.bg} p-2.5 rounded-2xl mr-4`}>
                      <Building2 size={18} color={dept.hex} />
                    </View>
                    <View>
                      <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{dept.name} DIVISION</Text>
                      <Text className="text-sm font-black text-gray-800">{report.ward}</Text>
                    </View>
                  </View>
                  <Text className="text-[10px] text-gray-400 font-black uppercase">{formatTimeAgo(report.timestamp)}</Text>
                </View>

                <View className="p-6 flex-row">
                  <View className="flex-1 pr-6">
                    <Text className="text-xl font-black text-gray-900 mb-2 leading-tight" numberOfLines={2}>{report.title}</Text>
                    <Text className="text-sm text-gray-500 mb-4 leading-relaxed" numberOfLines={2}>{report.description}</Text>
                    <View className="flex-row items-center">
                      <View className={`px-4 py-1.5 rounded-full ${getStatusColor(report.status)}`}>
                        <Text className="text-[10px] font-black uppercase tracking-widest">{report.status}</Text>
                      </View>
                      {report.priority === 'high' && (
                        <View className="ml-2 bg-red-50 px-3 py-1.5 rounded-full flex-row items-center">
                          <ShieldAlert size={10} color="#dc2626" />
                          <Text className="text-[10px] text-red-700 font-black ml-1 uppercase">URGENT</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Image source={{ uri: report.imageUrl }} className="w-24 h-24 rounded-3xl bg-gray-100" />
                </View>

                <View className="px-6 py-4 bg-gray-50/50 flex-row justify-between items-center border-t border-gray-50">
                  <View className="flex-row items-center gap-8">
                    <TouchableOpacity onPress={() => handleUpvote(report.id)} className="flex-row items-center">
                      <ArrowUp size={22} color={report.hasUserUpvoted ? "#16a34a" : "#64748b"} strokeWidth={3} fill={report.hasUserUpvoted ? "#16a34a" : "transparent"} />
                      <Text className={`ml-2 text-base font-black ${report.hasUserUpvoted ? "text-green-600" : "text-gray-600"}`}>{report.upvotes}</Text>
                    </TouchableOpacity>
                    <View className="flex-row items-center">
                      <MessageCircle size={22} color="#64748b" strokeWidth={2.5} />
                      <Text className="ml-2 text-base font-black text-gray-600">{report.comments?.length || 0}</Text>
                    </View>
                  </View>
                  <ArrowRight size={20} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredReports.length === 0 && (
            <View style={styles.noReports}>
              <Search size={64} color="#e5e7eb" />
              <Text className="text-gray-400 text-xl font-black mt-6 tracking-tight">{t.noReportsFound}</Text>
              <Text className="text-gray-400 text-xs mt-2 uppercase tracking-widest">{t.tryAnotherSearch}</Text>
            </View>
          )}
          <View className="h-24" />
        </ScrollView>
      </View>

      {/* Settings Modal */}
      <Modal visible={isSettingsModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white w-full rounded-[40px] p-8 shadow-2xl">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-black text-gray-900 tracking-tight">{t.systemConfig}</Text>
              <TouchableOpacity onPress={() => setIsSettingsModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View className="bg-green-50 rounded-3xl p-6 mb-8 border border-green-100">
              <Text className="text-[10px] font-black text-green-600 uppercase tracking-[2px] mb-2">{t.networkDiagnostics}</Text>
              <Text className="text-green-900 font-bold text-sm mb-1">API Endpoint: {currentApiUrl}</Text>
              <Text className="text-green-700 text-xs font-mono">GPS: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</Text>
            </View>
            <TextInput
              placeholder="Backend URL (http://...)"
              className="bg-gray-100 rounded-2xl px-5 py-4 text-base font-bold text-gray-900 mb-8"
              value={customApiUrl}
              onChangeText={setCustomApiUrl}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              onPress={async () => {
                await dataService.setApiUrl(customApiUrl);
                setCurrentApiUrl(customApiUrl);
                setIsSettingsModalVisible(false);
                onRefresh();
              }}
              className="bg-green-600 py-5 rounded-3xl items-center shadow-xl shadow-green-100"
            >
              <Text className="text-white font-black text-lg uppercase tracking-widest">{t.submit}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedReport} animationType="slide">
        {selectedReport && (
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100 shadow-sm">
              <View className="flex-row items-center">
                <TouchableOpacity onPress={closeDetailModal} className="bg-gray-100 p-2 rounded-full mr-4">
                  <X size={20} color="#6b7280" />
                </TouchableOpacity>
                <View>
                  <Text className="text-sm font-black text-gray-900 tracking-tight" numberOfLines={1}>
                    {selectedReport.title}
                  </Text>
                  <Text className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                    {selectedReport.ward} • {formatTimeAgo(selectedReport.timestamp)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity className="p-2">
                 <Settings size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <ScrollView 
                className="flex-1" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <Image source={{ uri: selectedReport.imageUrl }} className="w-full h-80 bg-gray-100" resizeMode="cover" />
                
                <View className="p-6">
                  {/* Status & Confidence Strip */}
                  <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-row items-center">
                      <Text className="text-green-600 font-bold text-xs uppercase tracking-tight">Status: </Text>
                      <Text className="text-green-700 font-black text-xs uppercase tracking-tight">{selectedReport.status}</Text>
                    </View>
                    <Text className="text-[10px] text-gray-400 font-black uppercase">{formatTimeAgo(selectedReport.timestamp)}</Text>
                  </View>

                  <View className="mb-6">
                     <Text className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-loose">
                        {selectedReport.street || 'Location Detected'}
                     </Text>
                     <div className="flex">
                        <View className="bg-green-50 px-3 py-1 rounded-lg mt-1">
                           <Text className="text-green-700 font-black text-[10px] uppercase">
                             {selectedReport.aiTag || 'Issue'} — {selectedReport.aiConfidence || '98'}% confidence
                           </Text>
                        </View>
                     </div>
                  </View>

                  {/* Department Box */}
                  <View className="bg-white border border-gray-100 rounded-[28px] p-6 mb-8 shadow-sm">
                     <View className="flex-row items-center mb-4">
                        <Building2 size={18} color="#16a34a" />
                        <Text className="ml-3 text-sm font-black text-gray-900 uppercase tracking-widest">Department Assignment</Text>
                     </View>
                     <View className="ml-7">
                        <Text className="text-sm font-black text-gray-800">
                          {getDepartmentInfo(selectedReport.type).name} - Public Works Department
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <Clock size={12} color="#9ca3af" />
                          <Text className="ml-2 text-[10px] font-bold text-gray-400">Estimated response: 24-48 hours</Text>
                        </View>
                     </View>
                  </View>

                  <Text className="text-2xl font-black text-gray-900 mb-2">{selectedReport.title}</Text>
                  <Text className="text-sm text-gray-600 leading-relaxed mb-6">{selectedReport.description}</Text>

                  {/* Audio Player if voiceNoteUrl exists */}
                  {selectedReport.voiceNoteUrl && (
                    <View className="bg-blue-50 border border-blue-100 rounded-[24px] p-5 mb-8 flex-row items-center justify-between shadow-sm">
                       <View className="flex-row items-center flex-1">
                          <View className="bg-blue-100 p-3 rounded-2xl mr-4">
                             <Volume2 size={24} color="#1d4ed8" />
                          </View>
                          <View className="flex-1">
                             <Text className="text-blue-900 font-black text-xs uppercase tracking-widest">Voice Evidence</Text>
                             <Text className="text-[10px] text-blue-600 font-bold mt-1">Recorded by citizen</Text>
                          </View>
                       </View>
                       <TouchableOpacity 
                         onPress={() => playVoiceNote(selectedReport.voiceNoteUrl!)}
                         className={`w-14 h-14 rounded-full justify-center items-center shadow-md ${playingAudio ? 'bg-red-500 shadow-red-200' : 'bg-blue-600 shadow-blue-200'}`}
                       >
                         {playingAudio ? <Square size={20} color="white" fill="white" /> : <Play size={22} color="white" fill="white" className="ml-1" />}
                       </TouchableOpacity>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View className="flex-row gap-4 mb-10">
                     <TouchableOpacity 
                      onPress={() => handleUpvote(selectedReport.id)}
                      className={`flex-row items-center px-5 py-3 rounded-2xl border ${selectedReport.hasUserUpvoted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}
                     >
                        <ArrowUp size={18} color={selectedReport.hasUserUpvoted ? "#16a34a" : "#64748b"} strokeWidth={3} />
                        <Text className={`ml-2 font-black text-xs uppercase ${selectedReport.hasUserUpvoted ? 'text-green-700' : 'text-gray-500'}`}>
                          {selectedReport.upvotes} Upvote
                        </Text>
                     </TouchableOpacity>

                     <TouchableOpacity className="flex-row items-center px-5 py-3 rounded-2xl border border-gray-100 bg-white">
                        <ShieldAlert size={18} color="#64748b" />
                        <Text className="ml-2 font-black text-xs text-gray-500 uppercase">Flag</Text>
                     </TouchableOpacity>

                     <TouchableOpacity 
                      onPress={() => handleLocalDelete(selectedReport.id)}
                      className="flex-row items-center px-5 py-3 rounded-2xl border border-red-50 bg-white"
                     >
                        <Trash2 size={18} color="#ef4444" />
                        <Text className="ml-2 font-black text-xs text-red-500 uppercase">Delete</Text>
                     </TouchableOpacity>
                  </View>

                  {/* Comments Section */}
                  <View className="mb-8">
                     <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-6">Comments</Text>
                     
                     <View className="space-y-6">
                        {selectedReport.comments && selectedReport.comments.length > 0 ? (
                          selectedReport.comments.map((comment, idx) => (
                            <View key={idx} className="bg-gray-50 p-5 rounded-[24px] mb-4">
                              <View className="flex-row justify-between mb-2">
                                <Text className="font-black text-xs text-gray-800 uppercase">{comment.author}</Text>
                                <Text className="text-[9px] text-gray-400 font-black uppercase">{formatTimeAgo(new Date(comment.timestamp))}</Text>
                              </View>
                              <Text className="text-sm text-gray-600 leading-relaxed">{comment.text}</Text>
                            </View>
                          ))
                        ) : (
                          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest text-center py-4">No comments yet</Text>
                        )}
                     </View>
                  </View>
                </View>
              </ScrollView>

              {/* Fixed Bottom Comment Input */}
              <View className="px-5 py-4 bg-white border-t border-gray-100">
                <View className="flex-row items-center bg-gray-50 rounded-[28px] px-5 py-2">
                  <TextInput 
                    placeholder="Add comment..."
                    className="flex-1 text-sm font-bold text-gray-900 h-12"
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline={false}
                  />
                  <TouchableOpacity 
                    onPress={handleLocalComment}
                    className="bg-green-600 px-6 py-3 rounded-2xl ml-3 shadow-md shadow-green-100"
                  >
                      <Text className="text-white font-black text-xs uppercase tracking-tight">Post</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    height: Platform.OS === 'web' ? Dimensions.get('window').height : '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  noReports: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  }
});
