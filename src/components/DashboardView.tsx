import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  Map as MapIcon,
  MapPin,
  Navigation,
  Phone,
  Route,
  Sparkles,
} from 'lucide-react';
import { lines, schedules, getStopById } from '../data/busData';
import { useAppStore } from '../store/useAppStore';
import { useBusData, getLineEndpoints } from '../hooks/useBusData';
import { getNextDeparture } from '../utils/timeUtils';
import type { Line, Stop } from '../types/bus';

export function DashboardView() {
  const language = useAppStore((s) => s.language);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setSelectedLineId = useAppStore((s) => s.setSelectedLineId);
  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const requestFlyToStop = useAppStore((s) => s.requestFlyToStop);

  const { stopName, lineName } = useBusData();
  const hu = language === 'hu';

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString(hu ? 'hu-HU' : 'ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = currentTime.toLocaleDateString(hu ? 'hu-HU' : 'ro-RO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate greeting
  const hour = currentTime.getHours();
  const greeting = hu
    ? hour < 9
      ? 'Jó reggelt'
      : hour < 18
      ? 'Jó napot kívánunk'
      : 'Jó estét kívánunk'
    : hour < 9
    ? 'Bună dimineața'
    : hour < 18
    ? 'Bună ziua'
    : 'Bună seara';

  // Compute live next departures across prominent city stops
  const liveDepartures = useMemo(() => {
    const prominentStopIds = [
      'piata-kalvin',
      'gara-cfr-1',
      'gara-cfr-2',
      'arena-sepsi',
      'parc-elisabeta',
      'centru-comercial',
      'cart-ciucului',
      'primaria-arcus',
    ];

    const results: {
      scheduleId: string;
      line: Line;
      stop: Stop;
      timeLabel: string;
      minutesUntil: number;
    }[] = [];

    prominentStopIds.forEach((stopId) => {
      const stop = getStopById(stopId);
      if (!stop) return;

      schedules.forEach((sch) => {
        if (sch.stopId === stopId) {
          const line = lines.find((l) => l.id === sch.lineId);
          if (!line) return;

          const next = getNextDeparture(sch, currentTime);
          if (next && next.minutesUntil >= 0 && next.minutesUntil <= 90) {
            results.push({
              scheduleId: `${sch.lineId}-${sch.stopId}-${next.timeLabel}`,
              line,
              stop,
              timeLabel: next.timeLabel,
              minutesUntil: next.minutesUntil,
            });
          }
        }
      });
    });

    return results
      .sort((a, b) => a.minutesUntil - b.minutesUntil)
      .slice(0, 8);
  }, [currentTime]);

  // Major destinations / Hubs
  const cityHubs = [
    {
      id: 'arena',
      titleHu: 'Sepsi Aréna & Sportközpont',
      titleRo: 'Sepsi Arena & Complex Sportiv',
      subtitleHu: 'Sportesemények, rendezvények',
      subtitleRo: 'Evenimente sportive',
      stopId: 'arena-sepsi',
      lines: ['1', '2', '5'],
      icon: '🏟️',
      color: '#4361ee',
    },
    {
      id: 'gara',
      titleHu: 'Vasútállomás (Gara CFR)',
      titleRo: 'Gara CFR Sfântu Gheorghe',
      subtitleHu: 'Vonatcsatlakozások & Állomás tér',
      subtitleRo: 'Conexiuni feroviare',
      stopId: 'gara-cfr-1',
      lines: ['1', '2', '4', '5'],
      icon: '🚆',
      color: '#e63946',
    },
    {
      id: 'center',
      titleHu: 'Belváros & Erzsébet Park',
      titleRo: 'Centru & Parcul Elisabeta',
      subtitleHu: 'Közigazgatás, üzletek, sétálóutca',
      subtitleRo: 'Administrație, magazine',
      stopId: 'parc-elisabeta',
      lines: ['1', '2', '3', '5', '7'],
      icon: '🏛️',
      color: '#657933',
    },
    {
      id: 'arcus',
      titleHu: 'Árkos Község',
      titleRo: 'Comuna Arcuș',
      subtitleHu: 'Kastély & Helyközi összeköttetés',
      subtitleRo: 'Castel & Legătură zonală',
      stopId: 'primaria-arcus',
      lines: ['7'],
      icon: '🏰',
      color: '#8338ec',
    },
    {
      id: 'szepmezo',
      titleHu: 'Szépmező Ipari Park',
      titleRo: 'Parc Industrial Câmpul Frumos',
      subtitleHu: 'Műszakjáratok & Ipari övezet',
      subtitleRo: 'Zonă industrială',
      stopId: 'campul-frumos',
      lines: ['1D', '5D'],
      icon: '🏭',
      color: '#f77f00',
    },
    {
      id: 'chilieni',
      titleHu: 'Kilyén & Szotyor',
      titleRo: 'Chilieni & Coșeni',
      subtitleHu: 'Déli városrészek',
      subtitleRo: 'Zonele sudice',
      stopId: 'chilieni',
      lines: ['3', '5'],
      icon: '🏡',
      color: '#2a9d8f',
    },
  ];

  const handleOpenLine = (lineId: string) => {
    setSelectedLineId(lineId);
    setActiveTab('lines');
  };

  const handleOpenStopOnMap = (stopId: string) => {
    setSelectedStopId(stopId);
    requestFlyToStop(stopId);
    setActiveTab('map');
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full pb-10">
      {/* =========================================================================
          1. HERO BANNER & LIVE SYSTEM STATUS
          ========================================================================= */}
      <div className="bg-gradient-to-br from-[#657933] via-[#526328] to-[#3a471b] text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between gap-6">
        {/* Subtle background glow pattern */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-[#eeffc0]/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/20 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#eeffc0] animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-[#eeffc0]">
                {hu ? 'Sepsiszentgyörgy Városi Közlekedés' : 'Transport Public Sfântu Gheorghe'}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              {greeting}!
            </h1>
            <p className="text-sm md:text-base font-semibold text-white/90 mt-1 capitalize">
              {dateString}
            </p>
          </div>

          {/* Live Clock & Network Badge */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 bg-black/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#eeffc0]" />
              <span className="font-mono text-xl md:text-2xl font-black text-white tracking-wider">
                {timeString}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black text-[#eeffc0]">
              <CheckCircle2 className="h-4 w-4" />
              <span>{hu ? 'Minden járat közlekedik' : 'Toate liniile active'}</span>
            </div>
          </div>
        </div>

        {/* 4 Large Quick Action Launchers (Senior Friendly, High Contrast) */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className="flex flex-col items-start gap-1 p-3.5 sm:p-4 rounded-2xl bg-white/95 hover:bg-white text-[#191d15] shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer text-left"
          >
            <div className="p-2 rounded-xl bg-[#ecefe2] text-[#657933] mb-1">
              <MapIcon className="h-6 w-6 stroke-[2.5px]" />
            </div>
            <span className="text-sm sm:text-base font-black text-[#191d15] leading-tight">
              {hu ? 'Élő Térkép' : 'Hartă Interactivă'}
            </span>
            <span className="text-xs font-bold text-[#505747]">
              {hu ? 'Útvonalak & megállók' : 'Trasee și stații'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedules')}
            className="flex flex-col items-start gap-1 p-3.5 sm:p-4 rounded-2xl bg-white/95 hover:bg-white text-[#191d15] shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer text-left"
          >
            <div className="p-2 rounded-xl bg-[#ecefe2] text-[#657933] mb-1">
              <Calendar className="h-6 w-6 stroke-[2.5px]" />
            </div>
            <span className="text-sm sm:text-base font-black text-[#191d15] leading-tight">
              {hu ? 'Menetrendek' : 'Orare de circulație'}
            </span>
            <span className="text-xs font-bold text-[#505747]">
              {hu ? 'Napi járatindulások' : 'Plecări zilnice'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className="flex flex-col items-start gap-1 p-3.5 sm:p-4 rounded-2xl bg-white/95 hover:bg-white text-[#191d15] shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer text-left"
          >
            <div className="p-2 rounded-xl bg-[#ecefe2] text-[#657933] mb-1">
              <Compass className="h-6 w-6 stroke-[2.5px]" />
            </div>
            <span className="text-sm sm:text-base font-black text-[#191d15] leading-tight">
              {hu ? 'Útvonaltervező' : 'Planificator'}
            </span>
            <span className="text-xs font-bold text-[#505747]">
              {hu ? 'A-ból B-be utazás' : 'Calculare traseu'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stops')}
            className="flex flex-col items-start gap-1 p-3.5 sm:p-4 rounded-2xl bg-white/95 hover:bg-white text-[#191d15] shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer text-left"
          >
            <div className="p-2 rounded-xl bg-[#ecefe2] text-[#657933] mb-1">
              <MapPin className="h-6 w-6 stroke-[2.5px]" />
            </div>
            <span className="text-sm sm:text-base font-black text-[#191d15] leading-tight">
              {hu ? '60+ Megálló' : '60+ Stații'}
            </span>
            <span className="text-xs font-bold text-[#505747]">
              {hu ? 'Megállóhelyek keresője' : 'Căutare stații'}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. LIVE DEPARTURES BOARD (Következő indulások a városban)
          ========================================================================= */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-[#DDE1D6] shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE1D6] pb-4">
          <div>
            <h2 className="text-lg md:text-xl font-black text-[#191d15] flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#657933]" />
              <span>{hu ? 'Következő indulások a főbb csomópontokról' : 'Plecări următoare din noduri principale'}</span>
            </h2>
            <p className="text-xs md:text-sm font-semibold text-[#505747] mt-0.5">
              {hu
                ? 'Valós idejű menetrendi visszaszámláló a legforgalmasabb megállókhoz'
                : 'Numărătoare inversă în timp real pentru cele mai circulate stații'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('schedules')}
            className="inline-flex items-center gap-1.5 text-xs font-black text-[#657933] hover:text-[#4a5a22] hover:underline cursor-pointer self-start sm:self-auto"
          >
            <span>{hu ? 'Összes menetrend megtekintése' : 'Vezi toate orarele'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {liveDepartures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {liveDepartures.map((dep) => (
              <div
                key={dep.scheduleId}
                className="bg-[#f8f9f4] hover:bg-[#ecefe2] p-3.5 rounded-2xl border border-[#DDE1D6] flex flex-col justify-between gap-3 transition-colors group cursor-pointer"
                onClick={() => handleOpenStopOnMap(dep.stop.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex h-8 px-2.5 items-center justify-center rounded-xl text-xs font-black text-white shadow-2xs"
                    style={{ backgroundColor: dep.line.color }}
                  >
                    {dep.line.number}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                      dep.minutesUntil <= 5
                        ? 'bg-amber-100 text-amber-900 animate-pulse'
                        : 'bg-[#ecefe2] text-[#505747]'
                    }`}
                  >
                    {dep.minutesUntil === 0
                      ? hu
                        ? 'Most indul!'
                        : 'Pleacă acum!'
                      : hu
                      ? `${dep.minutesUntil} perc`
                      : `${dep.minutesUntil} min`}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-sm text-[#191d15] line-clamp-1">
                    {stopName(dep.stop)}
                  </h3>
                  <p className="text-xs font-bold text-[#73796D] line-clamp-1">
                    {lineName(dep.line)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#DDE1D6]/60 text-xs font-black">
                  <span className="text-[#191d15]">{dep.timeLabel}</span>
                  <span className="text-[#657933] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>{hu ? 'Térképen' : 'Pe hartă'}</span>
                    <Navigation className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-[#73796D] text-sm font-semibold">
            {hu
              ? 'A mai napra a menetrend szerinti járatok lezárultak.'
              : 'Cursele programate pentru astăzi s-au încheiat.'}
          </div>
        )}
      </div>

      {/* =========================================================================
          3. ALL ACTIVE BUS LINES OVERVIEW (Járatok áttekintése)
          ========================================================================= */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-[#DDE1D6] shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE1D6] pb-4">
          <div>
            <h2 className="text-lg md:text-xl font-black text-[#191d15] flex items-center gap-2">
              <Route className="h-5 w-5 text-[#657933]" />
              <span>{hu ? 'Sepsiszentgyörgy buszjáratai' : 'Liniile de autobuz din Sfântu Gheorghe'}</span>
            </h2>
            <p className="text-xs md:text-sm font-semibold text-[#505747] mt-0.5">
              {hu
                ? 'Kattintson egy járatra a megállók, menetidők és az útvonal megtekintéséhez!'
                : 'Click pe o linie pentru a vedea traseul complet, timpii și stațiile!'}
            </p>
          </div>

          <span className="px-3 py-1 bg-[#ecefe2] text-[#657933] text-xs font-black rounded-xl self-start sm:self-auto">
            {lines.length} {hu ? 'aktív vonal' : 'linii active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {lines.map((line) => {
            const endpoints = getLineEndpoints(line, 'outbound', language);
            return (
              <div
                key={line.id}
                onClick={() => handleOpenLine(line.id)}
                className="bg-[#f8f9f4] hover:bg-[#ecefe2] p-4 rounded-2xl border-2 border-[#DDE1D6] hover:border-[#657933] transition-all flex flex-col justify-between gap-3 group cursor-pointer shadow-2xs hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-9 min-w-9 px-2.5 items-center justify-center rounded-xl text-sm font-black text-white shadow-xs"
                      style={{ backgroundColor: line.color }}
                    >
                      {line.number}
                    </span>
                    <span className="font-black text-sm text-[#191d15]">
                      {line.number}. {hu ? 'járat' : 'linia'}
                    </span>
                  </div>

                  <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-white border border-[#DDE1D6] text-[#505747]">
                    {line.stopIds.length} {hu ? 'megálló' : 'stații'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#191d15] mb-0.5">
                    <span className="truncate">{endpoints.start}</span>
                    <span className="text-[#657933]">➔</span>
                    <span className="truncate">{endpoints.end}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#73796D] line-clamp-1">
                    {lineName(line)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#DDE1D6] text-xs font-black text-[#657933]">
                  <span>{hu ? 'Részletes útvonal' : 'Traseu detaliat'}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          4. POPULAR CITY DESTINATIONS & HUBS
          ========================================================================= */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-[#DDE1D6] shadow-sm flex flex-col gap-4">
        <div className="border-b border-[#DDE1D6] pb-4">
          <h2 className="text-lg md:text-xl font-black text-[#191d15] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#657933]" />
            <span>{hu ? 'Kiemelt úti célok & Csomópontok' : 'Destinații cheie & Noduri'}</span>
          </h2>
          <p className="text-xs md:text-sm font-semibold text-[#505747] mt-0.5">
            {hu
              ? 'Gyors elérés a város legfontosabb intézményeihez és helyszíneihez'
              : 'Acces rapid către principalele locații și instituții'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {cityHubs.map((hub) => (
            <div
              key={hub.id}
              onClick={() => handleOpenStopOnMap(hub.stopId)}
              className="bg-[#f8f9f4] hover:bg-[#ecefe2] p-4 rounded-2xl border border-[#DDE1D6] hover:border-[#657933] transition-all flex flex-col justify-between gap-3 group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl p-2 bg-white rounded-xl border border-[#DDE1D6] shrink-0 shadow-2xs">
                  {hub.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-sm md:text-base text-[#191d15] leading-tight">
                    {hu ? hub.titleHu : hub.titleRo}
                  </h3>
                  <p className="text-xs font-bold text-[#73796D] mt-0.5">
                    {hu ? hub.subtitleHu : hub.subtitleRo}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#DDE1D6] text-xs font-black">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-[#505747] mr-1">
                    {hu ? 'Járatok:' : 'Linii:'}
                  </span>
                  {hub.lines.map((num) => (
                    <span
                      key={num}
                      className="px-1.5 py-0.5 rounded-md bg-[#657933] text-white text-[10px] font-black"
                    >
                      {num}
                    </span>
                  ))}
                </div>
                <span className="text-[#657933] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>{hu ? 'Ugrás ide' : 'Mergi aici'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          5. PASSENGER INFO & USEFUL CITY INFORMATION
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ticket & Tariff card */}
        <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-[#DDE1D6] shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#657933] mb-1">
              <CreditCard className="h-5 w-5" />
              <h3 className="font-black text-base text-[#191d15]">
                {hu ? 'Jegyek & Bérletárak' : 'Bilete și Abonamente'}
              </h3>
            </div>
            <p className="text-xs font-semibold text-[#505747] mb-3">
              {hu
                ? 'A MultiTrans Rt. hivatalos helyi utazási tarifái'
                : 'Tarifele oficiale de călătorie MultiTrans'}
            </p>

            <ul className="space-y-2 text-xs font-bold text-[#191d15]">
              <li className="flex items-center justify-between p-2 rounded-xl bg-[#f8f9f4]">
                <span>{hu ? 'Vonaljegy (1 utazás)' : 'Bilet 1 călătorie'}</span>
                <span className="font-black text-[#657933]">3,00 RON</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-xl bg-[#f8f9f4]">
                <span>{hu ? 'SMS jegyvásárlás (24h napijegy)' : 'Bilet SMS 24 ore'}</span>
                <span className="font-black text-[#657933]">10,00 RON</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-xl bg-[#f8f9f4]">
                <span>{hu ? 'Havi összvonalas bérlet' : 'Abonament lunar general'}</span>
                <span className="font-black text-[#657933]">90,00 RON</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-xl bg-[#f8f9f4]">
                <span>{hu ? 'Nyugdíjasok (70 év felett) & Diákok' : 'Pensionari 70+ & Elevi'}</span>
                <span className="font-black text-[#3F8F5B] uppercase">
                  {hu ? 'Díjmentes' : 'Gratuit'}
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-[#DDE1D6] flex items-center justify-between text-xs font-black text-[#505747]">
            <span>{hu ? 'SMS-ben: 7458-as szám' : 'Prin SMS: la 7458'}</span>
            <span className="text-[#657933]">{hu ? 'MultiTrans Rt.' : 'MultiTrans'}</span>
          </div>
        </div>

        {/* Dispatcher & Contact Info */}
        <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-[#DDE1D6] shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#657933] mb-1">
              <Phone className="h-5 w-5" />
              <h3 className="font-black text-base text-[#191d15]">
                {hu ? 'Közlekedési Ügyfélszolgálat' : 'Relații cu Publicul'}
              </h3>
            </div>
            <p className="text-xs font-semibold text-[#505747] mb-3">
              {hu
                ? 'MultiTrans Rt. Sepsiszentgyörgy diszpécserszolgálat'
                : 'Dispecerat MultiTrans Sfântu Gheorghe'}
            </p>

            <div className="space-y-2 text-xs font-bold text-[#191d15]">
              <div className="p-3 rounded-xl bg-[#f8f9f4] flex flex-col gap-1">
                <span className="text-[#73796D] text-[11px] font-black uppercase">
                  {hu ? 'Diszpécser telefonszám:' : 'Dispecerat:'}
                </span>
                <a
                  href="tel:+40267315570"
                  className="font-black text-sm text-[#657933] hover:underline"
                >
                  +40 267 315 570
                </a>
              </div>

              <div className="p-3 rounded-xl bg-[#f8f9f4] flex flex-col gap-1">
                <span className="text-[#73796D] text-[11px] font-black uppercase">
                  {hu ? 'Központi iroda:' : 'Sediu central:'}
                </span>
                <span>Str. Fabricii nr. 1, Sfântu Gheorghe</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#DDE1D6] flex items-center justify-between text-xs font-black text-[#505747]">
            <span>{hu ? 'H-P: 06:00 - 22:00' : 'L-V: 06:00 - 22:00'}</span>
            <span className="text-[#657933]">{hu ? 'Szo-Vas: 07:00 - 20:00' : 'S-D: 07:00 - 20:00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
