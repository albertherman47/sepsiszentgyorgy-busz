import { useEffect, useRef, useState } from 'react';
import { Layers, X } from 'lucide-react';
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
import { CITY_CENTER, DEFAULT_ZOOM, getStopById, lines, stops } from '../data/busData';
import { useAppStore } from '../store/useAppStore';
import { useBusData } from '../hooks/useBusData';

setWorkerUrl(maplibreWorkerUrl);

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const ROUTES_SOURCE = 'bus-routes';
const ROUTES_LAYER = 'bus-routes-line';

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
  btn.style.zIndex = active ? '20' : '1';

  const visual = btn.firstChild as HTMLDivElement;

  if (visual) {
    visual.style.backgroundColor = color;
    visual.style.transform = active ? 'scale(1.5)' : 'scale(1)';
    visual.style.boxShadow = active
      ? `0 0 0 5px ${color}45, 0 4px 12px rgba(15,23,42,0.4)`
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

  const {
    language,
    stopName,
    lineName,
    selectedLineId,
    selectedLine,
    selectedStop,
  } = useBusData();

  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const setSelectedLineId = useAppStore((s) => s.setSelectedLineId);

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

      const features = lines.map((line) => ({
        type: 'Feature' as const,
        properties: {
          id: line.id,
          color: line.color,
          number: line.number,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: line.path,
        },
      }));

      map.addSource(ROUTES_SOURCE, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

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
          'line-width': 4,
          'line-opacity': 0.85,
        },
      });
    };

    map.on('load', addBusRoutesLayer);
    map.on('styledata', addBusRoutesLayer);

    return () => {
      // Minden marker eltávolítása
      markersRef.current.forEach((marker) => {
        marker.remove();
      });

      markersRef.current.clear();

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
  // 3. VONAL LÁTHATÓSÁGA
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    const apply = () => {
      if (!map.getLayer(ROUTES_LAYER)) return;

      // Mindig alapállapotból indulunk.
      map.setFilter(ROUTES_LAYER, null);

      if (!selectedLineId) {
        // Nincs kiválasztott járat:
        // minden járat látható.
        map.setPaintProperty(
          ROUTES_LAYER,
          'line-opacity',
          0.85,
        );

        map.setPaintProperty(
          ROUTES_LAYER,
          'line-width',
          4,
        );
      } else {
        // Csak a kiválasztott járat legyen látható.
        map.setPaintProperty(
          ROUTES_LAYER,
          'line-opacity',
          [
            'case',
            ['==', ['get', 'id'], selectedLineId],
            1,
            0,
          ],
        );

        map.setPaintProperty(
          ROUTES_LAYER,
          'line-width',
          [
            'case',
            ['==', ['get', 'id'], selectedLineId],
            6,
            4,
          ],
        );
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once('load', apply);
    }
  }, [selectedLineId]);

  // ---------------------------------------------------------------------------
  // 4. KAMERA IGAZÍTÁSA A KIVÁLASZTOTT JÁRATRA
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !selectedLineId) return;

    const activeLine = lines.find(
      (line) => line.id === selectedLineId,
    );

    if (!activeLine || activeLine.path.length === 0) return;

    const bounds = activeLine.path.reduce(
      (b, coord) => b.extend(coord as [number, number]),
      new LngLatBounds(
        activeLine.path[0],
        activeLine.path[0],
      ),
    );

    map.fitBounds(bounds, {
      padding: {
        top: 60,
        bottom: 60,
        left: 60,
        right: 60,
      },
      maxZoom: 15,
      duration: 750,
    });
  }, [selectedLineId]);
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
        stop.lineIds.includes(selectedLineId);

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

    map.flyTo({
      center: [stop.lng, stop.lat],
      zoom: Math.max(map.getZoom(), 14.5),
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });

    requestFlyToStop(null);
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
        'width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,0.25);transition:all 0.3s ease;';

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
      zoom: Math.max(map.getZoom(), 14),
      speed: 1.1,
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

      {/* Szatelit váltógomb */}
      <button
        type="button"
        onClick={() =>
          setIsSatellite((prev) => !prev)
        }
        className="absolute right-3 top-14 z-10 flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[var(--text-h)] shadow-md transition hover:bg-[var(--surface)]"
      >
        <Layers
          className="h-4 w-4"
        />

        {isSatellite
          ? 'Utcatérkép'
          : 'Műhold'}
      </button>

      {/* Kiválasztott járat információs sávja */}
      {selectedLine && (
        <div className="pointer-events-auto absolute left-4 top-4 z-10 flex max-w-[calc(100%-4rem)] items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--panel)]/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md transition-all">
          <span
            className="flex h-7 min-w-7 items-center justify-center rounded-xl font-black text-white shadow-xs"
            style={{
              backgroundColor:
                selectedLine.color,
            }}
          >
            {selectedLine.number}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[var(--text-h)]">
              {selectedLine.number}.{' '}
              {language === 'hu'
                ? 'busz'
                : 'autobuz'}
              : {lineName(selectedLine)}
            </p>

            <p className="text-[11px] text-[var(--text-muted)]">
              {language === 'hu'
                ? 'Kizárólag ennek az útvonalát mutatja'
                : 'Afișează doar acest traseu'}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedLineId(null)
            }
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--text-muted)] transition hover:bg-[var(--border)] hover:text-[var(--text-h)]"
            aria-label={
              language === 'hu'
                ? 'Összes buszjárat mutatása'
                : 'Arată toate liniile'
            }
            title={
              language === 'hu'
                ? 'Összes buszjárat mutatása'
                : 'Arată toate liniile'
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}