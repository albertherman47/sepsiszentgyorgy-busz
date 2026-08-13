import { strGhioceilorSchedules } from './schedules/strGhioceilor';
import { strGaborAronSchedules } from './schedules/strGaborAron';
import { strFabricii2Schedules } from './schedules/strFabricii2';
import { strFabricii1Schedules } from './schedules/strFabricii1';
import { strDozsaGyorgySchedules } from './schedules/strDozsaGyorgy';
import type { Line, Schedule, Stop } from '../types/bus';

import { ALL_STOPS } from './stops';
import { strCiucului2Schedules } from './schedules/strCiucului2';
import { strCiucului1Schedules } from './schedules/strCiucului1';

import { line1Data } from './lines/line1';
import { line1DData } from './lines/line1d';
import { line2Data } from './lines/line2';
import { line2DData } from './lines/line2d';
import { line3Data } from './lines/line3';
import { line4Data } from './lines/line4';
import { line5Data } from './lines/line5';
import { line5DData } from './lines/line5d';
import { line6Data } from './lines/line6';
import { line7Data } from './lines/line7';
import { line9Data } from './lines/line9';
import { line10Data } from './lines/line10';
import { bdulGBalan1Schedules } from './schedules/bdulGBalan1';
import { caleaBrasovului3Schedules } from './schedules/caleaBrasovului3';
import { arenaSepsiSchedules } from './schedules/arenaSepsi';
import { autolivSchedules } from './schedules/autoliv';
import { bdulGBalan2Schedules } from './schedules/bdulGBalan2';
import { bdulNIorga1Schedules } from './schedules/bdulNIorga1';
import { bdulNIorga2Schedules } from './schedules/bdulNIorga2';
import { bisericaReformataSchedules } from './schedules/bisericaReformata';
import { caleaBrasovului1Schedules } from './schedules/caleaBrasovului1';
import { caleaBrasovului2Schedules } from './schedules/caleaBrasovului2';
import { centruComercialSchedules } from './schedules/centruComercial';
import { chilieniSchedules } from './schedules/chilieni';
import { castelulSzentkeresztySchedules } from './schedules/castelulSzentkereszty';
import { coseni2Schedules } from './schedules/coseni2';
import { coseni1Schedules } from './schedules/coseni1';
import { comfortResidenceSchedules } from './schedules/comfortResidence';
import { campulFrumosSchedules } from './schedules/campulFrumos';
import { centruArcusSchedules } from './schedules/centruArcus';
import { cartCiuculuiSchedules } from './schedules/cartCiucului';
import { cartKossuthLajosSchedules } from './schedules/cartKossuthLajos';
import { casaCuArcadeSchedules } from './schedules/casaCuArcade';
import { fabricaDeTigareteSchedules } from './schedules/fabricaDeTigarete';
import { strSporturilorSchedules } from './schedules/strSporturilor';
import { fabricaDeLapteSchedules } from './schedules/fabricaDeLapte';
import { debrenSchedules } from './schedules/debren';
import { fantanaHonvedSchedules } from './schedules/fantanaHonved';
import { garaCfr1Schedules } from './schedules/garaCfr1';
import { garaCfr2Schedules } from './schedules/garaCfr2';
import { gradinarieSchedules } from './schedules/gradinarie';
import { institutulDeProiectariSchedules } from './schedules/institutulDeProiectari';
import { liceulDeArtaPlugorSandorSchedules } from './schedules/liceulDeArtaPlugorSandor';
import { liceulMViteazulSchedules } from './schedules/liceulMViteazul';
import { motelCalypsoSchedules } from './schedules/motelCalypso';
import { multiTransSchedules } from './schedules/multiTrans';
import { parcElisabetaSchedules } from './schedules/parcElisabeta';
import { piataKalvinSchedules } from './schedules/piataKalvin';
import { primariaArcusSchedules } from './schedules/primariaArcus';
import { simeriaStrBerzeiSchedules } from './schedules/simeriaStrBerzei';
import { spitalulJudeteanSchedules } from './schedules/spitalulJudetean';
import { strBartokBelaSchedules } from './schedules/strBartokBela';
import { strBorvizSchedules } from './schedules/strBorviz';

import { strDealuluiSchedules } from './schedules/strDealului';
import { strConstructorilor3Schedules } from './schedules/strConstructorilor3';
import { strConstructorilor2Schedules } from './schedules/strConstructorilor2';
import { strConstructorilor1Schedules } from './schedules/strConstructorilor1';
import { strJozsefAttila1Schedules } from './schedules/strJozsefAttila1';
import { strJozsefAttila2Schedules } from './schedules/strJozsefAttila2';
import { strKosKarolySchedules } from './schedules/strKosKaroly';
import { strLacramioarei1Schedules } from './schedules/strLacramioarei1';
import { strLacramioarei2Schedules } from './schedules/strLacramioarei2';
import { strTigaretei1Schedules } from './schedules/strTigaretei1';
import { strTigaretei2Schedules } from './schedules/strTigaretei2';
import { strTigaretei3Schedules } from './schedules/strTigaretei3';
import { strVanatorilor1Schedules } from './schedules/strVanatorilor1';
import { strVanatorilor2Schedules } from './schedules/strVanatorilor2';
import { sugasBaiSchedules } from './schedules/sugasBai';
import { tribunalSchedules } from './schedules/tribunal';
export const CITY_CENTER = {
  lat: 45.8636,
  lng: 25.7877,
} as const;

export const DEFAULT_ZOOM = 13.2;

// ============================================================
// ÖSSZES JÁRAT
// ============================================================

const registeredLines = [
  line1Data,
  line1DData,
  line2Data,
  line2DData,
  line3Data,
  line4Data,
  line5Data,
  line5DData,
  line6Data,
  line7Data,
  line9Data,
  line10Data,
];

// ============================================================
// MEGÁLLÓK
// ============================================================

export const stops: Stop[] = Object.values(ALL_STOPS).map(
  (baseStop) => {
    const lineIds = registeredLines
      .filter((line) =>
        line.stopIds.includes(baseStop.id),
      )
      .map((line) => line.id);

    return {
      ...baseStop,
      lineIds,
    };
  },
);

const stopMap = new Map(
  stops.map((stop) => [stop.id, stop]),
);

// ============================================================
// JÁRATOK
// ============================================================

export const lines: Line[] = registeredLines.map(
  (line) => ({
    id: line.id,
    number: line.number,
    name_hu: line.name_hu,
    name_ro: line.name_ro,
    color: line.color,
    stopIds: line.stopIds,

    path:
      (line as any).roadPath ||
      line.stopIds
        .map((stopId) => {
          const stop = stopMap.get(stopId);

          return stop
            ? ([stop.lng, stop.lat] as [number, number])
            : null;
        })
        .filter(
          (
            coords,
          ): coords is [number, number] =>
            coords !== null,
        ),
  }),
);

// ============================================================
// MENETRENDEK
// ============================================================
//
// NINCS több generateTimes().
// Csak a ténylegesen megadott menetrendek kerülnek ide.
//

export const schedules: Schedule[] = [
  ...strSporturilorSchedules,
  ...strDozsaGyorgySchedules,
  ...strFabricii1Schedules,
  ...strFabricii2Schedules,
  ...strGaborAronSchedules,
  ...strGhioceilorSchedules,
  ...strDealuluiSchedules,
  ...strConstructorilor3Schedules,
  ...strConstructorilor2Schedules,
  ...strConstructorilor1Schedules,
  ...strCiucului2Schedules,
  ...strCiucului1Schedules,
  ...arenaSepsiSchedules,
  ...autolivSchedules,
  ...bdulGBalan1Schedules,
  ...bdulGBalan2Schedules,
  ...bdulNIorga1Schedules,
  ...bdulNIorga2Schedules,
  ...bisericaReformataSchedules,
  ...caleaBrasovului1Schedules,
  ...caleaBrasovului2Schedules,
  ...caleaBrasovului3Schedules,
  ...centruComercialSchedules,
  ...chilieniSchedules,
  ...castelulSzentkeresztySchedules,
  ...fabricaDeTigareteSchedules,
  ...fabricaDeLapteSchedules,
  ...debrenSchedules,
  ...coseni2Schedules,
  ...coseni1Schedules,
  ...comfortResidenceSchedules,
  ...campulFrumosSchedules,
  ...centruArcusSchedules,
  ...cartCiuculuiSchedules,
  ...cartKossuthLajosSchedules,
  ...casaCuArcadeSchedules,

  ...fantanaHonvedSchedules,
  ...garaCfr1Schedules,
  ...garaCfr2Schedules,
  ...gradinarieSchedules,
  ...institutulDeProiectariSchedules,
  ...liceulDeArtaPlugorSandorSchedules,
  ...liceulMViteazulSchedules,
  ...motelCalypsoSchedules,
  ...multiTransSchedules,
  ...parcElisabetaSchedules,
  ...piataKalvinSchedules,
  ...primariaArcusSchedules,
  ...simeriaStrBerzeiSchedules,
  ...spitalulJudeteanSchedules,
  ...strBartokBelaSchedules,
  ...strBorvizSchedules,
  ...strJozsefAttila1Schedules,
  ...strJozsefAttila2Schedules,
  ...strKosKarolySchedules,
  ...strLacramioarei1Schedules,
  ...strLacramioarei2Schedules,
  ...strTigaretei1Schedules,
  ...strTigaretei2Schedules,
  ...strTigaretei3Schedules,
  ...strVanatorilor1Schedules,
  ...strVanatorilor2Schedules,
  ...sugasBaiSchedules,
  ...tribunalSchedules,
];

// ============================================================
// SEGÉDFÜGGVÉNYEK
// ============================================================

export function getStopById(
  id: string,
): Stop | undefined {
  return stops.find(
    (stop) => stop.id === id,
  );
}

export function getLineById(
  id: string,
): Line | undefined {
  return lines.find(
    (line) => line.id === id,
  );
}
