import type { Stop } from '../types/bus';

export interface LocationResult {
  lat: number;
  lng: number;
  accuracy?: number;
}

export type GeoErrorType = 'PERMISSION_DENIED' | 'TIMEOUT' | 'UNAVAILABLE' | 'UNSUPPORTED' | 'UNKNOWN';

export interface GeoError {
  type: GeoErrorType;
  messageHu: string;
  messageRo: string;
}

/**
 * Robust geolocation fetcher with automatic high-accuracy to low-accuracy fallback
 * specifically designed for mobile browsers & iframes.
 */
export async function getAccurateUserLocation(): Promise<{ location: LocationResult | null; error: GeoError | null }> {
  if (typeof window === 'undefined' || !navigator?.geolocation) {
    return {
      location: null,
      error: {
        type: 'UNSUPPORTED',
        messageHu: 'A böngésző nem támogatja a helymeghatározást.',
        messageRo: 'Browserul nu acceptă geolocalizarea.',
      },
    };
  }

  // Attempt 1: Try high accuracy (GPS) first with 6s timeout
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 30000,
      });
    });

    return {
      location: {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      },
      error: null,
    };
  } catch (err: any) {
    // If user explicitly denied permission, don't retry, fail with clear message
    if (err && err.code === 1) {
      return {
        location: null,
        error: {
          type: 'PERMISSION_DENIED',
          messageHu: 'A helymeghatározási engedély elutasítva. Kérjük, engedélyezd a böngésző beállításaiban!',
          messageRo: 'Permisiunea de localizare a fost refuzată. Activează din setările browserului!',
        },
      };
    }

    // Attempt 2: Fallback to fast low-accuracy (Wi-Fi / Cell tower / cache) with 10s timeout
    try {
      const fallbackPos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 min cache acceptable
        });
      });

      return {
        location: {
          lat: fallbackPos.coords.latitude,
          lng: fallbackPos.coords.longitude,
          accuracy: fallbackPos.coords.accuracy,
        },
        error: null,
      };
    } catch (fallbackErr: any) {
      if (fallbackErr && fallbackErr.code === 1) {
        return {
          location: null,
          error: {
            type: 'PERMISSION_DENIED',
            messageHu: 'A helymeghatározási engedély elutasítva. Kérjük, engedélyezd a böngésző beállításaiban!',
            messageRo: 'Permisiunea de localizare a fost refuzată. Activează din setările browserului!',
          },
        };
      }

      return {
        location: null,
        error: {
          type: 'TIMEOUT',
          messageHu: 'Nem sikerült lekérni a pozíciót. Ellenőrizd a GPS / Helymeghatározás bekapcsolását a telefonodon!',
          messageRo: 'Nu s-a putut obține locația. Verifică dacă GPS-ul este activat pe telefon!',
        },
      };
    }
  }
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
 * Finds the nearest stop and returns it with the distance in meters
 */
export function findNearestStopWithDistance(
  userLoc: { lat: number; lng: number },
  stops: Stop[],
): { stop: Stop; distanceMeters: number } | null {
  if (!stops.length) return null;

  let closest: Stop = stops[0];
  let minDistance = Infinity;

  for (const s of stops) {
    const dist = calculateDistanceMeters(userLoc.lat, userLoc.lng, s.lat, s.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = s;
    }
  }

  return {
    stop: closest,
    distanceMeters: minDistance,
  };
}
