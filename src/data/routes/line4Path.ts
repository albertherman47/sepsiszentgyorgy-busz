import type { LngLat } from '../../types/bus';

export const line4GeoJSON = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: [
                    [25.7819097, 45.8567353],
                    [25.7834523, 45.8554164],
                    // ... a többi koordináta
                    [25.8425117, 45.8619122]
                ]
            }
        }
    ]
} as const;

// Az 'as unknown as LngLat[]' feloldja a readonly tömb típuskonfliktusát
export const line4RoadPath = line4GeoJSON.features[0].geometry.coordinates as unknown as LngLat[];