import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { MapPin, Languages, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { translations, Language } from './translations';
import { useGeolocation } from '../hooks/useGeolocation';
import { reverseGeocode, getCachedLocation, cacheLocation, type GeocodeResult } from '../services/geocodingService';

const languageOptions = [
  { value: 'english', label: 'English' },
  { value: 'tamil', label: 'தமிழ் (Tamil)' },
  { value: 'hindi', label: 'हिन्दी (Hindi)' },
  { value: 'malayalam', label: 'മലയാളം (Malayalam)' },
  { value: 'telugu', label: 'తెలుగు (Telugu)' }
];

interface OnboardingScreenProps {
  onComplete: (district: string, coordinates: { lat: number; lng: number }, language: Language) => void;
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

interface LocationData {
  coordinates: { lat: number; lng: number };
  city: string;
  state: string;
  formattedAddress: string;
  fromCache?: boolean;
}

export function OnboardingScreen({ onComplete, currentLanguage, onLanguageChange }: OnboardingScreenProps) {
  const [step, setStep] = useState<'language' | 'location'>('language');
  const [locationStep, setLocationStep] = useState<'request' | 'detecting' | 'detected' | 'error' | 'manual'>('request');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualCity, setManualCity] = useState('');
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  const t = translations[currentLanguage];

  // Use geolocation hook (don't auto-start)
  const {
    position,
    error: geoError,
    loading: geoLoading,
    permissionStatus,
    refresh
  } = useGeolocation({ watch: false });

  // Check for cached location on mount
  useEffect(() => {
    const cached = getCachedLocation();
    if (cached && step === 'location') {
      setLocationData({ ...cached, fromCache: true });
      setLocationStep('detected');
    }
  }, [step]);

  // Handle geolocation position update
  useEffect(() => {
    if (position && locationStep === 'detecting') {
      setIsGeocodingLoading(true);

      // Reverse geocode the coordinates
      reverseGeocode(position.latitude, position.longitude)
        .then((result: GeocodeResult) => {
          const data: LocationData = {
            coordinates: {
              lat: position.latitude,
              lng: position.longitude
            },
            city: result.city,
            state: result.state,
            formattedAddress: result.formattedAddress
          };

          setLocationData(data);
          cacheLocation(data); // Save to localStorage
          setLocationStep('detected');
          setLocationError(null);
        })
        .catch((error) => {
          // Geocoding failed, but we have coordinates - use them anyway
          const data: LocationData = {
            coordinates: {
              lat: position.latitude,
              lng: position.longitude
            },
            city: 'Unknown',
            state: 'Unknown',
            formattedAddress: `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`
          };

          setLocationData(data);
          setLocationStep('detected');
          setLocationError('Could not get location name. Using coordinates only.');
        })
        .finally(() => {
          setIsGeocodingLoading(false);
        });
    }
  }, [position, locationStep]);

  // Handle geolocation errors
  useEffect(() => {
    if (geoError) {
      let message = '';

      switch (geoError.type) {
        case 'PERMISSION_DENIED':
          message = t.locationAccessRequired;
          break;
        case 'POSITION_UNAVAILABLE':
          message = t.locationUnavailable;
          break;
        case 'TIMEOUT':
          message = t.locationTimeout;
          break;
        default:
          message = t.locationErrorGeneral;
      }

      setLocationError(message);

      // Only switch to error screen if we were waiting for it
      // Don't interrupt user if they are entering manually or already succeeded
      setLocationStep(current => {
        if (current === 'request' || current === 'detecting') {
          return 'error';
        }
        return current;
      });
    }
  }, [geoError, t]);

  const handleLanguageSelect = (language: string) => {
    onLanguageChange(language as Language);
    setStep('location');
  };

  const detectRealLocation = () => {
    setLocationStep('detecting');
    setLocationError(null);
    refresh(); // Trigger geolocation
  };

  const handleUseDetectedLocation = () => {
    if (locationData) {
      onComplete(locationData.city, locationData.coordinates, currentLanguage);
    }
  };

  const handleManualLocation = () => {
    // Use the entered city name
    if (manualCity.trim()) {
      // For manual entry, we'll use a default coordinate (can be enhanced)
      onComplete(manualCity.trim(), { lat: 0, lng: 0 }, currentLanguage);
    }
  };

  const handleRetry = () => {
    setLocationError(null);
    detectRealLocation();
  };

  // Language selection screen
  if (step === 'language') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            {/* Tricolor border */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-white to-green-600 p-1">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="CivicIntel Logo"
                  className="w-14 h-14 object-contain rounded-full"
                />
              </div>
            </div>
          </div>
          <h1 className="text-xl font-bold text-primary">CivicIntel</h1>
          <p className="text-muted-foreground">
            {t.selectLanguage}
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          {languageOptions.map((option) => (
            <Button
              key={option.value}
              variant={currentLanguage === option.value ? "default" : "outline"}
              className="w-full justify-start h-auto py-3"
              onClick={() => handleLanguageSelect(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <Button
          className="mt-8 w-full max-w-sm"
          onClick={() => setStep('location')}
        >
          {t.continue}
        </Button>
      </div>
    );
  }

  // Location screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="relative w-20 h-20 mx-auto mb-4">
          {/* Tricolor border */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-white to-green-600 p-1">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <img
                src="/logo.png"
                alt="CivicIntel Logo"
                className="w-14 h-14 object-contain rounded-full"
              />
            </div>
          </div>
        </div>
        <h1 className="text-2xl mb-2 text-primary">CivicIntel</h1>
        <p className="text-sm text-muted-foreground">
          Digital Civic Reporting Platform
        </p>
      </div>

      {/* Request Permission State */}
      {locationStep === 'request' && (
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl mb-2">{t.requestLocation}</h2>
            <p className="text-sm text-muted-foreground">
              {t.allowLocation}
            </p>
          </div>

          <Button
            className="w-full"
            onClick={detectRealLocation}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {t.requestLocation}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocationStep('manual')}
          >
            {t.enterManuallyInstead}
          </Button>
        </div>
      )}

      {/* Detecting State */}
      {locationStep === 'detecting' && (
        <div className="text-center w-full max-w-sm">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium mb-1">
            {t.detectingLocation}
          </p>
          <p className="text-sm text-muted-foreground">
            {isGeocodingLoading ? t.gettingLocationName : t.thisMayTakeFewSeconds}
          </p>
        </div>
      )}

      {/* Detected State */}
      {locationStep === 'detected' && locationData && (
        <div className="w-full max-w-sm space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-green-600" />
              <p className="font-semibold text-green-900">
                {locationData.fromCache ? t.usingSavedLocation : t.locationDetected}
              </p>
            </div>

            <div className="space-y-2 text-sm text-green-800">
              <div>
                <strong>{t.cityLabel}</strong> {locationData.city}
                {(locationData.city !== locationData.formattedAddress.split(',')[0]) && (
                  <span className="text-xs ml-2 opacity-70">({locationData.formattedAddress.split(',')[0]})</span>
                )}
              </div>
              <div>
                <strong>{t.stateLabel}</strong> {locationData.state}
              </div>
              <div className="text-xs opacity-75">
                📍 {locationData.coordinates.lat.toFixed(6)}, {locationData.coordinates.lng.toFixed(6)}
              </div>
              {locationData.fromCache && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 h-auto p-0 mt-2"
                  onClick={detectRealLocation}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  {t.refreshLocation}
                </Button>
              )}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleUseDetectedLocation}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {t.useThisLocation}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocationStep('manual')}
          >
            {t.enterDifferentLocation}
          </Button>
        </div>
      )}

      {/* Error State */}
      {locationStep === 'error' && (
        <div className="w-full max-w-sm space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="font-semibold text-red-900">{t.locationError}</p>
            </div>
            <p className="text-sm text-red-800">{locationError}</p>
          </div>

          <Button
            className="w-full"
            onClick={handleRetry}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t.retry}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocationStep('manual')}
          >
            {t.enterManuallyInstead}
          </Button>
        </div>
      )}

      {/* Manual Entry State */}
      {locationStep === 'manual' && (
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold mb-1">{t.enterYourLocation}</h2>
            <p className="text-sm text-muted-foreground">
              {t.typeCityOrArea}
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">{t.cityAreaLabel}</span>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t.cityPlaceholder}
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualCity.trim()) {
                  handleManualLocation();
                }
              }}
            />
          </label>

          <Button
            className="w-full"
            onClick={handleManualLocation}
            disabled={!manualCity.trim()}
          >
            {t.continue}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocationStep('request')}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {t.useGpsInstead}
          </Button>
        </div>
      )}
    </div>
  );
}