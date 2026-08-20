import { useCallback, useState, useRef, useEffect } from 'react';
import { useBusData } from './useBusData';
import { useAppStore } from '../store/useAppStore';
import { findNearbyStops, getAccurateUserLocation } from '../utils/geoUtils';

let toastTimeout: number | null = null;

export function useLocateUser() {
  const [isLocating, setIsLocating] = useState(false);
  const isLocatingRef = useRef(false);
  const mountedRef = useRef(true);
  
  const { stops, language, stopName } = useBusData();
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const requestFlyToStop = useAppStore((s) => s.requestFlyToStop);
  const setGeoToast = useAppStore((s) => s.setGeoToast);
  const activeTab = useAppStore((s) => s.activeTab);
  const setPlannerOriginStopId = useAppStore((s) => s.setPlannerOriginStopId);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error') => {
    if (toastTimeout !== null) {
      window.clearTimeout(toastTimeout);
    }
    setGeoToast({ message, type });
    const duration = type === 'success' ? 7000 : 4500;
    toastTimeout = window.setTimeout(() => {
      setGeoToast(null);
      toastTimeout = null;
    }, duration);
  }, [setGeoToast]);

  const locateUser = useCallback(async () => {
    if (isLocatingRef.current) return;
    
    isLocatingRef.current = true;
    setIsLocating(true);
    
    const hu = language === 'hu';
    showToast(
      hu ? '📍 Helyzet meghatározása...' : '📍 Determinarea locației...',
      'info',
    );

    try {
      const { location, error } = await getAccurateUserLocation();
      
      if (!mountedRef.current) return;

      if (error || !location) {
        showToast(
          hu ? (error?.messageHu ?? 'Nem sikerült meghatározni a helyzetet.') : (error?.messageRo ?? 'Nu s-a putut determina locația.'),
          'error',
        );
        isLocatingRef.current = false;
        setIsLocating(false);
        return;
      }

      setUserLocation({ lat: location.lat, lng: location.lng });

      const nearbyStops = findNearbyStops(
        { lat: location.lat, lng: location.lng },
        stops,
      );

      if (nearbyStops.length > 0) {
        const top3 = nearbyStops.slice(0, 3);
        const nearest = top3[0];
        
        if (activeTab === 'planner') {
          setPlannerOriginStopId(nearest.stop.id);
          requestFlyToStop(nearest.stop.id);
        } else {
          setSelectedStopId(nearest.stop.id);
          requestFlyToStop(nearest.stop.id);
        }

        const linesHu = top3.map((n, i) => `${i+1}. ${stopName(n.stop)} - ${n.distanceMeters} m`).join('\n');
        const linesRo = top3.map((n, i) => `${i+1}. ${stopName(n.stop)} - ${n.distanceMeters} m`).join('\n');

        showToast(
          hu
            ? `✓ Helyzet meghatározva!\nLegközelebbi megállók:\n${linesHu}`
            : `✓ Locație identificată!\nCele mai apropiate stații:\n${linesRo}`,
          'success',
        );
      } else {
        showToast(
          hu ? '✓ Helyzet sikeresen meghatározva, de nincsenek közeli megállók.' : '✓ Locație identificată, dar nu sunt stații în apropiere.',
          'success',
        );
      }
    } catch {
      if (!mountedRef.current) return;
      showToast(
        hu
          ? 'Nem sikerült meghatározni a helyzetet. Kérjük, engedélyezd a helyhozzáférést!'
          : 'Nu s-a putut determina locația. Te rugăm să permiți accesul la locație!',
        'error',
      );
    } finally {
      if (mountedRef.current) {
        isLocatingRef.current = false;
        setIsLocating(false);
      }
    }
  }, [
    language,
    stops,
    stopName,
    activeTab,
    setUserLocation,
    setSelectedStopId,
    requestFlyToStop,
    setPlannerOriginStopId,
    showToast,
  ]);

  return {
    isLocating,
    locateUser,
  };
}
