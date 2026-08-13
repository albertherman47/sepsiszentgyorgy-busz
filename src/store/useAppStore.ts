import { create } from 'zustand';
import type { Language, SelectedLineId, SelectedStopId } from '../types/bus';

export type ActiveTab = 'stops' | 'lines';

interface AppState {
  language: Language;
  selectedLineId: SelectedLineId;
  selectedStopId: SelectedStopId;
  searchQuery: string;
  flyToStopId: string | null;
  userLocation: { lat: number; lng: number } | null;
  activeTab: ActiveTab;

  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  setSelectedLineId: (id: SelectedLineId) => void;
  setSelectedStopId: (id: SelectedStopId) => void;
  setSearchQuery: (query: string) => void;
  requestFlyToStop: (id: string | null) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  language: 'hu',
  selectedLineId: null,
  selectedStopId: null,
  searchQuery: '',
  flyToStopId: null,
  userLocation: null,
  activeTab: 'stops',

  setLanguage: (language) => set({ language }),
  toggleLanguage: () =>
    set({ language: get().language === 'hu' ? 'ro' : 'hu' }),
  setSelectedLineId: (id) => set({ selectedLineId: id }),
  setSelectedStopId: (id) => set({ selectedStopId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  requestFlyToStop: (id) => set({ flyToStopId: id }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

