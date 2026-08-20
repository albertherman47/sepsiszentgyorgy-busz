import { useEffect, useRef, useState } from 'react';
import { Layers, Loader2, LocateFixed } from 'lucide-react';
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type Map as MapLibreMapType,
  type Marker as MarkerType,
} from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Line } from '../types/bus';
import { CITY_CENTER, DEFAULT_ZOOM, getStopById, lines, stops } from '../data/busData';
import { useAppStore } from '../store/useAppStore';
import { useBusData } from '../hooks/useBusData';
import { useLocateUser } from '../hooks/useLocateUser';

setWorkerUrl(maplibreWorkerUrl);

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const ROUTES_SOURCE = 'bus-routes';
const ROUTES_CASING_LAYER = 'bus-routes-line-casing';
const ROUTES_LAYER = 'bus-routes-line';

/**
 * Lekéri a járat koordinátáit (MultiLineString formátumban [ [lng, lat], ... ][])
 */
function getLineMultiLineCoordinates(
  line: Line,
  direction?: 'outbound' | 'return',
): [number, number][][] {
  if (direction && line.directionPaths?.[direction] && line.directionPaths[direction]!.length > 0) {
    return line.directionPaths[direction]!;
  }
  if (line.paths && line.paths.length > 0) {
    return line.paths;
  }
  if (line.roadPath && line.roadPath.length > 0) {
    return [line.roadPath];
  }
  if (line.path && line.path.length > 0) {
    return [line.path];
  }
  const stopIdsToUse =
    (direction === 'return' ? line.returnStopIds : line.outboundStopIds) ||
    line.directionStopIds?.[direction ?? 'outbound'] ||
    line.stopIds;
  const stopCoords = stopIdsToUse
    .map((sid) => getStopById(sid))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => [s.lng, s.lat] as [number, number]);

  return stopCoords.length > 0 ? [stopCoords] : [];
}

/**
 * GeoJSON FeatureCollection összeállítása
 */
function buildRoutesGeoJSON(
  selectedLineId: string | null,
  selectedDirection: 'outbound' | 'return',
) {
  const activeLines = selectedLineId
    ? lines.filter((line) => line.id === selectedLineId)
    : lines;

  return {
    type: 'FeatureCollection' as const,
    features: activeLines.map((line) => {
      const coordinates = getLineMultiLineCoordinates(
        line,
        line.id === selectedLineId ? selectedDirection : undefined,
      );

      return {
        type: 'Feature' as const,
        properties: {
          id: line.id,
          color: line.color,
          number: line.number,
        },
        geometry: {
          type: 'MultiLineString' as const,
          coordinates,
        },
      };
    }),
  };
}

// Esri World Imagery (Ingyenes műholdas térkép csempék)
const SATELLITE_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri',
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

function createStopMarkerElement(): HTMLButtonElement {
  // Külső konténer a MapLibre pozicionálásához
  // TILOS transition-t tenni rá
  const btn = document.createElement('button');

  btn.type = 'button';
  btn.className = 'bus-stop-marker-container';

  btn.style.cssText = [
    'width:20px',
    'height:20px',
    'padding:0',
    'margin:0',
    'background:transparent',
    'border:none',
    'cursor:pointer',
    'outline:none',
  ].join(';');

  // Belső div a vizuális animációkhoz
  const visual = document.createElement('div');

  visual.className = 'bus-stop-marker-visual';

  visual.style.cssText = [
    'width:100%',
    'height:100%',
    'border-radius:50%',
    'border:2.5px solid #ffffff',
    'transition:transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.25s ease',
    'will-change:transform',
  ].join(';');

  btn.appendChild(visual);

  return btn;
}

function updateStopMarkerElement(
  btn: HTMLButtonElement,
  stopName: string,
  active: boolean,
  color: string,
) {
  btn.setAttribute('aria-label', stopName);
  btn.title = stopName;
  btn.style.zIndex = active ? '30' : '1';

  const visual = btn.firstChild as HTMLDivElement;

  if (visual) {
    visual.style.backgroundColor = active ? '#657933' : color;
    visual.style.transform = active ? 'scale(1.7)' : 'scale(1)';
    visual.style.border = active ? '3px solid #ffffff' : '2.5px solid #ffffff';
    visual.style.boxShadow = active
      ? '0 0 0 7px rgba(101, 121, 51, 0.45), 0 6px 16px rgba(15,23,42,0.4)'
      : '0 1.5px 5px rgba(15,23,42,0.35)';
  }
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMapType | null>(null);

  // A markereket ID alapján tároljuk.
  const markersRef = useRef<Map<string, MarkerType>>(new Map());

  const userMarkerRef = useRef<MarkerType | null>(null);

  const [isSatellite, setIsSatellite] = useState(false);
  const { isLocating, locateUser } = useLocateUser();

  const {
    language,
    stopName,
    selectedLineId,
    selectedLine,
    selectedStop,
  } = useBusData();

  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const selectedDirection = useAppStore((s) => s.selectedLineDirection);
  const flyToStopId = useAppStore((s) => s.flyToStopId);
  const requestFlyToStop = useAppStore((s) => s.requestFlyToStop);
  const userLocation = useAppStore((s) => s.userLocation);

  // ---------------------------------------------------------------------------
  // 1. TÉRKÉP INICIALIZÁLÁSA
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: [CITY_CENTER.lng, CITY_CENTER.lat],
      zoom: DEFAULT_ZOOM,
      attributionControl: {
        compact: true,
      },
    });

    map.addControl(
      new NavigationControl({
        showCompass: false,
      }),
      'top-right',
    );

    mapRef.current = map;

    const addBusRoutesLayer = () => {
      if (map.getSource(ROUTES_SOURCE)) return;

      map.addSource(ROUTES_SOURCE, {
        type: 'geojson',
        data: buildRoutesGeoJSON(selectedLineId, selectedDirection),
      });

      // Kontrasztos fehér háttérvonal (casing)
      map.addLayer({
        id: ROUTES_CASING_LAYER,
        type: 'line',
        source: ROUTES_SOURCE,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': selectedLineId ? 9 : 5.5,
          'line-opacity': 0.9,
        },
      });

      // Fő útvonalvonal a járat színével
      map.addLayer({
        id: ROUTES_LAYER,
        type: 'line',
        source: ROUTES_SOURCE,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': selectedLineId ? 6 : 3.5,
          'line-opacity': 1,
        },
      });
    };

    map.on('load', addBusRoutesLayer);
    map.on('styledata', addBusRoutesLayer);

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const markers = markersRef.current;

    return () => {
      resizeObserver.disconnect();

      // Minden marker eltávolítása
      markers.forEach((marker) => {
        marker.remove();
      });
      markers.clear();

      map.remove();

      mapRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 2. SZATELLIT / UTCATÉRKÉP NÉZET
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    if (isSatellite) {
      map.setStyle(SATELLITE_STYLE as any);
    } else {
      map.setStyle(STYLE_URL);
    }
  }, [isSatellite]);

  // ---------------------------------------------------------------------------
  // 3. JÁRAT ÚTVONALÁNAK VALÓS IDEJŰ FRISSÍTÉSE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateRouteData = () => {
      if (!map.getSource(ROUTES_SOURCE)) {
        if (!map.getSource(ROUTES_SOURCE)) {
          map.addSource(ROUTES_SOURCE, {
            type: 'geojson',
            data: buildRoutesGeoJSON(selectedLineId, selectedDirection),
          });

          map.addLayer({
            id: ROUTES_CASING_LAYER,
            type: 'line',
            source: ROUTES_SOURCE,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#ffffff',
              'line-width': selectedLineId ? 9 : 5.5,
              'line-opacity': 0.9,
            },
          });

          map.addLayer({
            id: ROUTES_LAYER,
            type: 'line',
            source: ROUTES_SOURCE,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': ['get', 'color'],
              'line-width': selectedLineId ? 6 : 3.5,
              'line-opacity': 1,
            },
          });
        }
        return;
      }

      const source = map.getSource(ROUTES_SOURCE) as any;
      source.setData(buildRoutesGeoJSON(selectedLineId, selectedDirection));

      if (map.getLayer(ROUTES_LAYER)) {
        map.setPaintProperty(
          ROUTES_LAYER,
          'line-width',
          selectedLineId ? 6 : 3.5,
        );
      }
      if (map.getLayer(ROUTES_CASING_LAYER)) {
        map.setPaintProperty(
          ROUTES_CASING_LAYER,
          'line-width',
          selectedLineId ? 9 : 5.5,
        );
      }
    };

    if (map.isStyleLoaded()) {
      updateRouteData();
    } else {
      map.once('load', updateRouteData);
      map.once('styledata', updateRouteData);
    }
  }, [selectedLineId, selectedDirection]);

  // ---------------------------------------------------------------------------
  // 4. KAMERA IGAZÍTÁSA A KIVÁLASZTOTT JÁRATRA
  // ---------------------------------------------------------------------------
  const selectedTripOption = useAppStore((s) => s.selectedTripOption);

  useEffect(() => {
    const map = mapRef.current;

    const TRIP_SOURCE = 'trip-route-source';
    const TRIP_LAYER = 'trip-route-layer';
    const TRIP_STOP_SOURCE = 'trip-stops-source';
    const TRIP_STOP_LAYER = 'trip-stops-layer';

    const removeTripLayers = () => {
      if (map?.getLayer(TRIP_LAYER)) map.removeLayer(TRIP_LAYER);
      if (map?.getSource(TRIP_SOURCE)) map.removeSource(TRIP_SOURCE);
      if (map?.getLayer(TRIP_STOP_LAYER)) map.removeLayer(TRIP_STOP_LAYER);
      if (map?.getSource(TRIP_STOP_SOURCE)) map.removeSource(TRIP_STOP_SOURCE);
    };

    if (!map || !selectedTripOption) {
      removeTripLayers();
      return;
    }

    const firstSeg = selectedTripOption.segments[0];
    const lastSeg =
      selectedTripOption.segments[selectedTripOption.segments.length - 1];

    if (!firstSeg || !lastSeg) return;

    // Fit camera to all stops in the trip
    const bounds = new LngLatBounds(
      [firstSeg.fromStop.lng, firstSeg.fromStop.lat],
      [lastSeg.toStop.lng, lastSeg.toStop.lat],
    );

    if (selectedTripOption.transferStop) {
      bounds.extend([
        selectedTripOption.transferStop.lng,
        selectedTripOption.transferStop.lat,
      ]);
    }

    map.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 80, right: 80 },
      maxZoom: 15,
      duration: 800,
    });

    // Build the coordinate chain: origin -> (transfer?) -> destination
    const keyStops = selectedTripOption.segments.flatMap((seg, i) =>
      i === 0
        ? [[seg.fromStop.lng, seg.fromStop.lat], [seg.toStop.lng, seg.toStop.lat]]
        : [[seg.toStop.lng, seg.toStop.lat]],
    );

    // Circle features for each key stop
    const stopFeatures = [
      firstSeg.fromStop,
      ...(selectedTripOption.transferStop ? [selectedTripOption.transferStop] : []),
      lastSeg.toStop,
    ].map((stop, idx) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [stop.lng, stop.lat] },
      properties: {
        label: idx === 0 ? 'A' : idx === (selectedTripOption.transferStop ? 2 : 1) ? 'B' : 'T',
        color: idx === 0 ? '#22c55e' : idx === (selectedTripOption.transferStop ? 2 : 1) ? '#ef4444' : '#f59e0b',
      },
    }));

    const draw = () => {
      removeTripLayers();

      // Dashed animated trip route line
      map.addSource(TRIP_SOURCE, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: keyStops },
          properties: {},
        },
      });

      map.addLayer({
        id: TRIP_LAYER,
        type: 'line',
        source: TRIP_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#6366f1',
          'line-width': 5,
          'line-opacity': 0.92,
          'line-dasharray': [2, 1.5],
        },
      });

      // Stop circles
      map.addSource(TRIP_STOP_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: stopFeatures },
      });

      map.addLayer({
        id: TRIP_STOP_LAYER,
        type: 'circle',
        source: TRIP_STOP_SOURCE,
        paint: {
          'circle-radius': 10,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
          'circle-opacity': 1,
        },
      });
    };

    if (map.isStyleLoaded()) {
      draw();
    } else {
      map.once('load', draw);
    }

    return () => {
      removeTripLayers();
    };
  }, [selectedTripOption]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !selectedLineId) return;
    // Ha megálló van kiválasztva vagy ráközelítés zajlik, ne méretezzük vissza a teljes vonalra
    if (selectedStop || flyToStopId) return;

    const activeLine = lines.find((line) => line.id === selectedLineId);
    if (!activeLine) return;

    const multiCoords = getLineMultiLineCoordinates(activeLine, selectedDirection);
    const flatCoords = multiCoords.flat();

    if (flatCoords.length === 0) return;

    const bounds = flatCoords.reduce(
      (b, coord) => b.extend(coord),
      new LngLatBounds(flatCoords[0], flatCoords[0]),
    );

    map.fitBounds(bounds, {
      padding: {
        top: 70,
        bottom: 70,
        left: 70,
        right: 70,
      },
      maxZoom: 15.5,
      duration: 800,
    });
  }, [selectedLineId, selectedDirection, selectedStop, flyToStopId]);
  // ---------------------------------------------------------------------------
  // 5. MEGÁLLÓ MARKEREK LÉTREHOZÁSA
  //
  // A markereket egyszer létrehozzuk.
  // A járatváltáskor NEM hozzuk létre újra őket,
  // csak a láthatóságukat frissítjük.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    const createMarkers = () => {
      for (const stop of stops) {
        // Ha már létezik, nem hozzuk létre újra.
        if (markersRef.current.has(stop.id)) {
          continue;
        }

        const el = createStopMarkerElement();

        el.addEventListener('click', (e) => {
          e.stopPropagation();

          setSelectedStopId(stop.id);
          requestFlyToStop(stop.id);
        });

        const marker = new Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);

        markersRef.current.set(stop.id, marker);
      }
    };

    // A marker DOM elemek a map style-tól függetlenek,
    // ezért csak a kezdeti térképbetöltéshez várunk.
    if (map.loaded()) {
      createMarkers();
    } else {
      map.once('load', createMarkers);
    }

    return () => {
      map.off('load', createMarkers);
    };
  }, [
    setSelectedStopId,
    requestFlyToStop,
  ]);


  // ---------------------------------------------------------------------------
  // 5/B. MEGÁLLÓK LÁTHATÓSÁGÁNAK FRISSÍTÉSE
  //
  // EZ A FONTOS RÉSZ.
  //
  // selectedLineId változásakor azonnal végigmegyünk az összes markeren.
  // Nem függünk a MapLibre style betöltésétől.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    for (const stop of stops) {
      const marker = markersRef.current.get(stop.id);

      if (!marker) {
        continue;
      }

      const el = marker.getElement() as HTMLButtonElement;

      // Nincs kiválasztott járat -> minden megálló látható.
      //
      // Van kiválasztott járat -> csak az adott járathoz
      // tartozó megállók láthatók.
      const isVisible =
        selectedLineId === null ||
        (stop.lineIds.includes(selectedLineId) &&
        (!selectedLine?.directionStopIds?.[selectedDirection] ||
          selectedLine.directionStopIds[selectedDirection]!.includes(stop.id)));

      // ---------------------------------------------------------------
      // LÁTHATÓSÁG
      // ---------------------------------------------------------------
      el.style.display = isVisible
        ? 'block'
        : 'none';

      if (!isVisible) {
        continue;
      }

      // ---------------------------------------------------------------
      // AKTUÁLIS JÁRAT SZÍNE
      // ---------------------------------------------------------------
      const primaryLine =
        lines.find(
          (line) =>
            line.id ===
            (selectedLineId ?? stop.lineIds[0]),
        ) ?? lines[0];

      const color =
        primaryLine?.color ?? '#0d9488';

      // ---------------------------------------------------------------
      // AKTÍV MEGÁLLÓ
      // ---------------------------------------------------------------
      const active =
        selectedStop?.id === stop.id;

      updateStopMarkerElement(
        el,
        stopName(stop),
        active,
        color,
      );
    }
  }, [
    selectedLineId,
    selectedLine,
    selectedDirection,
    selectedStop,
    language,
    stopName,
  ]);
  // ---------------------------------------------------------------------------
  // 6. RÁKÖZELÍTÉS A KIVÁLASZTOTT MEGÁLLÓRA
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !flyToStopId) return;

    const stop = getStopById(flyToStopId);

    if (!stop) return;

    const doFly = () => {
      map.flyTo({
        center: [stop.lng, stop.lat],
        zoom: 16,
        speed: 1.4,
        curve: 1.2,
        essential: true,
      });
      requestFlyToStop(null);
    };

    if (map.loaded()) {
      doFly();
    } else {
      map.once('load', doFly);
    }
  }, [flyToStopId, requestFlyToStop]);

  // ---------------------------------------------------------------------------
  // 7. FELHASZNÁLÓI POZÍCIÓ
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !userLocation) return;

    let marker = userMarkerRef.current;

    if (!marker) {
      const el = document.createElement('div');

      el.className = 'user-location-marker';

      el.style.cssText =
        'width:18px;height:18px;border-radius:50%;background:#0284c7;border:3px solid #ffffff;box-shadow:0 0 0 6px rgba(2,132,199,0.35), 0 4px 12px rgba(15,23,42,0.3);position:relative;z-index:90;';

      marker = new Marker({
        element: el,
      })
        .setLngLat([
          userLocation.lng,
          userLocation.lat,
        ])
        .addTo(map);

      userMarkerRef.current = marker;
    } else {
      marker.setLngLat([
        userLocation.lng,
        userLocation.lat,
      ]);
    }

    map.flyTo({
      center: [
        userLocation.lng,
        userLocation.lat,
      ],
      zoom: Math.max(map.getZoom(), 14.5),
      speed: 1.2,
      essential: true,
    });
  }, [userLocation]);

  // ---------------------------------------------------------------------------
  // 8. UI
  // ---------------------------------------------------------------------------
  return (
    <div className="relative h-full w-full min-h-0">
      {/* Térkép konténer */}
      <div
        ref={containerRef}
        className="h-full w-full"
      />

      {/* Floating Map Action Controls (Top Right) */}
      <div className="absolute right-3 top-14 z-10 flex flex-col gap-2">
        {/* Szatelit váltógomb */}
        <button
          type="button"
          onClick={() =>
            setIsSatellite((prev) => !prev)
          }
          className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs font-bold text-[var(--text-h)] shadow-md backdrop-blur-md transition hover:bg-[var(--surface)] active:scale-95"
          title={isSatellite ? (language === 'hu' ? 'Utcatérkép nézet' : 'Hartă străzi') : (language === 'hu' ? 'Műholdas nézet' : 'Vedere satelit')}
        >
          <Layers className="h-4 w-4 text-[var(--brand)]" />
          <span>{isSatellite ? (language === 'hu' ? 'Térkép' : 'Hartă') : (language === 'hu' ? 'Műhold' : 'Satelit')}</span>
        </button>

        {/* Saját GPS Helyzet gomb a térképen */}
        <button
          type="button"
          onClick={locateUser}
          disabled={isLocating}
          className={`
            flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold shadow-md backdrop-blur-md transition active:scale-95
            ${
              userLocation
                ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]'
                : 'border-[var(--border)] bg-[var(--panel)] text-[var(--text-h)] hover:bg-[var(--surface)]'
            }
          `}
          title={language === 'hu' ? 'Saját helyzet meghatározása' : 'Locația mea'}
          aria-label={language === 'hu' ? 'Saját helyzet' : 'Locația mea'}
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--brand)]" />
          ) : (
            <LocateFixed className={`h-4 w-4 ${userLocation ? 'text-[var(--brand)] animate-pulse' : 'text-[var(--brand)]'}`} />
          )}
          <span>{language === 'hu' ? 'Helyzetem' : 'Poziție'}</span>
        </button>
      </div>
    </div>
  );
}
