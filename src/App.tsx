import React, { useState, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { LoadingScreen } from './components/LoadingScreen';
import { PostLocationLoadingScreen } from './components/PostLocationLoadingScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { HomeScreen } from './components/HomeScreen';
import { ReportScreen } from './components/ReportScreen';
import { SmartHeatmap } from './components/SmartHeatmap';
import { ProfileScreen } from './components/ProfileScreen';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { BottomNavigation } from './components/BottomNavigation';
import DesktopMobileNotice from './components/DesktopMobileNotice';
import SIHBackground from './components/SIHBackground';
import { translations, Language } from './components/translations';
import { dataService } from './services/dataService';
import { useGeolocation } from './hooks/useGeolocation';
import { Notification, NotificationCenter } from './components/NotificationCenter';

export interface Report {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  media?: MediaItem[];
  district: string;
  ward: string;
  street: string;
  coordinates: { lat: number; lng: number };
  distance: number;
  timestamp: Date;
  aiTag: string;
  aiConfidence: number;
  status: 'pending' | 'acknowledged' | 'submitted' | 'resolved';
  upvotes: number;
  comments: Comment[];
  severity: number;
  type: string;
  userId?: string;
  hasUserUpvoted?: boolean;
  isTamperDetected?: boolean;
  priority?: 'high' | 'medium' | 'low';
  voiceNoteUrl?: string;  // base64 data URL of the audio recording
  voiceNoteDuration?: number;  // duration in seconds
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: Date;
  author: string;
}

export interface User {
  coordinates: { lat: number; lng: number };  // PRIMARY: Real GPS coordinates
  district?: string;                           // OPTIONAL: For backward compatibility
  location?: {                                 // Auto-derived from GPS via reverse geocoding
    city?: string;
    state?: string;
    country?: string;
    formattedAddress?: string;
    street?: string;                           // Current street/road name
  };
  language: Language;
  isOnline: boolean;
  isManualLocation?: boolean;
}

export type Screen = 'onboarding' | 'home' | 'report' | 'map' | 'profile' | 'analytics';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPostLocationLoading, setIsPostLocationLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [user, setUser] = useState<User>({
    coordinates: { lat: 0, lng: 0 },  // Will be set by real GPS
    language: 'english',
    isOnline: true
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('swachh_nagar_notifications');
    if (!saved) return [];
    try {
      return JSON.parse(saved).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
    } catch (e) {
      return [];
    }
  });
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Ref to track reports for change detection
  const prevReportsRef = React.useRef<Report[]>([]);

  // App initialization loading
  useEffect(() => {
    const initializeApp = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 3000); // 3 second loading screen
    };

    initializeApp();
  }, []);

  // Real-time GPS tracking
  const { position: gpsPosition, loading: gpsLoading, error: gpsError } = useGeolocation({
    watch: true,
    enableHighAccuracy: true
  });

  // Update user coordinates when GPS position changes
  useEffect(() => {
    if (gpsPosition && !user.isManualLocation) {
      console.log('[App] GPS position acquired:', {
        lat: gpsPosition.latitude,
        lng: gpsPosition.longitude,
        accuracy: gpsPosition.accuracy
      });

      setUser(prev => ({
        ...prev,
        coordinates: {
          lat: gpsPosition.latitude,
          lng: gpsPosition.longitude
        }
      }));

      // Auto-derive district and location from GPS (reverse geocoding)
      import('./services/geocodingService').then(({ reverseGeocode }) => {
        reverseGeocode(gpsPosition.latitude, gpsPosition.longitude)
          .then(result => {
            console.log('[App] Reverse geocoding result:', result);
            console.log('[App] 📍 Street name:', result.street || 'No street data');
            setUser(prev => ({
              ...prev,
              district: result.city || result.state || 'Unknown',  // Use city as district
              location: {
                city: result.city,
                state: result.state,
                country: result.country,
                formattedAddress: result.formattedAddress,
                street: result.street  // Store street name
              }
            }));
          })
          .catch(err => {
            console.error('[App] Reverse geocoding failed:', err);
            // Fallback: use coordinates as district identifier
            setUser(prev => ({
              ...prev,
              district: `Location ${gpsPosition.latitude.toFixed(2)}, ${gpsPosition.longitude.toFixed(2)}`
            }));
          });
      });
    }
  }, [gpsPosition, user.isManualLocation]);

  // Handle GPS errors
  useEffect(() => {
    if (gpsError) {
      console.error('[App] GPS error:', gpsError.message);

      if (gpsError.type === 'PERMISSION_DENIED') {
        toast.error(t.locationDenied, {
          description: t.enableLocationAccess,
          duration: 5000
        });
      }
    }
  }, [gpsError]);

  // Load reports from dataService
  useEffect(() => {
    console.log('[App] Loading reports from dataService');
    const loadedReports = dataService.getReports();
    console.log('[App] Loaded reports:', loadedReports.map(r => ({
      id: r.id,
      title: r.title,
      coordinates: r.coordinates,
      district: r.district
    })));
    setReports(loadedReports);

    // Subscribe to data changes
    const unsubscribe = dataService.subscribe((updatedReports) => {
      console.log('[App] Received updated reports:', updatedReports.length);
      console.log('[App] Updated report coordinates:', updatedReports.map(r => ({
        id: r.id,
        coordinates: r.coordinates
      })));
      setReports(updatedReports);
    });

    return () => unsubscribe();
  }, []);

  // Notification detection logic
  useEffect(() => {
    const prevReports = prevReportsRef.current;

    if (prevReports.length > 0 && reports.length > 0) {
      reports.forEach(report => {
        const prevReport = prevReports.find(p => p.id === report.id);

        // Logical trigger: status changed to 'resolved'
        if (prevReport && prevReport.status !== 'resolved' && report.status === 'resolved') {
          const t = translations[user.language];
          const issueType = t[report.type.toLowerCase() as keyof typeof t] || report.type;

          const newNotification: Notification = {
            id: `notif-${Date.now()}-${report.id}`,
            reportId: report.id,
            type: 'status_change',
            category: issueType as string,
            title: t.issueResolved,
            message: t.reportResolvedMessage
              .replace('{type}', issueType as string)
              .replace('{title}', report.title),
            timestamp: new Date(),
            isRead: false
          };

          setNotifications(prev => {
            const updated = [newNotification, ...prev];
            localStorage.setItem('swachh_nagar_notifications', JSON.stringify(updated));
            return updated;
          });

          toast.success(t.issueResolved, {
            description: report.title,
            action: {
              label: t.viewDetails,
              onClick: () => {
                setSelectedReport(report);
                setIsNotificationCenterOpen(false);
                markAsRead(newNotification.id);
              }
            }
          });
        }
      });
    }

    prevReportsRef.current = reports;
  }, [reports, user.language]);

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem('swachh_nagar_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      localStorage.setItem('swachh_nagar_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const handleNotificationClick = (reportId: string, notificationId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      setSelectedReport(report);
      setIsNotificationCenterOpen(false);
    }
    markAsRead(notificationId);
  };

  const handleCompleteOnboarding = (selectedDistrict: string, coords: { lat: number; lng: number }, language: Language) => {
    const isManual = coords.lat === 0 && coords.lng === 0;
    setUser(prev => ({
      ...prev,
      district: selectedDistrict,
      location: {
        ...prev.location,
        city: selectedDistrict
      },
      coordinates: coords,
      language,
      isManualLocation: isManual
    }));

    // Show post-location loading screen
    setIsPostLocationLoading(true);

    // Simulate setup time after location detection
    setTimeout(() => {
      setIsPostLocationLoading(false);
      setHasCompletedOnboarding(true);
      setCurrentScreen('home');
    }, 3000); // 3 second post-location loading
  };

  const handleAddReport = (newReport: Omit<Report, 'id' | 'timestamp' | 'upvotes' | 'comments' | 'distance' | 'hasUserUpvoted'>) => {
    console.log('[App] handleAddReport called with data:', {
      title: newReport.title,
      coordinates: newReport.coordinates,
      district: newReport.district
    });

    const report: Report = {
      ...newReport,
      id: Date.now().toString(),
      timestamp: new Date(),
      userId: 'current-user', // FIX: Attach the report to the current user!
      upvotes: 0,
      comments: [],
      distance: Math.random() * 3, // Simulate distance
      hasUserUpvoted: false,
      media: newReport.imageUrl ? [{
        id: `${Date.now()}-1`,
        type: 'image' as const,
        url: newReport.imageUrl
      }] : []
    };

    console.log('[App] Created report object:', {
      id: report.id,
      title: report.title,
      coordinates: report.coordinates,
      district: report.district
    });

    if (user.isOnline) {
      // Use dataService to add report (syncs to admin!)
      console.log('[App] Adding report to dataService...');
      dataService.addReport(report);

      toast.success(
        `🎉 ${t.reportSubmittedSuccess} #${report.id.slice(-4)}`,
        {
          description: `${t.departmentAssignment} ${getDepartmentName(report.type)}`,
          duration: 4000,
        }
      );
    } else {
      toast.error(t.savedOffline);
    }

    setCurrentScreen('home');
  };

  const getDepartmentName = (issueType: string) => {
    const departments: Record<string, string> = {
      'road': t.publicWorksDept,
      'garbage': t.wasteManagementDept,
      'streetlight': t.electricalDept,
      'water': t.waterSupplyDept,
      'drainage': t.drainageDept
    };
    return departments[issueType.toLowerCase()] || t.municipalCorporation;
  };

  const handleUpvote = (reportId: string) => {
    // Use dataService to persist upvote changes
    dataService.toggleUpvote(reportId, 'current-user');

    // Also update local state immediately for instant feedback
    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        const hasUpvoted = report.hasUserUpvoted;
        return {
          ...report,
          upvotes: hasUpvoted ? report.upvotes - 1 : report.upvotes + 1,
          hasUserUpvoted: !hasUpvoted
        };
      }
      return report;
    }));
  };

  const handleAddComment = (reportId: string, commentText: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      text: commentText,
      timestamp: new Date(),
      author: 'You'
    };

    // Use dataService to persist comment
    dataService.addComment(reportId, newComment);

    // Also update local state immediately for instant feedback
    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        const updatedReport = {
          ...report,
          comments: [...report.comments, newComment]
        };

        // Update selectedReport if it's the same report being commented on
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport(updatedReport);
        }

        return updatedReport;
      }
      return report;
    }));
  };

  const handleLanguageChange = (language: Language) => {
    setUser(prev => ({ ...prev, language }));
  };

  const handleDeleteReport = (reportId: string) => {
    // Delete from dataService
    dataService.deleteReport(reportId);

    // Close modal if it was the selected report
    if (selectedReport?.id === reportId) {
      setSelectedReport(null);
    }
  };

  const handleFlag = (reportId: string) => {
    console.log(`[App] Report ${reportId} flagged for review`);

    toast.info(t.flaggedSuccess, {
      description: t.flaggedSuccess,
      duration: 3000,
    });
  };

  const t = translations[user.language];

  // Show loading screen first
  if (isLoading) {
    return (
      <>
        <SIHBackground />
        <LoadingScreen />
      </>
    );
  }

  // Show post-location loading screen
  if (isPostLocationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <PostLocationLoadingScreen detectedLocation={user.district || user.location?.city || t.locationDetected} />
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <>
        <SIHBackground />
        <div className="min-h-screen bg-background w-full mx-auto relative mobile-container">
          <OnboardingScreen
            onComplete={handleCompleteOnboarding}
            currentLanguage={user.language}
            onLanguageChange={handleLanguageChange}
          />
          <Toaster />
        </div>
      </>
    );
  }

  return (
    <>
      <SIHBackground />
      <div className="min-h-screen bg-background w-full mx-auto relative mobile-container">
        <DesktopMobileNotice />
        {currentScreen !== 'map' && (
          // Other screens with bottom padding for navigation
          <div className="pb-20">
            {currentScreen === 'home' && (
              <HomeScreen
                reports={reports}
                user={user}
                onReportSelect={setSelectedReport}
                onUpvote={handleUpvote}
                onAddComment={handleAddComment}
                selectedReport={selectedReport}
                onCloseModal={() => setSelectedReport(null)}
                onReportAgain={() => setCurrentScreen('report')}
                onDeleteReport={handleDeleteReport}
                onFlag={handleFlag}
                unreadNotificationsCount={notifications.filter(n => !n.isRead).length}
                onOpenNotifications={() => setIsNotificationCenterOpen(true)}
              />
            )}

            {currentScreen === 'analytics' && (
              <AnalyticsScreen
                reports={reports}
                user={user}
              />
            )}

            {currentScreen === 'report' && (
              <ReportScreen
                user={user}
                onSubmit={handleAddReport}
                onCancel={() => setCurrentScreen('home')}
              />
            )}

            {currentScreen === 'profile' && (
              <ProfileScreen
                reports={reports.filter(r => r.userId === 'current-user')}
                user={user}
                onLanguageChange={handleLanguageChange}
                onToggleOnline={() => setUser(prev => ({ ...prev, isOnline: !prev.isOnline }))}
                onReportAgain={() => setCurrentScreen('report')}
              />
            )}
          </div>
        )}

        {currentScreen === 'map' && (
          // Map screen handles its own layout
          <SmartHeatmap
            reports={reports}
            user={user}
            onReportSelect={setSelectedReport}
            onUpvote={handleUpvote}
          />
        )}

        <BottomNavigation
          currentScreen={currentScreen}
          onScreenChange={setCurrentScreen}
          language={user.language}
        />
      </div>
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        language={user.language}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={markAllRead}
      />
      <Toaster />
    </>
  );
}
