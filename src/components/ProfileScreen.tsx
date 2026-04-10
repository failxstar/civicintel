import React, { useState } from 'react';
import { Settings, Globe, Wifi, WifiOff, Plus, User, MapPin, Calendar, Award, TrendingUp, Languages, Clock, Star, Download, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { motion } from 'motion/react';
import { Report, User as UserType } from '../App';
import { translations, Language } from './translations';
import { TechShowcase } from './TechShowcase';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProfileScreenProps {
  reports: Report[];
  user: UserType;
  onLanguageChange: (language: Language) => void;
  onToggleOnline: () => void;
  onReportAgain: () => void;
}

const languageOptions = [
  { value: 'english', label: 'English' },
  { value: 'tamil', label: 'தமிழ் (Tamil)' },
  { value: 'hindi', label: 'हिन्दी (Hindi)' },
  { value: 'malayalam', label: 'മലയാളം (Malayalam)' },
  { value: 'telugu', label: 'తెలుగు (Telugu)' }
];

export function ProfileScreen({
  reports,
  user,
  onLanguageChange,
  onToggleOnline,
  onReportAgain
}: ProfileScreenProps) {
  const t = translations[user.language as Language];

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Report['status']) => {
    switch (status) {
      case 'pending': return t.statusPending;
      case 'acknowledged': return t.statusAcknowledged;
      case 'submitted': return t.statusInProgress;
      case 'resolved': return t.statusResolved;
      default: return status;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} ${t.minutesAgo}`;
    } else if (diffHours < 24) {
      return `${diffHours} ${t.hoursAgo}`;
    } else {
      return `${diffDays} ${t.daysAgo}`;
    }
  };

  const handleDownloadCertificate = (reportId: string) => {
    // Generate a simple certificate download
    const certificateData = `
      SILIGURI MUNICIPAL CORPORATION
      ISSUE RESOLUTION CERTIFICATE
      
      Report ID: ${reportId}
      Issue Status: RESOLVED
      Date: ${new Date().toLocaleDateString()}
      
      This certifies that the reported civic issue has been 
      successfully resolved by the municipal authorities.
      
      Thank you for your civic participation.
    `;

    const blob = new Blob([certificateData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${reportId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReportAgain = (originalReport: Report) => {
    // This would typically pre-fill the report form with similar details
    onReportAgain();
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div className="p-4 pt-6">
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#064e3b', letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t.profile}
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>{t.memberSince} 2024</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* User Info */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-medium">Demo User</h2>
              <p style={{ color: '#ef4444', fontSize: '10px', fontWeight: 600, marginTop: '-2px', marginBottom: '2px' }}>
                the data used here are hardcoded for practical demo usage.
              </p>
              <p className="text-sm text-muted-foreground">📍 {user.district}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-medium">{reports.length}</p>
              <p className="text-xs text-muted-foreground">{t.reportsLabel}</p>
            </div>
            <div>
              <p className="text-lg font-medium">{reports.reduce((sum, report) => sum + report.upvotes, 0)}</p>
              <p className="text-xs text-muted-foreground">{t.upvotesLabel}</p>
            </div>
            <div>
              <p className="text-lg font-medium">{reports.filter(r => r.status === 'resolved').length}</p>
              <p className="text-xs text-muted-foreground">{t.resolvedLabel}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">{t.settings}</TabsTrigger>
            <TabsTrigger value="reports">{t.myReports}</TabsTrigger>
            <TabsTrigger value="tech">{t.techFeatures}</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 mt-4">
            {/* Settings */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {t.settings}
              </h3>

              <div className="space-y-4">
                {/* Language Selection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{t.language}</span>
                  </div>
                  <Select value={user.language} onValueChange={(value: string) => onLanguageChange(value as Language)}>
                    <SelectTrigger className="w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Online/Offline Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {user.isOnline ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {user.isOnline ? t.onlineMode : t.offlineMode} ({t.selectAutomatically})
                    </span>
                  </div>
                  <Switch
                    checked={user.isOnline}
                    onCheckedChange={onToggleOnline}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 mt-4">
            {/* My Reports */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-4">{t.myReports}</h3>

              <div className="space-y-3">
                {reports.map((report) => (
                  <motion.div
                    key={report.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={report.imageUrl}
                          alt={report.title}
                          className="relative w-full h-[420px] overflow-hidden rounded-xl"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm font-medium truncate">{report.title}</h4>
                          <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                            {getStatusText(report.status)}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mb-2">
                          {report.ward} • {formatTimeAgo(report.timestamp)}
                        </p>

                        {report.status === 'submitted' && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 mb-2">
                            <Clock className="w-3 h-3" />
                            {t.slaCountdown}
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {report.status === 'resolved' && (
                            <>
                              {/* Download Certificate Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-auto py-1 px-2 flex items-center gap-1"
                                onClick={() => handleDownloadCertificate(report.id)}
                              >
                                <Download className="w-3 h-3" />
                                {t.downloadCertificate}
                              </Button>

                              {/* Report Again Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-auto py-1 px-2 flex items-center gap-1"
                                onClick={() => handleReportAgain(report)}
                              >
                                <RotateCcw className="w-3 h-3" />
                                {t.reportAgain}
                              </Button>

                              {/* Rating Section */}
                              <div className="flex items-center gap-1 ml-auto">
                                <span className="text-xs text-muted-foreground">{t.rateLabel}</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className="w-3 h-3 text-yellow-400 fill-current cursor-pointer hover:text-yellow-500"
                                    />
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {report.status === 'acknowledged' && (
                            <div className="flex items-center gap-2 text-xs text-blue-600">
                              <Clock className="w-3 h-3" />
                              <span>{t.acknowledgedByGov}</span>
                            </div>
                          )}

                          {report.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-auto py-1 px-2"
                              onClick={() => handleReportAgain(report)}
                            >
                              {t.reportAgain}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {reports.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">{t.noReportsYet}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={onReportAgain}
                  >
                    {t.report}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tech" className="mt-4">
            <TechShowcase language={user.language} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}