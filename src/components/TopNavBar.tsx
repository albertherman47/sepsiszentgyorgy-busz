import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bus,
  Globe,
  MapPin,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Search,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { lines, stops } from '../data/busData';
import { useBusData } from '../hooks/useBusData';
import type { Line, Stop } from '../types/bus';

interface TopNavBarProps {
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

export function TopNavBar({ onToggleMobileMenu, mobileMenuOpen }: TopNavBarProps) {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const language = useAppStore((s) => s.language);
  const toggleLanguage = useAppStore((s) => s.toggleLanguage);
  const setSelectedLineId = useAppStore((s) => s.setSelectedLineId);
  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const requestFlyToStop = useAppStore((s) => s.requestFlyToStop);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const { lineName, stopName } = useBusData();
  const hu = language === 'hu';

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter lines and stops based on search query
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { matchedLines: [], matchedStops: [] };

    const matchedLines = lines.filter((l: Line) => {
      return (
        l.number.toLowerCase().includes(q) ||
        l.name_hu.toLowerCase().includes(q) ||
        l.name_ro.toLowerCase().includes(q)
      );
    });

    const matchedStops = stops.filter((s: Stop) => {
      return (
        s.name_hu.toLowerCase().includes(q) ||
        s.name_ro.toLowerCase().includes(q)
      );
    });

    return {
      matchedLines: matchedLines.slice(0, 5),
      matchedStops: matchedStops.slice(0, 8),
    };
  }, [searchQuery]);

  const handleSelectLine = (line: Line) => {
    setSelectedLineId(line.id);
    setActiveTab('lines');
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleSelectStop = (stop: Stop) => {
    setSelectedStopId(stop.id);
    requestFlyToStop(stop.id);
    setActiveTab('stops');
    setSearchQuery('');
    setIsOpen(false);
  };

  const totalResults = searchResults.matchedLines.length + searchResults.matchedStops.length;

  return (
    <header
      className={`
        fixed top-0 right-0 h-16 bg-white border-b border-[#DDE1D6] flex justify-between items-center px-4 md:px-6 z-30 shadow-2xs transition-all duration-300
        ${sidebarCollapsed ? 'w-full' : 'w-full md:w-[calc(100%-280px)]'}
      `}
    >
      {/* Left: Sidebar Toggle Button & Search Input */}
      <div ref={containerRef} className="flex items-center gap-3 min-w-0 flex-1 max-w-lg relative">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-[#73796D] hover:bg-[#ecefe2] hover:text-[#191d15] transition-colors cursor-pointer"
          aria-label={mobileMenuOpen ? 'Menü bezárása' : 'Menü megnyitása'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden md:flex items-center justify-center p-2 rounded-lg text-[#73796D] hover:bg-[#ecefe2] hover:text-[#191d15] border border-[#DDE1D6] transition-all cursor-pointer shrink-0"
          title={sidebarCollapsed ? (hu ? 'Oldalsáv megnyitása' : 'Deschide meniul') : (hu ? 'Oldalsáv becsukása' : 'Închide meniul')}
          aria-label="Oldalsáv váltása"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4 text-[#657933]" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-[#73796D]" />
          )}
        </button>

        {/* Search Bar Input */}
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3 text-[#73796D] h-4 w-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false);
            }}
            placeholder={hu ? 'Keresés járatok, megállók között...' : 'Search routes, stops...'}
            className="w-full pl-9 pr-8 py-2 bg-[#ecefe2]/70 border border-[#DDE1D6] rounded-xl text-sm text-[#191d15] placeholder:text-[#73796D] focus:bg-white focus:border-[#657933] focus:ring-1 focus:ring-[#657933] outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsOpen(false);
              }}
              className="absolute right-2.5 p-1 rounded-md text-[#73796D] hover:text-[#191d15] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Interactive Search Autocomplete Results Dropdown */}
        {isOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#DDE1D6] shadow-xl overflow-hidden z-50 max-h-[75vh] flex flex-col">
            <div className="p-2.5 border-b border-[#DDE1D6] bg-[#ecefe2]/50 flex items-center justify-between text-xs font-bold text-[#73796D]">
              <span>{hu ? 'Keresési találatok' : 'Search Results'}</span>
              <span>{totalResults} {hu ? 'találat' : 'results'}</span>
            </div>

            <div className="overflow-y-auto p-2 flex flex-col gap-3">
              {totalResults === 0 ? (
                <div className="p-4 text-center text-xs text-[#73796D]">
                  {hu ? 'Nincs találat erre a keresésre.' : 'No matching routes or stops.'}
                </div>
              ) : (
                <>
                  {/* Matching Routes */}
                  {searchResults.matchedLines.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#73796D] px-2 mb-1">
                        {hu ? 'Járatok' : 'Routes'}
                      </div>
                      <div className="flex flex-col gap-1">
                        {searchResults.matchedLines.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => handleSelectLine(l)}
                            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#ecefe2] text-left transition-colors cursor-pointer group"
                          >
                            <span
                              className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs"
                              style={{ backgroundColor: l.color || '#657933' }}
                            >
                              {l.number}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[#191d15] group-hover:text-[#657933] truncate">
                                {l.number}. {lineName(l)}
                              </div>
                              <div className="text-[10px] text-[#73796D] truncate">
                                {l.stopIds.length} {hu ? 'megálló' : 'stații'}
                              </div>
                            </div>
                            <Bus className="h-3.5 w-3.5 text-[#73796D] shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Stops */}
                  {searchResults.matchedStops.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#73796D] px-2 mb-1">
                        {hu ? 'Megállók' : 'Stops'}
                      </div>
                      <div className="flex flex-col gap-1">
                        {searchResults.matchedStops.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectStop(s)}
                            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#ecefe2] text-left transition-colors cursor-pointer group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#657933]/10 text-[#657933] flex items-center justify-center shrink-0">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[#191d15] group-hover:text-[#657933] truncate">
                                {stopName(s)}
                              </div>
                              <div className="text-[10px] text-[#73796D] truncate">
                                {s.lineIds.join(', ')} {hu ? 'járatok' : 'linii'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Actions: Clean, only Language switch */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDE1D6] bg-[#F7F8F4] text-xs font-extrabold text-[#191d15] hover:border-[#657933] hover:text-[#657933] transition-all cursor-pointer shadow-2xs"
          title={hu ? 'Váltás román nyelvre' : 'Schimbă în maghiară'}
        >
          <Globe className="h-3.5 w-3.5 text-[#657933]" />
          <span>{language === 'hu' ? 'RO' : 'HU'}</span>
        </button>
      </div>
    </header>
  );
}
