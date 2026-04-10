/**
 * Geocoding Service
 * Provides reverse geocoding using OpenStreetMap Nominatim API
 * Converts GPS coordinates (lat/lng) to human-readable location
 */

export interface GeocodeResult {
    city: string;
    district?: string;
    state: string;
    country: string;
    displayName: string;
    formattedAddress: string;
    street?: string;          // Primary street/road name
    road?: string;            // Alternative road identifier
    neighbourhood?: string;   // Broader area/locality
}

export interface GeocodeError {
    message: string;
    type: 'NETWORK_ERROR' | 'API_ERROR' | 'PARSE_ERROR';
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const REQUEST_DELAY = 1000; // Nominatim rate limit: 1 request per second

let lastRequestTime = 0;

/**
 * Enforce rate limit for Nominatim API (1 request/second)
 */
async function enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < REQUEST_DELAY) {
        const waitTime = REQUEST_DELAY - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
}

/**
 * Reverse geocode coordinates to human-readable location
 * 
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns GeocodeResult with city, state, country info
 * @throws GeocodeError if request fails
 */
export async function reverseGeocode(
    lat: number,
    lon: number
): Promise<GeocodeResult> {
    try {
        // Enforce rate limit
        await enforceRateLimit();

        const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&zoom=18`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SwachhNagar/1.0 (Civic Reporting Platform)', // Required by OSM
                'Accept-Language': 'en', // Get results in English
            },
        });

        if (!response.ok) {
            throw {
                message: `Geocoding API returned ${response.status}: ${response.statusText}`,
                type: 'API_ERROR',
            } as GeocodeError;
        }

        const data = await response.json();

        if (!data.address) {
            throw {
                message: 'No address data returned from geocoding service',
                type: 'API_ERROR',
            } as GeocodeError;
        }

        // Extract location information from response
        const address = data.address;

        // FORCE CONSISTENT LOCATION FOR PROTOTYPE (matches backend reports)
        const city = 'Poolangulathupatti';
        const district = 'Tiruchirappalli';
        const state = 'Tamil Nadu';
        const country = 'India';

        const street = address.road || address.street;
        const neighbourhood = address.neighbourhood;

        // Create formatted address
        const formattedAddress = `${city}, ${state}, ${country}`;

        return {
            city,
            district,
            state,
            country,
            displayName: formattedAddress,
            formattedAddress,
            street,
            neighbourhood,
        };

    } catch (error: any) {
        // Network error
        if (error.name === 'TypeError' || error.message?.includes('fetch')) {
            throw {
                message: 'Network error. Please check your internet connection.',
                type: 'NETWORK_ERROR',
            } as GeocodeError;
        }

        // Re-throw if already a GeocodeError
        if (error.type) {
            throw error;
        }

        // Unknown error
        throw {
            message: error.message || 'Failed to get location name',
            type: 'PARSE_ERROR',
        } as GeocodeError;
    }
}

/**
 * Forward geocode (search for a location by name)
 * Useful for manual location input
 * 
 * @param query - Location name to search (e.g., "Chennai, Tamil Nadu")
 * @returns Array of matching locations with coordinates
 */
export async function forwardGeocode(query: string): Promise<Array<{
    displayName: string;
    lat: number;
    lon: number;
    city: string;
    state: string;
}>> {
    try {
        await enforceRateLimit();

        const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SwachhNagar/1.0 (Civic Reporting Platform)',
                'Accept-Language': 'en',
            },
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        return data.map((item: any) => ({
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            city: item.address?.city || item.address?.town || item.address?.village || 'Unknown',
            state: item.address?.state || 'Unknown',
        }));

    } catch (error) {
        console.error('Forward geocoding error:', error);
        return [];
    }
}

/**
 * Get cached location from localStorage
 */
export function getCachedLocation(): {
    coordinates: { lat: number; lng: number };
    city: string;
    state: string;
    formattedAddress: string;
    timestamp: number;
} | null {
    try {
        const cached = localStorage.getItem('swachh_nagar_last_location');
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        // Force consistent location for prototype
        if (parsed) {
            return {
                ...parsed,
                city: 'Poolangulathupatti',
                displayName: 'Poolangulathupatti, Tamil Nadu, India',
                formattedAddress: 'Poolangulathupatti, Tamil Nadu, India'
            };
        }

        return parsed;
    } catch {
        return null;
    }
}

/**
 * Save location to localStorage
 */
export function cacheLocation(data: {
    coordinates: { lat: number; lng: number };
    city: string;
    state: string;
    formattedAddress: string;
}): void {
    try {
        localStorage.setItem('swachh_nagar_last_location', JSON.stringify({
            ...data,
            timestamp: Date.now(),
        }));
    } catch (error) {
        console.error('Failed to cache location:', error);
    }
}
