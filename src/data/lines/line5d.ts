import {
  line5DRoadPaths,
  line5DReturnRoadPaths,
} from '../routes/line5d';

export const line5DData = {
  id: 'line-5d',
  number: '5D',

  name_hu: 'Multi-Trans – Vasútállomás',
  name_ro: 'Multi-Trans – Gara CFR',

  color: '#e76f51',

  roadPaths: line5DRoadPaths,

  directionPaths: {
    outbound: line5DRoadPaths,
    return: line5DReturnRoadPaths,
  },

  // Multi-Trans → József Attila 2
  outboundStopIds: [
    'str-jozsef-attila-2',
    'str-jozsef-attila-1',
    'str-kos-karoly',
    'fabrica-de-tigarete',
    'col-mihai-viteazul',
    'casa-cu-arcade',
    'biserica-reformata',
    'bdul-g-balan-1',
    'bdul-g-balan-2',
    'str-lacramioarei-2',
    'str-lacramioarei-1',
    'gara-cfr-1',
    'autoliv',
    'campul-frumos',
    'multi-trans',
  ],

  // József Attila 2 → Multi-Trans
  returnStopIds: [
    'multi-trans',
    'campul-frumos',
    'autoliv',
    'gara-cfr-1',
    'str-lacramioarei-1',
    'str-lacramioarei-2',
    'bdul-n-iorga-1',
    'bdul-n-iorga-2',
    'tribunal',
    'institutul-de-proiectari',
    'str-dealului',
    'str-dozsa-gyorgy',
    'str-borviz',
    'str-jozsef-attila-2',
  ],

  // Alapértelmezett lista, hogy a meglévő kódok se törjenek el.
  stopIds: [
    'str-jozsef-attila-2',
    'str-jozsef-attila-1',
    'str-kos-karoly',
    'fabrica-de-tigarete',
    'col-mihai-viteazul',
    'casa-cu-arcade',
    'biserica-reformata',
    'bdul-g-balan-1',
    'bdul-g-balan-2',
    'str-lacramioarei-2',
    'str-lacramioarei-1',
    'gara-cfr-1',
    'autoliv',
    'campul-frumos',
    'multi-trans',
  ],
};