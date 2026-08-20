import type { Stop } from '../types/bus';

export interface LocationResult {
  lat: number;
  lng: number;
  accuracy?: number;
}

export type GeoErrorType = 'PERMISSION_DENIED' | 'TIMEOUT' | 'UNAVAILABLE' | 'UNSUPPORTED' | 'UNKNOWN' | 'INSECURE';

export interface GeoError {
  type: GeoErrorType;
  messageHu: string;
  messageRo: string;
}

function isValidCoordinate(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

function getErrorObject(err: GeolocationPositionError | any): GeoError {
  if (err && err.code === 1) {
    return {
      type: 'PERMISSION_DENIED',
      messageHu: 'A helymeghatározás nincs engedélyezve. Engedélyezd a böngésző beállításaiban, majd próbáld újra.',
      messageRo: 'Locația nu este permisă. Activează din setările browserului și încearcă din nou.',
    };
  }
  if (err && err.code === 2) {
    return {
      type: 'UNAVAILABLE',
      messageHu: 'A készülék jelenleg nem tudta meghatározni a pontos helyzeted.',
      messageRo: 'Dispozitivul nu a putut determina locația exactă.',
    };
  }
  if (err && err.code === 3) {
    return {
      type: 'TIMEOUT',
      messageHu: 'A helymeghatározás túl sokáig tartott. Próbáld újra.',
      messageRo: 'Determinarea locației a durat prea mult. Încearcă din nou.',
    };
  }
  return {
    type: 'UNKNOWN',
    messageHu: 'Ismeretlen hiba történt a helymeghatározás során.',
    messageRo: 'Eroare necunoscută la obținerea locației.',
  };
}

/**
 * Robust geolocation fetcher with automatic high-accuracy to low-accuracy fallback
 * specifically designed for mobile browsers & iframes.
 */
export async function getAccurateUserLocation(): Promise<{ location: LocationResult | null; error: GeoError | null }> {
  if (typeof window === 'undefined') {
    return { location: null, error: getErrorObject({ code: 2 }) };
  }
  
  if (!navigator?.geolocation) {
    return {
      location: null,
      error: {
        type: 'UNSUPPORTED',
        messageHu: 'A böngésző nem támogatja a helymeghatározást.',
        messageRo: 'Browserul nu acceptă geolocalizarea.',
      },
    };
  }

  if (window.isSecureContext === false) {
    return {
      location: null,
      error: {
        type: 'INSECURE',
        messageHu: 'A helymeghatározás csak biztonságos (HTTPS) kapcsolaton keresztül érhető el.',
        messageRo: 'Locația este disponibilă doar printr-o conexiune securizată (HTTPS).',
      },
    };
  }

  // Promise wrapper to allow timeout and better error handling
  const getPos = (options: PositionOptions) => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  // Attempt 1: Try high accuracy (GPS) first with a reasonable timeout.
  // 15 seconds allows time for the permission prompt and initial GPS fix.
  try {
    const pos = await getPos({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000, // 10s maximum cache
    });

    if (isValidCoordinate(pos.coords.latitude, pos.coords.longitude)) {
      return {
        location: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        },
        error: null,
      };
    }
  } catch (err: any) {
    // If user explicitly denied permission, don't retry, fail with clear message
    if (err && err.code === 1) {
      return { location: null, error: getErrorObject(err) };
    }
    
    // Attempt 2: Fallback to fast low-accuracy (Wi-Fi / Cell tower / cache) with a longer timeout
    try {
      const fallbackPos = await getPos({
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 300000, // 5 min cache acceptable for fallback
      });

      if (isValidCoordinate(fallbackPos.coords.latitude, fallbackPos.coords.longitude)) {
        return {
          location: {
            lat: fallbackPos.coords.latitude,
            lng: fallbackPos.coords.longitude,
            accuracy: fallbackPos.coords.accuracy,
          },
          error: null,
        };
      }
    } catch (fallbackErr: any) {
      return { location: null, error: getErrorObject(fallbackErr) };
    }
  }

  return { 
    location: null, 
    error: {
      type: 'UNKNOWN',
      messageHu: 'Nem sikerült érvényes koordinátákat lekérni.',
      messageRo: 'Nu s-au putut obține coordonate valide.'
    }
  };
}

/**
 * Calculates distance in meters between two lat/lng coordinates (Haversine formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Finds the nearest stops and returns them sorted by distance.
 */
export function findNearbyStops(
  userLoc: { lat: number; lng: number },
  stops: Stop[],
): Array<{ stop: Stop; distanceMeters: number }> {
  if (!stops.length) return [];
  
  const stopsWithDistances = stops.map(s => {
    return {
      stop: s,
      distanceMeters: calculateDistanceMeters(userLoc.lat, userLoc.lng, s.lat, s.lng)
    };
  });

  stopsWithDistances.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return stopsWithDistances;
}

/**
 * For backwards compatibility with the previous signature, returns the single nearest stop.
 */
export function findNearestStopWithDistance(
  userLoc: { lat: number; lng: number },
  stops: Stop[],
): { stop: Stop; distanceMeters: number } | null {
  const nearby = findNearbyStops(userLoc, stops);
  if (nearby.length === 0) return null;
  return nearby[0];
}
