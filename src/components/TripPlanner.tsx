import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  LocateFixed,
  MapPin,
  Navigation,
  Footprints,
  Search,
  Check,
} from 'lucide-react';
import { useBusData } from '../hooks/useBusData';
import { useAppStore } from '../store/useAppStore';
import { findNearestStop, planTrip } from '../utils/tripPlanner';
import { formatCountdown } from '../utils/timeUtils';

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

type StopSearchProps = {
  value: string | null;
  stops: ReturnType<typeof useBusData>['stops'];
  stopName: ReturnType<typeof useBusData>['stopName'];
  placeholder: string;
  noResults: string;
  onSelect: (stopId: string) => void;
};

function StopSearch({
  value,
  stops,
  stopName,
  placeholder,
  noResults,
  onSelect,
}: StopSearchProps) {
  const selectedStop = useMemo(
    () => stops.find((stop) => stop.id === value) ?? null,
    [stops, value],
  );

  const [inputValue, setInputValue] = useState(
    selectedStop ? stopName(selectedStop) : '',
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Ha kívülről változik a stop:
  // nearest stop vagy swap esetén frissítjük az inputot.
  useEffect(() => {
    setInputValue(
      selectedStop ? stopName(selectedStop) : '',
    );
  }, [selectedStop, stopName]);

  const filteredStops = useMemo(() => {
    const query = normalizeSearch(inputValue.trim());

    const result = stops
      .filter((stop) => {
        if (!query) return true;

        const hu = normalizeSearch(stop.name_hu);
        const ro = normalizeSearch(stop.name_ro);

        return (
          hu.includes(query) ||
          ro.includes(query)
        );
      })
      .sort((a, b) =>
        stopName(a).localeCompare(stopName(b)),
      );

    return result.slice(0, 8);
  }, [inputValue, stops, stopName]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);

        // Ha nem választott semmit, állítsuk vissza
        // a korábban kiválasztott megálló nevét.
        setInputValue(
          selectedStop ? stopName(selectedStop) : '',
        );
      }
    };

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      );
    };
  }, [selectedStop, stopName]);

  const handleSelect = (
    stop: (typeof stops)[number],
  ) => {
    setInputValue(stopName(stop));
    setIsOpen(false);
    setActiveIndex(0);

    onSelect(stop.id);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Escape') {
      setIsOpen(false);

      setInputValue(
        selectedStop ? stopName(selectedStop) : '',
      );

      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      setActiveIndex((current) =>
        Math.min(
          current + 1,
          Math.max(filteredStops.length - 1, 0),
        ),
      );

      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      setActiveIndex((current) =>
        Math.max(current - 1, 0),
      );

      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      const stop = filteredStops[activeIndex];

      if (stop) {
        handleSelect(stop);
      }

      return;
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative min-w-0 flex-1"
    >
      <div className="flex items-center gap-1.5">
        <Search className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />

        <input
          type="text"
          value={inputValue}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => {
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onChange={(event) => {
            setInputValue(event.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="w-full min-w-0 bg-transparent text-xs font-semibold text-[var(--text-h)] outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-xl">
          <div className="max-h-[220px] overflow-y-auto p-1">
            {filteredStops.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-[var(--text-muted)]">
                {noResults}
              </div>
            ) : (
              filteredStops.map((stop, index) => {
                const isActive =
                  index === activeIndex;

                const isSelected =
                  stop.id === value;

                return (
                  <button
                    key={stop.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => handleSelect(stop)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition ${isActive
                        ? 'bg-[var(--brand-soft)] text-[var(--text-h)]'
                        : 'text-[var(--text-h)] hover:bg-[var(--surface)]'
                      }`}
                  >
                    <span className="min-w-0 truncate font-semibold">
                      {stopName(stop)}
                    </span>

                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TripPlanner() {
  const {
    language,
    stops,
    lines,
    schedules,
    now,
    stopName,
  } = useBusData();

  const plannerOriginStopId = useAppStore(
    (s) => s.plannerOriginStopId,
  );

  const plannerDestinationStopId = useAppStore(
    (s) => s.plannerDestinationStopId,
  );

  const selectedTripOption = useAppStore(
    (s) => s.selectedTripOption,
  );

  const setPlannerOriginStopId = useAppStore(
    (s) => s.setPlannerOriginStopId,
  );

  const setPlannerDestinationStopId = useAppStore(
    (s) => s.setPlannerDestinationStopId,
  );

  const setSelectedTripOption = useAppStore(
    (s) => s.setSelectedTripOption,
  );

  const swapPlannerStops = useAppStore(
    (s) => s.swapPlannerStops,
  );

  const userLocation = useAppStore(
    (s) => s.userLocation,
  );

  const setUserLocation = useAppStore(
    (s) => s.setUserLocation,
  );

  const requestFlyToStop = useAppStore(
    (s) => s.requestFlyToStop,
  );

  const t =
    language === 'hu'
      ? {
        from: 'Indulás',
        to: 'Érkezés',
        selectStop: 'Írj be egy megállót…',
        noResults: 'Nincs találat',
        nearestStop:
          'Legközelebbi megálló használata',
        swap:
          'Indulás és érkezés felcserélése',
        direct: 'Közvetlen járat',
        transfer: '1 átszállás',
        duration: 'menetidő',
        waitAt: 'várakozás:',
        noRoutes:
          'Nincs elérhető útvonal a kiválasztott megállók között.',
        chooseStops:
          'Válassz ki egy indulási és egy érkezési megállót az útvonaltervezéshez!',
        locateError:
          'Nem sikerült meghatározni a helyzetet',
      }
      : {
        from: 'Plecare',
        to: 'Sosire',
        selectStop: 'Scrie o stație…',
        noResults: 'Nu există rezultate',
        nearestStop:
          'Folosește cea mai apropiată stație',
        swap:
          'Inversează plecarea și sosirea',
        direct: 'Cursă directă',
        transfer: '1 schimbare',
        duration: 'durată',
        waitAt: 'așteptare:',
        noRoutes:
          'Nu există rute disponibile între stațiile selectate.',
        chooseStops:
          'Alege o stație de plecare și una de sosire pentru planificarea rutei!',
        locateError:
          'Nu s-a putut determina locația',
      };

  const handleNearestStop = () => {
    if (userLocation) {
      const nearest = findNearestStop(
        userLocation,
        stops,
      );

      if (nearest) {
        setPlannerOriginStopId(nearest.id);
        requestFlyToStop(nearest.id);
        return;
      }
    }

    if (!navigator.geolocation) {
      window.alert(t.locateError);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setUserLocation(loc);

        const nearest = findNearestStop(
          loc,
          stops,
        );

        if (nearest) {
          setPlannerOriginStopId(nearest.id);
          requestFlyToStop(nearest.id);
        }
      },
      () => window.alert(t.locateError),
      {
        enableHighAccuracy: true,
        timeout: 10_000,
      },
    );
  };

  const tripOptions = useMemo(() => {
    if (
      !plannerOriginStopId ||
      !plannerDestinationStopId
    ) {
      return [];
    }

    return planTrip(
      plannerOriginStopId,
      plannerDestinationStopId,
      now,
      schedules,
      lines,
      stops,
    );
  }, [
    plannerOriginStopId,
    plannerDestinationStopId,
    now,
    schedules,
    lines,
    stops,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* INPUT FORM */}
      <div className="space-y-3 border-b border-[var(--border)] bg-[var(--surface)]/50 p-4">
        <div className="relative flex items-center gap-2">
          <div className="flex-1 space-y-2.5">

            {/* ORIGIN */}
            <div className="relative flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 transition focus-within:border-[var(--brand)]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-600">
                A
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t.from}
                </p>

                <StopSearch
                  value={plannerOriginStopId}
                  stops={stops}
                  stopName={stopName}
                  placeholder={t.selectStop}
                  noResults={t.noResults}
                  onSelect={(stopId) => {
                    setPlannerOriginStopId(
                      stopId,
                    );
                    requestFlyToStop(stopId);
                  }}
                />
              </div>
            </div>

            {/* DESTINATION */}
            <div className="relative flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 transition focus-within:border-[var(--brand)]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-xs font-bold text-rose-600">
                B
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t.to}
                </p>

                <StopSearch
                  value={plannerDestinationStopId}
                  stops={stops}
                  stopName={stopName}
                  placeholder={t.selectStop}
                  noResults={t.noResults}
                  onSelect={(stopId) => {
                    setPlannerDestinationStopId(
                      stopId,
                    );
                    requestFlyToStop(stopId);
                  }}
                />
              </div>
            </div>
          </div>

          {/* SWAP */}
          <button
            type="button"
            onClick={swapPlannerStops}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--text-muted)] shadow-xs transition hover:bg-[var(--surface)] hover:text-[var(--brand)] active:scale-95"
            title={t.swap}
            aria-label={t.swap}
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>

        {/* NEAREST STOP */}
        <button
          type="button"
          onClick={handleNearestStop}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text-h)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          <LocateFixed className="h-3.5 w-3.5 text-[var(--brand)]" />
          {t.nearestStop}
        </button>
      </div>

      {/* RESULTS */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {!plannerOriginStopId ||
          !plannerDestinationStopId ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-[var(--text-muted)]">
            <Navigation className="h-10 w-10 opacity-30" />

            <p className="max-w-[240px] text-xs leading-relaxed">
              {t.chooseStops}
            </p>
          </div>
        ) : tripOptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-[var(--text-muted)]">
            <MapPin className="h-8 w-8 opacity-30" />

            <p className="text-xs font-medium">
              {t.noRoutes}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {language === 'hu'
                ? 'Ajánlott útvonalak'
                : 'Rute recomandate'}{' '}
              ({tripOptions.length})
            </p>

            {tripOptions.map((opt) => {
              const active =
                selectedTripOption?.id === opt.id;

              const isDirect = opt.isDirect;
              const firstSeg = opt.segments[0];
              const secondSeg = opt.segments[1];

              return (
                <div
                  key={opt.id}
                  onClick={() =>
                    setSelectedTripOption(opt)
                  }
                  className={`group relative cursor-pointer rounded-2xl border p-3.5 transition-all ${active
                      ? 'border-[var(--brand)] bg-[var(--brand-soft)]/20 shadow-md ring-2 ring-[var(--brand)]/20'
                      : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--brand)]/50 hover:shadow-xs'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--border)]/60 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${isDirect
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : 'bg-amber-500/15 text-amber-600'
                          }`}
                      >
                        {isDirect
                          ? t.direct
                          : t.transfer}
                      </span>

                      <span className="text-[11px] font-medium text-[var(--text-muted)]">
                        ~{opt.totalDurationMinutes}{' '}
                        {t.duration}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold tabular-nums ${opt.minutesUntilFirstDeparture <=
                          3
                          ? 'text-[var(--accent-warm)]'
                          : 'text-[var(--brand)]'
                        }`}
                    >
                      {formatCountdown(
                        opt.minutesUntilFirstDeparture,
                        language,
                      )}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg px-1 text-xs font-bold text-white shadow-xs"
                          style={{
                            backgroundColor:
                              firstSeg.line.color,
                          }}
                        >
                          {firstSeg.line.number}
                        </span>

                        <span className="truncate font-semibold text-[var(--text-h)]">
                          {stopName(
                            firstSeg.fromStop,
                          )}{' '}
                          →{' '}
                          {stopName(
                            firstSeg.toStop,
                          )}
                        </span>
                      </div>

                      <span className="ml-2 shrink-0 font-bold tabular-nums text-[var(--text-h)]">
                        {firstSeg.departureTimeLabel}{' '}
                        -{' '}
                        {firstSeg.arrivalTimeLabel}
                      </span>
                    </div>

                    {!isDirect &&
                      secondSeg &&
                      opt.transferStop && (
                        <>
                          <div className="flex items-center gap-2 rounded-lg bg-[var(--surface)] px-2 py-1.5 text-[11px] text-[var(--text-muted)]">
                            <Footprints className="h-3.5 w-3.5 shrink-0 text-amber-500" />

                            <span className="truncate">
                              {t.waitAt}{' '}
                              <strong className="font-semibold text-[var(--text-h)]">
                                {stopName(
                                  opt.transferStop,
                                )}
                              </strong>{' '}
                              (
                              {
                                opt.transferWaitMinutes
                              }{' '}
                              p)
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg px-1 text-xs font-bold text-white shadow-xs"
                                style={{
                                  backgroundColor:
                                    secondSeg.line
                                      .color,
                                }}
                              >
                                {
                                  secondSeg.line
                                    .number
                                }
                              </span>

                              <span className="truncate font-semibold text-[var(--text-h)]">
                                {stopName(
                                  secondSeg.fromStop,
                                )}{' '}
                                →{' '}
                                {stopName(
                                  secondSeg.toStop,
                                )}
                              </span>
                            </div>

                            <span className="ml-2 shrink-0 font-bold tabular-nums text-[var(--text-h)]">
                              {
                                secondSeg.departureTimeLabel
                              }{' '}
                              -{' '}
                              {
                                secondSeg.arrivalTimeLabel
                              }
                            </span>
                          </div>
                        </>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}