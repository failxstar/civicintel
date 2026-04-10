import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { translations, Language } from './translations';

export interface Notification {
    id: string;
    reportId: string;
    type: 'status_change';
    category?: string;
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
}

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    language: Language;
    onNotificationClick: (reportId: string, notificationId: string) => void;
    onMarkAllRead: () => void;
}

export function NotificationCenter({
    isOpen,
    onClose,
    notifications,
    language,
    onNotificationClick,
    onMarkAllRead
}: NotificationCenterProps) {
    const t = translations[language];

    const formatTimeAgo = (timestamp: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return timestamp.toLocaleDateString();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md"
                        style={{ zIndex: 2147483646 }}
                    />

                    {/* Tray */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col"
                        style={{ zIndex: 2147483647 }}
                    >
                        {/* Header */}
                        <div className="p-6 pt-10 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{t.notifications}</h2>
                                    <p className="text-xs text-gray-500">{notifications.filter(n => !n.isRead).length} unread</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {notifications.some(n => !n.isRead) && (
                                    <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="text-xs">
                                        Mark all read
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                                    <X size={20} />
                                </Button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 pt-6 space-y-4">
                            {notifications.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                                        <Bell size={32} />
                                    </div>
                                    <h3 className="text-gray-900 font-semibold mb-1">{t.noNotifications}</h3>
                                    <p className="text-sm text-gray-500">We'll alert you when there's an update on your reports.</p>
                                </div>
                            ) : (
                                notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map((notification) => (
                                    <motion.div
                                        key={notification.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer group ${notification.isRead
                                            ? 'bg-white border-gray-100'
                                            : 'bg-primary/5 border-primary/10 ring-1 ring-primary/5'
                                            }`}
                                        onClick={() => onNotificationClick(notification.reportId, notification.id)}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${notification.type === 'status_change' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {notification.type === 'status_change' ? <CheckCircle size={20} /> : <Bell size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className="font-bold text-gray-900 text-sm">{notification.title}</h4>
                                                    <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap pt-1">
                                                        {formatTimeAgo(notification.timestamp)}
                                                    </span>
                                                </div>
                                                {notification.category && (
                                                    <div className="mb-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wide">
                                                            {notification.category}
                                                        </span>
                                                    </div>
                                                )}
                                                <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center text-[11px] font-bold text-primary gap-1 group-hover:gap-2 transition-all">
                                                    {t.viewDetails} <ArrowRight size={12} />
                                                </div>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
