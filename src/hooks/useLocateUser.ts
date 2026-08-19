import { useCallback, useState } from 'react';
import { useBusData } from './useBusData';
import { useAppStore } from '../store/useAppStore';
import { findNearestStopWithDistance, getAccurateUserLocation } from '../utils/geoUtils';

let toastTimeout: number | null = null;

export function useLocateUser() {
  const [isLocating, setIsLocating] = useState(false);
  const { stops, language, stopName } = useBusData();

  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const requestFlyToStop = useAppStore((s) => s.requestFlyToStop);
  const setGeoToast = useAppStore((s) => s.setGeoToast);
  const activeTab = useAppStore((s) => s.activeTab);
  const setPlannerOriginStopId = useAppStore((s) => s.setPlannerOriginStopId);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error') => {
    if (toastTimeout !== null) {
      window.clearTimeout(toastTimeout);
    }
    setGeoToast({ message, type });
    toastTimeout = window.setTimeout(() => {
      setGeoToast(null);
      toastTimeout = null;
    }, 4500);
  }, [setGeoToast]);

  const locateUser = useCallback(async () => {
    if (isLocating) return;

    setIsLocating(true);
    const hu = language === 'hu';
    showToast(
      hu ? '📍 Helyzet meghatározása...' : '📍 Determinarea locației...',
      'info',
    );

    try {
      const { location, error } = await getAccurateUserLocation();

      if (error || !location) {
        showToast(
          hu ? (error?.messageHu ?? 'Nem sikerült meghatározni a helyzetet.') : (error?.messageRo ?? 'Nu s-a putut determina locația.'),
          'error',
        );
        setIsLocating(false);
        return;
      }

      setUserLocation({ lat: location.lat, lng: location.lng });

      const nearest = findNearestStopWithDistance(
        { lat: location.lat, lng: location.lng },
        stops,
      );

      if (nearest) {
        const sName = stopName(nearest.stop);
        const distStr =
          nearest.distanceMeters < 1000
            ? `${nearest.distanceMeters} m`
            : `${(nearest.distanceMeters / 1000).toFixed(1)} km`;

        if (activeTab === 'planner') {
          setPlannerOriginStopId(nearest.stop.id);
          requestFlyToStop(nearest.stop.id);
        } else {
          setSelectedStopId(nearest.stop.id);
          requestFlyToStop(nearest.stop.id);
        }

        showToast(
          hu
            ? `✓ Helyzet meghatározva! Legközelebbi megálló: ${sName} (${distStr})`
            : `✓ Locație identificată! Cea mai apropiată stație: ${sName} (${distStr})`,
          'success',
        );
      } else {
        showToast(
          hu ? '✓ Helyzet sikeresen meghatározva!' : '✓ Locație identificată cu succes!',
          'success',
        );
      }
    } catch {
      showToast(
        hu
          ? 'Nem sikerült meghatározni a helyzetet. Kérjük, engedélyezd a helyhozzáférést!'
          : 'Nu s-a putut determina locația. Te rugăm să permiți accesul la locație!',
        'error',
      );
    } finally {
      setIsLocating(false);
    }
  }, [
    isLocating,
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
