import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Types for the application
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
  voiceNoteUrl?: string;
  voiceNoteDuration?: number;
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
  coordinates: { lat: number; lng: number };
  district?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    formattedAddress?: string;
    street?: string;
  };
  language: string;
  isOnline: boolean;
  isManualLocation?: boolean;
}

const DEFAULT_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';

const STORAGE_KEYS = {
    REPORTS: 'swachh_nagar_reports',
    USERS: 'swachh_nagar_users',
    CONFIG: 'swachh_nagar_config',
    API_URL: 'swachh_nagar_api_url',
};

type DataChangeListener = (reports: Report[]) => void;

class DataService {
    private listeners: DataChangeListener[] = [];
    private cache: Report[] = [];
    private pollingInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        this.init();
    }

    private async init() {
        if (typeof window !== 'undefined' || Platform.OS !== 'web') {
            this.loadReportsFromAPI();
            this.startPolling();
        }
    }

    private startPolling(): void {
        this.pollingInterval = setInterval(() => {
            this.loadReportsFromAPI();
        }, 5000);
    }

    stopPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async getApiUrl(): Promise<string> {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEYS.API_URL);
            
            // If nothing saved, or if saved is one of our "reset" keywords, return default
            if (!saved || saved === 'undefined' || saved === 'null') {
                return DEFAULT_API_URL;
            }

            // Standardize: If it's the old vercel URL, we can force it to default local if desired,
            // but for now we'll just return what's saved unless it was explicitly cleared.
            return saved;
        } catch (e) {
            return DEFAULT_API_URL;
        }
    }

    async setApiUrl(url: string): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.API_URL, url);
            this.loadReportsFromAPI();
        } catch (e) {
            console.error('Error saving API URL:', e);
        }
    }

    async loadReportsFromAPI(): Promise<Report[]> {
        try {
            const baseUrl = await this.getApiUrl();
            console.log(`[dataService] Fetching reports from: ${baseUrl}/api/reports`);
            const response = await fetch(`${baseUrl}/api/reports`);
            if (!response.ok) {
                return this.getReports();
            }

            const reports = await response.json();
            this.cache = reports.map((r: any) => ({
                ...r,
                timestamp: new Date(r.timestamp),
                comments: (r.comments || []).map((c: any) => ({
                    ...c,
                    timestamp: new Date(c.timestamp),
                })),
            }));

            await this.saveReports(this.cache);
            this.notifyListeners(this.cache);
            return this.cache;
        } catch (error: any) {
            const baseUrl = await this.getApiUrl();
            console.warn('[dataService] API unreachable at', baseUrl);
            return this.getReports();
        }
    }

    async getReports(): Promise<Report[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.REPORTS);
            if (!data) return [];

            const reports = JSON.parse(data);
            return reports.map((r: any) => ({
                ...r,
                timestamp: new Date(r.timestamp),
                comments: (r.comments || []).map((c: any) => ({
                    ...c,
                    timestamp: new Date(c.timestamp),
                })),
            }));
        } catch (error) {
            return [];
        }
    }

    private async saveReports(reports: Report[]): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
        } catch (error) {
            console.error('Error saving reports:', error);
        }
    }

    async addReport(report: Report): Promise<void> {
        const baseUrl = await this.getApiUrl();
        console.log(`[dataService] Attempting to POST report to: ${baseUrl}/api/reports`);
        
        try {
            const response = await fetch(`${baseUrl}/api/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report),
            });

            if (response.ok) {
                console.log(`✅ [dataService] Report synced successfully with ${baseUrl}`);
                await this.loadReportsFromAPI();
            } else {
                throw new Error(`API returned ${response.status}`);
            }
        } catch (error: any) {
            console.warn(`⚠️ [dataService] Sync failed for ${baseUrl}:`, error.message);
            // Fallback: Save locally
            const reports = await this.getReports();
            reports.push(report);
            await this.saveReports(reports);
            this.notifyListeners(reports);
            
            // RE-THROW to let UI know it was a fallback success, not a server success
            throw error;
        }
    }

    async updateReport(reportId: string, updates: Partial<Report>): Promise<void> {
        try {
            const baseUrl = await this.getApiUrl();
            const response = await fetch(`${baseUrl}/api/reports/${reportId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (response.ok) {
                await this.loadReportsFromAPI();
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            const reports = await this.getReports();
            const index = reports.findIndex((r) => r.id === reportId);
            if (index !== -1) {
                reports[index] = { ...reports[index], ...updates };
                await this.saveReports(reports);
                this.notifyListeners(reports);
            }
        }
    }

    async deleteReport(reportId: string): Promise<void> {
        try {
            const baseUrl = await this.getApiUrl();
            const response = await fetch(`${baseUrl}/api/reports/${reportId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await this.loadReportsFromAPI();
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            const reports = await this.getReports();
            const filtered = reports.filter((r) => r.id !== reportId);
            await this.saveReports(filtered);
            this.notifyListeners(filtered);
        }
    }

    async addComment(reportId: string, comment: Comment): Promise<void> {
        const reports = this.cache.length ? this.cache : await this.getReports();
        const report = reports.find((r) => r.id === reportId);
        if (report) {
            if (!report.comments) report.comments = [];
            report.comments.push(comment);
            await this.updateReport(reportId, { comments: report.comments });
        }
    }

    async toggleUpvote(reportId: string, userId: string): Promise<void> {
        const reports = this.cache.length ? this.cache : await this.getReports();
        const report = reports.find((r) => r.id === reportId);
        if (report) {
            if (report.hasUserUpvoted) {
                report.upvotes--;
                report.hasUserUpvoted = false;
            } else {
                report.upvotes++;
                report.hasUserUpvoted = true;
            }
            await this.updateReport(reportId, {
                upvotes: report.upvotes,
                hasUserUpvoted: report.hasUserUpvoted,
            });
        }
    }

    subscribe(listener: DataChangeListener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    private notifyListeners(reports: Report[]): void {
        this.listeners.forEach((listener) => listener(reports));
    }
}

export const dataService = new DataService();
