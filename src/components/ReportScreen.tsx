import React, { useState, useEffect } from 'react';
import { Camera, MapPin, AlertCircle, X, Brain, AlertTriangle, Navigation, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { motion } from 'motion/react';
import { Report, User } from '../App';
import { translations } from './translations';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { analyzeImage, AIAnalysisResult } from '../utils/aiClassification';
import { VoiceRecorder } from './VoiceRecorder';
import { TaggedLocation } from './LiveLocationMap';
import { LocationPickerMap } from './LocationPickerMap';

interface ReportScreenProps {
  user: User;
  onSubmit: (report: Omit<Report, 'id' | 'timestamp' | 'upvotes' | 'comments' | 'distance' | 'hasUserUpvoted'>) => void;
  onCancel: () => void;
}

const issueTypes = [
  { value: 'road', aiTag: 'Road Issue' },
  { value: 'garbage', aiTag: 'Garbage' },
  { value: 'water', aiTag: 'Water Issue' },
  { value: 'streetlight', aiTag: 'Streetlight' },
  { value: 'drainage', aiTag: 'Drainage' },
  { value: 'other', aiTag: 'Other' }
];

export function ReportScreen({ user, onSubmit, onCancel }: ReportScreenProps) {
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [issueType, setIssueType] = useState<string>('');
  const [severity, setSeverity] = useState<number[]>([5]);
  const [description, setDescription] = useState<string>('');
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);

  const t = translations[user.language];

  // Initialize selectedMapLocation with user's current GPS coordinates
  useEffect(() => {
    if (user.coordinates && !selectedMapLocation) {
      setSelectedMapLocation({
        lat: user.coordinates.lat,
        lng: user.coordinates.lng,
        address: user.location?.street || undefined
      });
    }
  }, [user.coordinates, user.location?.street, selectedMapLocation]);

  // Trigger AI analysis when photo and description are available
  useEffect(() => {
    if (capturedPhoto && description.length > 3) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        const analysis = analyzeImage(capturedPhoto, description, {
          district: user.district || '',
          ward: user.district || '',
          coordinates: user.coordinates
        });
        setAiAnalysis(analysis);
        setIssueType(analysis.primaryIssue.toLowerCase());
        setSeverity([analysis.severity]);
        setIsAnalyzing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [capturedPhoto, description, user]);

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedPhoto(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMapLocation) {
      alert(`⚠️ ${t.locationRequiredMessage}`);
      return;
    }
    if (!capturedPhoto || !issueType) return;

    const selectedIssueType = issueTypes.find(type => type.value === issueType);

    const newReport: Omit<Report, 'id' | 'timestamp' | 'upvotes' | 'comments' | 'distance' | 'hasUserUpvoted'> = {
      title: aiAnalysis?.primaryIssue
        ? `${aiAnalysis.primaryIssue} ${t.issueDetected}`
        : `${selectedIssueType?.aiTag} ${t.reported}`,
      description: description || `${selectedIssueType?.aiTag} ${t.reported} via CivicIntel`,
      imageUrl: capturedPhoto,
      district: user.district || '',
      ward: user.district || '',
      street: selectedMapLocation.address || user.location?.street || user.district || t.unknownStreet,
      coordinates: {
        lat: selectedMapLocation.lat,
        lng: selectedMapLocation.lng
      },
      aiTag: aiAnalysis?.primaryIssue || selectedIssueType?.aiTag || 'Unknown',
      aiConfidence: aiAnalysis?.confidence || Math.floor(Math.random() * 15) + 85,
      status: 'pending',
      severity: aiAnalysis?.severity || severity[0],
      type: issueType,
      userId: 'current-user',
      priority: (aiAnalysis?.priority === 'critical' ? 'high' : aiAnalysis?.priority) || (severity[0] >= 7 ? 'high' : severity[0] >= 4 ? 'medium' : 'low'),
      voiceNoteUrl: audioBlob ? await blobToBase64(audioBlob) : undefined,
      voiceNoteDuration: audioDuration || undefined
    };

    onSubmit(newReport);
  };

  async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b sticky top-0 z-40" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div className="flex items-center justify-between p-4 pt-6">
          <Button variant="ghost" size="sm" onClick={onCancel} style={{ color: '#64748b', fontWeight: 600 }}>
            <X className="w-4 h-4 mr-2" />
            {t.cancel}
          </Button>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#064e3b', letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t.report}
          </h1>
          <div style={{ width: '80px' }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div>
          <label className="block text-sm mb-2">{t.capturePhoto} *</label>
          <div className="relative">
            {!capturedPhoto ? (
              <motion.div
                className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                onClick={handleCameraCapture}
                whileTap={{ scale: 0.98 }}
              >
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">{t.capturePhoto}</p>
                <p className="text-xs text-gray-400 mt-1">{t.cameraOrGallery}</p>
              </motion.div>
            ) : (
              <div className="relative w-full h-[300px] overflow-hidden rounded-lg">
                <ImageWithFallback src={capturedPhoto} alt="Captured photo" className="w-full h-full" />
                <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setCapturedPhoto('')}>
                  <X className="w-4 h-4" />
                </Button>
                <Button type="button" variant="secondary" size="sm" className="absolute bottom-2 right-2" onClick={handleCameraCapture}>
                  <Camera className="w-4 h-4 mr-1" />
                  {t.changePhoto}
                </Button>
              </div>
            )}
          </div>
        </div>

        {(aiAnalysis || isAnalyzing) && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">{t.aiAnalysis}</h3>
              {isAnalyzing && <div className="animate-pulse text-sm text-blue-600">{t.processing}</div>}
            </div>

            {isAnalyzing ? (
              <div className="space-y-2">
                <div className="animate-pulse bg-blue-200 h-4 rounded w-3/4"></div>
                <div className="animate-pulse bg-blue-200 h-4 rounded w-1/2"></div>
              </div>
            ) : aiAnalysis && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {aiAnalysis.priority.toUpperCase()} {t.priorityLabel}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {aiAnalysis.confidence}% {t.confidence || 'confidence'}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>{t.detectedLabel}</strong> {aiAnalysis.primaryIssue}</p>
                  <p><strong>{t.departmentLabel}</strong> {aiAnalysis.suggestedDepartment}</p>
                  <p><strong>{t.estResolutionLabel}</strong> {aiAnalysis.estimatedResolutionTime}</p>
                </div>
                {aiAnalysis.riskFactors.length > 0 && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <strong>{t.riskFactorsLabel}</strong>
                      <ul className="text-gray-600 mt-1">
                        {aiAnalysis.riskFactors.map((risk, index) => <li key={index}>• {risk}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm mb-2 font-medium">📍 {t.location} *</label>
          {!showLocationPicker ? (
            <div className="space-y-3">
              <div className={`rounded-lg p-4 space-y-2 ${selectedMapLocation ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className={`w-4 h-4 ${selectedMapLocation ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className="text-gray-700">{t.location}:</span>
                  <span className="font-mono text-xs">
                    {selectedMapLocation ? `${selectedMapLocation.lat.toFixed(6)}, ${selectedMapLocation.lng.toFixed(6)}` : t.notSelected}
                  </span>
                </div>
                {selectedMapLocation?.address && (
                  <div className="flex items-center gap-1 pt-2 border-t border-green-200">
                    <Target className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">📌 {selectedMapLocation.address}</span>
                  </div>
                )}
                {!selectedMapLocation && (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t.locationRequiredMessage}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant={selectedMapLocation ? "outline" : "default"} className="flex-1" onClick={() => setShowLocationPicker(true)}>
                  <Navigation className="w-4 h-4 mr-2" />
                  {selectedMapLocation ? t.changeLocation : t.selectLocationOnMap}
                </Button>
                {selectedMapLocation && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedMapLocation(null)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <LocationPickerMap
              userLocation={user.coordinates}
              onLocationSelect={(location) => {
                setSelectedMapLocation(location);
                setShowLocationPicker(false);
              }}
              onCancel={() => setShowLocationPicker(false)}
            />
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">{t.issueType} *</label>
          <Select value={issueType} onValueChange={setIssueType}>
            <SelectTrigger><SelectValue placeholder={`${t.issueType}...`} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="road">{t.road}</SelectItem>
              <SelectItem value="garbage">{t.garbage}</SelectItem>
              <SelectItem value="water">{t.water}</SelectItem>
              <SelectItem value="streetlight">{t.streetlight}</SelectItem>
              <SelectItem value="drainage">{t.drainage}</SelectItem>
              <SelectItem value="other">{t.other}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm mb-2">{t.severity}: {severity[0]}/10</label>
          <Slider value={severity} onValueChange={setSeverity} max={10} min={1} step={1} className="w-full" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{t.low}</span>
            <span>{t.high}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2">
            {t.description} {!aiAnalysis && capturedPhoto && <span className="text-blue-600 text-xs">• {t.addDescriptionForAi}</span>}
          </label>
          <Textarea placeholder={`${t.description}...`} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>

        <div>
          <label className="block text-sm mb-2">{t.recordVoiceNote} ({t.optional})</label>
          <VoiceRecorder onRecordingComplete={(hasRecording, blob, duration) => {
            setHasVoiceNote(hasRecording);
            setAudioBlob(blob || null);
            setAudioDuration(duration || 0);
          }} language={user.language} />
        </div>

        <Button type="submit" className="w-full" disabled={!capturedPhoto || !issueType}>
          {user.isOnline ? t.submit : `${t.submit} (${t.savedOffline})`}
        </Button>
      </form>
    </div>
  );
}
