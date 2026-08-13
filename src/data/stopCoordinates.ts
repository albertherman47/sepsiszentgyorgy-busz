import { line4Tur } from './routes/line4';

export interface StopCoordinate {
    lat: number;
    lng: number;
}

const defaultCoordinates: Record<string, StopCoordinate> = {
    'arena-sepsi': { lat: 45.8720, lng: 25.8210 },
    'autoliv': { lat: 45.8492, lng: 25.7921 },
    'bdul-g-balan-1': { lat: 45.8655, lng: 25.7930 },
    'bdul-g-balan-2': { lat: 45.8672, lng: 25.7945 },
    'bdul-n-iorga-1': { lat: 45.8610, lng: 25.7915 },
    'bdul-n-iorga-2': { lat: 45.8625, lng: 25.7932 },
    'biserica-reformata-arcus': { lat: 45.8985, lng: 25.7731 },
    'calea-brasovului-2': { lat: 45.8480, lng: 25.7860 },
    'calea-brasovului-3': { lat: 45.8410, lng: 25.7875 },
    'cart-ciucului': { lat: 45.8645, lng: 25.7971 },
    'cart-kossuth-lajos': { lat: 45.8820, lng: 25.7810 },
    'castelul-szentkereszty': { lat: 45.8920, lng: 25.7750 },
    'centru-arcus': { lat: 45.9010, lng: 25.7720 },
    'centru-comercial': { lat: 45.8690, lng: 25.8120 },
    'chilieni': { lat: 45.8280, lng: 25.7920 },
    'coseni-1': { lat: 45.8150, lng: 25.7980 },
    'coseni-2': { lat: 45.8110, lng: 25.7990 },
    'debren': { lat: 45.8698, lng: 25.8021 },
    'fabrica-de-lapte': { lat: 45.8705, lng: 25.8160 },
    'fabrica-de-tigarete': { lat: 45.8680, lng: 25.7830 },
    'fantana-honved': { lat: 45.8490, lng: 25.7420 },
    'gara-cfr-2': { lat: 45.8552, lng: 25.7848 },
    'gradinarie': { lat: 45.8750, lng: 25.7910 },
    'institutul-de-proiectari': { lat: 45.8652, lng: 25.7874 },
    'liceul-de-arta-plugor-sandor': { lat: 45.8628, lng: 25.7895 },
    'liceul-m-viteazul': { lat: 45.8660, lng: 25.7850 },
    'motel-calypso': { lat: 45.8210, lng: 25.7950 },
    'piata-kalvin': { lat: 45.8611, lng: 25.7920 },
    'primaria-arcus': { lat: 45.8995, lng: 25.7725 },
    'simeria-str-berzei': { lat: 45.8742, lng: 25.7791 },
    'spitalul-judetean': { lat: 45.8689, lng: 25.7912 },
    'str-bartok-bela': { lat: 45.8712, lng: 25.7831 },
    'str-borviz': { lat: 45.8590, lng: 25.7680 },
    'str-ciucului-1': { lat: 45.8681, lng: 25.8001 },
    'str-ciucului-2': { lat: 45.8662, lng: 25.7989 },
    'str-dealului': { lat: 45.8671, lng: 25.7891 },
    'str-dozsa-gyorgy': { lat: 45.8695, lng: 25.7810 },
    'str-gabor-aron': { lat: 45.8640, lng: 25.7885 },
    'str-ghioceilor': { lat: 45.8725, lng: 25.7845 },
    'str-jozsef-attila-1': { lat: 45.8710, lng: 25.7780 },
    'str-jozsef-attila-2': { lat: 45.8725, lng: 25.7765 },
    'str-kos-karoly': { lat: 45.8700, lng: 25.7800 },
    'str-lacramioarei-1': { lat: 45.8590, lng: 25.7890 },
    'str-lacramioarei-2': { lat: 45.8600, lng: 25.7900 },
    'str-vanatorilor-1': { lat: 45.8705, lng: 25.7860 },
    'str-vanatorilor-2': { lat: 45.8715, lng: 25.7850 },
    'sugas-bai': { lat: 45.8420, lng: 25.7010 },
    'tribunal': { lat: 45.8648, lng: 25.7860 },
};

// A line4Tur pontos megálló-koordinátáit kinyerjük és betöltjük:
const line4StopCoordinates = line4Tur.reduce((acc, stop) => {
    acc[stop.id] = { lat: stop.lat, lng: stop.lng };
    return acc;
}, {} as Record<string, StopCoordinate>);

export const STOP_COORDINATES: Record<string, StopCoordinate> = {
    ...defaultCoordinates,
    ...line4StopCoordinates,
};