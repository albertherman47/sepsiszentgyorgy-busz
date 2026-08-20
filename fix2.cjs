const fs = require('fs');

let tp = fs.readFileSync('src/utils/tripPlanner.ts', 'utf8');
tp = tp.replace('for (const route of routes) {', 'for (const route of routes || []) {');
tp = tp.replace('const activeRoutes = routesByStop.get(state.stopId) || [];', 'const activeRoutes = routesByStop.get(state.stopId!) || [];');
fs.writeFileSync('src/utils/tripPlanner.ts', tp);

let tests = `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAccurateUserLocation, calculateDistanceMeters, findNearbyStops } from '../geoUtils';

describe('geoUtils', () => {
  describe('calculateDistanceMeters', () => {
    it('calculates distance correctly', () => {
      // Sepsiszentgyörgy roughly
      const d = calculateDistanceMeters(45.86, 25.79, 45.87, 25.80);
      expect(d).toBeGreaterThan(1000);
      expect(d).toBeLessThan(1500);
      
      const dZero = calculateDistanceMeters(45.86, 25.79, 45.86, 25.79);
      expect(dZero).toBe(0);
    });
  });

  describe('findNearbyStops', () => {
    it('returns empty array if no stops', () => {
      expect(findNearbyStops({ lat: 45, lng: 25 }, [])).toEqual([]);
    });

    it('returns sorted stops by distance', () => {
      const stops: any[] = [
        { id: '1', lat: 45.861, lng: 25.791 },
        { id: '2', lat: 45.860, lng: 25.790 },
        { id: '3', lat: 45.865, lng: 25.795 },
      ];
      
      const user = { lat: 45.860, lng: 25.790 };
      const res = findNearbyStops(user, stops);
      
      expect(res).toHaveLength(3);
      expect(res[0].stop.id).toBe('2'); // distance 0
      expect(res[0].distanceMeters).toBe(0);
      expect(res[1].stop.id).toBe('1');
      expect(res[2].stop.id).toBe('3');
    });
  });

  describe('getAccurateUserLocation', () => {

    beforeEach(() => {
      vi.resetModules();
      vi.clearAllMocks();
    });

    it('returns UNSUPPORTED if geolocation is missing', async () => {
      vi.stubGlobal('navigator', {});
      vi.stubGlobal('window', {});
      const { error } = await getAccurateUserLocation();
      expect(error?.type).toBe('UNSUPPORTED');
    });

    it('returns INSECURE if not secure context', async () => {
      vi.stubGlobal('navigator', { geolocation: {} });
      vi.stubGlobal('window', { isSecureContext: false });

      const { error } = await getAccurateUserLocation();
      expect(error?.type).toBe('INSECURE');
    });

    it('returns PERMISSION_DENIED on permission error', async () => {
      vi.stubGlobal('window', { isSecureContext: true });
      const mockGeolocation = {
        getCurrentPosition: vi.fn((_success, err) => {
          err({ code: 1, message: 'User denied Geolocation' });
        })
      };
      vi.stubGlobal('navigator', { geolocation: mockGeolocation });

      const { error } = await getAccurateUserLocation();
      expect(error?.type).toBe('PERMISSION_DENIED');
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    it('falls back to low accuracy if high accuracy fails with timeout', async () => {
      vi.stubGlobal('window', { isSecureContext: true });
      
      let attempts = 0;
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, err, _options) => {
          attempts++;
          if (attempts === 1) {
            // First attempt timeout
            err({ code: 3, message: 'Timeout' });
          } else {
            // Second attempt success
            success({
              coords: { latitude: 45, longitude: 25, accuracy: 100 }
            });
          }
        })
      };
      
      vi.stubGlobal('navigator', { geolocation: mockGeolocation });

      const { location, error } = await getAccurateUserLocation();
      expect(error).toBeNull();
      expect(location?.lat).toBe(45);
      expect(location?.lng).toBe(25);
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
      expect(mockGeolocation.getCurrentPosition.mock.calls[0][2].enableHighAccuracy).toBe(true);
      expect(mockGeolocation.getCurrentPosition.mock.calls[1][2].enableHighAccuracy).toBe(false);
    });

    it('handles invalid coordinates', async () => {
      vi.stubGlobal('window', { isSecureContext: true });
      
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, _err) => {
          success({
            coords: { latitude: NaN, longitude: 25, accuracy: 100 }
          });
        })
      };
      
      vi.stubGlobal('navigator', { geolocation: mockGeolocation });

      const { location, error } = await getAccurateUserLocation();
      expect(location).toBeNull();
      expect(error?.type).toBe('UNKNOWN'); 
    });
  });
});`;
fs.writeFileSync('src/utils/__tests__/geoUtils.test.ts', tests);

