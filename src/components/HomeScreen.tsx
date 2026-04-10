import React, { useState } from 'react';
import { Search, ArrowUp, MessageCircle, Flag, X, Mic, Building2, Clock, MapPin, CheckCircle, Trash2, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { motion, AnimatePresence } from 'motion/react';
import { Report, Comment, User } from '../App';
import { translations } from './translations';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MediaCarousel } from './MediaCarousel';
import { FloatingActionButton } from './FloatingActionButton';

interface HomeScreenProps {
  reports: Report[];
  user: User;
  onReportSelect: (report: Report) => void;
  onUpvote: (reportId: string) => void;
  onAddComment: (reportId: string, comment: string) => void;
  selectedReport: Report | null;
  onCloseModal: () => void;
  onReportAgain: () => void;
  onDeleteReport?: (reportId: string) => void;
  onFlag?: (reportId: string) => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export function HomeScreen({
  reports,
  user,
  onReportSelect,
  onUpvote,
  onAddComment,
  selectedReport,
  onCloseModal,
  onReportAgain,
  onDeleteReport,
  onFlag,
  unreadNotificationsCount = 0,
  onOpenNotifications
}: HomeScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showUpvotePopup, setShowUpvotePopup] = useState(false);
  const [showCommentPopup, setShowCommentPopup] = useState(false);
  const [showFlagPopup, setShowFlagPopup] = useState(false);
  const [upvotedReportId, setUpvotedReportId] = useState<string | null>(null);
  const [commentedReportId, setCommentedReportId] = useState<string | null>(null);
  const [flaggedReportId, setFlaggedReportId] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const t = translations[user.language];

  // Helper function for formatting audio duration
  const formatAudioDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  // Helper function to play audio
  const playAudio = (dataUrl: string) => {
    const audio = new Audio(dataUrl);
    audio.play();
  };

  const getDepartmentInfo = (issueType: string) => {
    const departments: Record<string, { name: string; fullName: string; color: string }> = {
      'road': { name: 'PWD', fullName: t.publicWorksDept, color: 'bg-blue-100 text-blue-800' },
      'garbage': { name: 'WMD', fullName: t.wasteManagementDept, color: 'bg-green-100 text-green-800' },
      'streetlight': { name: 'ED', fullName: t.electricalDept, color: 'bg-yellow-100 text-yellow-800' },
      'water': { name: 'WSD', fullName: t.waterSupplyDept, color: 'bg-cyan-100 text-cyan-800' },
      'drainage': { name: 'DD', fullName: t.drainageDept, color: 'bg-purple-100 text-purple-800' },
      'other': { name: 'MC', fullName: t.municipalCorporation, color: 'bg-gray-100 text-gray-800' }
    };
    return departments[issueType.toLowerCase()] || departments.other;
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

  const filteredReports = reports
    .filter(report =>
      report.district === user.district &&
      (searchTerm === '' ||
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.street.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      // Sort by distance then by recency
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

  const handleUpvoteClick = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    onUpvote(reportId);

    // Show upvote confirmation popup
    setUpvotedReportId(reportId);
    setShowUpvotePopup(true);

    // Auto-hide popup after 2 seconds
    setTimeout(() => {
      setShowUpvotePopup(false);
      setUpvotedReportId(null);
    }, 2000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && selectedReport) {
      onAddComment(selectedReport.id, newComment.trim());
      setTempComment(newComment.trim());
      setNewComment('');

      // Show comment confirmation popup
      setCommentedReportId(selectedReport.id);
      setShowCommentPopup(true);

      // Auto-hide popup after 2 seconds
      setTimeout(() => {
        setShowCommentPopup(false);
        setCommentedReportId(null);
        setTempComment('');
      }, 2000);
    }
  };

  const handleFlagReport = (reportId: string) => {
    if (onFlag) {
      onFlag(reportId);
    }

    // Show flag confirmation popup
    setFlaggedReportId(reportId);
    setShowFlagPopup(true);

    // Auto-hide popup after 2 seconds
    setTimeout(() => {
      setShowFlagPopup(false);
      setFlaggedReportId(null);
    }, 2000);
  };

  const handleDeleteReport = () => {
    if (selectedReport) {
      // Call onDeleteReport if provided, otherwise just close modal
      if (onDeleteReport) {
        onDeleteReport(selectedReport.id);
      }
      setShowDeleteConfirm(false);
      onCloseModal();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fcfcfc', fontFamily: "'Plus Jakarta Sans', 'system-ui', sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div className="p-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#064e3b', letterSpacing: '-0.025em' }}>CivicIntel</h1>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>
                {user.location?.city || user.district || t.siliguriMunicipalCorporation}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={onOpenNotifications}
                style={{
                  position: 'relative',
                  padding: '8px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#4b5563',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bell size={20} />
                {unreadNotificationsCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                  }}>
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669' }}>{filteredReports.length} {t.activeReportsCount}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.realTimeUpdates}</div>
              </div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '16px', height: '16px' }} />
            <input
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 48px',
                backgroundColor: '#f8fafc',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                outline: 'none',
                color: '#334155'
              }}
            />
          </div>
        </div>
      </div>

      {/* Reports Feed */}
      <div className="p-4 space-y-6" style={{ backgroundColor: '#fdfdfd' }}>
        {filteredReports.map((report) => (
          <motion.div
            key={report.id}
            className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#f1f5f9] cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300"
            style={{ borderRadius: '32px' }}
            onClick={() => onReportSelect(report)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
          >
            {/* Header: Dept info and Time */}
            <div style={{ padding: '24px 48px 8px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="flex items-center gap-4">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    backgroundColor: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6'
                  }}
                >
                  <Building2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', color: '#94a3b8', lineHeight: 1.2 }}>
                    {getDepartmentInfo(report.type).name} {t.division}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155', lineHeight: 1.4 }}>
                    {report.district}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                {formatTimeAgo(report.timestamp).toUpperCase()}
              </div>
            </div>

            {/* Body: Image Left, Content Right (Pushed to former image position) */}
            <div style={{ display: 'flex', padding: '16px 48px', gap: '32px', marginTop: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Larger Aspect Ratio Image (Left side) */}
              <div style={{
                width: '160px',
                height: '112px',
                flexShrink: 0,
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 8px 20px rgba(0,0,0,0.14)',
                border: '1px solid #f1f5f9'
              }}>
                <ImageWithFallback
                  src={report.imageUrl}
                  alt={report.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {report.isTamperDetected && (
                  <div className="absolute top-1 right-1 bg-orange-500 text-white text-[9px] px-1 py-0.5 rounded-full font-medium">
                    ⚠️
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <h4 style={{ fontWeight: 800, color: '#1e293b', fontSize: '20px', marginBottom: '4px', lineHeight: 1.2 }}>
                  {report.title}
                </h4>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '16px' }}>
                  {report.type}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '6px 16px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#f0fdf4',
                      color: '#166534'
                    }}
                  >
                    {getStatusText(report.status)}
                  </span>
                  {report.priority === 'high' && (
                    <span
                      style={{
                        backgroundColor: '#fff1f2',
                        color: '#e11d48',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '6px 16px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e11d48' }}></span>
                      {t.urgent}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer: Actions */}
            <div style={{ padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', borderTop: '1px solid #f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                <div
                  className="flex items-center gap-2"
                  style={{ color: '#475569', cursor: 'pointer' }}
                  onClick={(e) => handleUpvoteClick(e, report.id)}
                >
                  <ArrowUp style={{ width: '18px', height: '18px', color: report.hasUserUpvoted ? '#059669' : '#94a3b8' }} />
                  <span style={{ fontSize: '14px', fontWeight: 800 }}>{report.upvotes}</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: '#475569' }}>
                  <MessageCircle style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
                  <span style={{ fontSize: '14px', fontWeight: 800 }}>{report.comments.length}</span>
                </div>
              </div>
              <div style={{ color: '#e2e8f0' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredReports.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t.noReportsFound}</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onReportClick={onReportAgain}
        onQuickPhotoClick={onReportAgain}
        isVisible={true}
      />

      {/* Upvote Confirmation Popup */}
      <AnimatePresence>
        {showUpvotePopup && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-20 right-4 z-[9999] bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 max-w-xs"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{t.upvotedSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Confirmation Popup */}
      <AnimatePresence>
        {showCommentPopup && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-36 right-4 z-[9999] bg-blue-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 max-w-xs"
          >
            <MessageCircle className="w-5 h-5" />
            <div className="flex flex-col">
              <span className="font-medium">{t.commentAdded}</span>
              <span className="text-sm opacity-90 truncate">{tempComment}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flag Confirmation Popup */}
      <AnimatePresence>
        {showFlagPopup && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-52 right-4 z-[9999] bg-orange-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 max-w-xs"
          >
            <Flag className="w-5 h-5" />
            <span className="font-medium">{t.flaggedSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Report Detail Modal (without backdrop) */}
      {selectedReport && (
        <motion.div
          className="fixed inset-0 max-w-sm mx-auto bg-white z-[10000] overflow-y-auto"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 500 }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">{selectedReport.title}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {selectedReport.ward} • {user.location?.street || selectedReport.street} • {formatTimeAgo(selectedReport.timestamp)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 p-1 h-8 w-8"
              onClick={onCloseModal}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Image section - REDUCED SIZE for better UX */}
            <div className="relative h-48 overflow-hidden group">
              <ImageWithFallback
                src={selectedReport.imageUrl}
                alt={selectedReport.title}
                className="w-full h-full"
              />
              {selectedReport.isTamperDetected && (
                <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                  {t.tamperDetected}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge className={`text-xs ${getStatusColor(selectedReport.status)}`}>
                  {getStatusText(selectedReport.status)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(selectedReport.timestamp)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-2">
                {selectedReport.ward} • {user.location?.street || selectedReport.street} • {selectedReport.distance}km
              </p>

              <Badge variant="secondary" className="text-xs mb-3">
                {selectedReport.aiTag} — {selectedReport.aiConfidence}% {t.confidence}
              </Badge>

              {/* Department Routing Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">{t.departmentAssignment}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-blue-800">
                    <strong>{getDepartmentInfo(selectedReport.type).name}</strong> - {getDepartmentInfo(selectedReport.type).fullName}
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span className="text-xs text-blue-700">
                      {t.estimatedResponse} 24-48 {t.hours || 'hours'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm mb-4">{selectedReport.description}</p>

              {/* Voice note - only show if exists */}
              {selectedReport.voiceNoteUrl && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mic className="w-4 h-4" />
                    <span>{t.voiceNote} ({formatAudioDuration(selectedReport.voiceNoteDuration || 0)})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 ml-auto"
                      onClick={() => playAudio(selectedReport.voiceNoteUrl!)}
                    >
                      {t.play}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <motion.button
                className={`flex items-center gap-1 px-3 py-2 rounded text-sm ${selectedReport.hasUserUpvoted
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
                  }`}
                onClick={(e) => {
                  e.stopPropagation();  // Prevent event bubbling to card behind modal
                  onUpvote(selectedReport.id);
                }}
                whileTap={{ scale: 1.05 }}
              >
                <ArrowUp className="w-4 h-4" />
                {selectedReport.upvotes} {t.upvote}
              </motion.button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleFlagReport(selectedReport.id);
                }}
              >
                <Flag className="w-4 h-4 mr-1" />
                {t.flag}
              </Button>

              <Button
                variant="outline"
                size="sm"
                style={{ color: '#dc2626', borderColor: '#fecaca' }}
                className="hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-1" style={{ color: '#dc2626' }} />
                {t.delete}
              </Button>
            </div>

            {/* Comments */}
            <div>
              <h4 className="font-medium mb-3">{t.comments}</h4>

              <div className="space-y-3 mb-4">
                {selectedReport.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>

              {/* Add comment */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <Textarea
                  placeholder={t.addComment}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 min-h-0 h-10"
                />
                <Button type="submit" size="sm" disabled={!newComment.trim()}>
                  {t.postComment}
                </Button>
              </form>
            </div>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedReport && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20000 }}
            onClick={() => setShowDeleteConfirm(false)}
          />

          {/* Dialog */}
          <div
            className="fixed bg-white rounded-lg shadow-2xl p-6"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20001,
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">{t.deleteConfirmTitle}</h3>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              {t.deleteConfirmMessage.replace('this report', `"${selectedReport.title}"`)}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t.cancelAction}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteReport}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t.delete}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

