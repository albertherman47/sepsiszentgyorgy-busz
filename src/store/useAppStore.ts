import { create } from 'zustand';
import type { Language, SelectedLineId, SelectedStopId, TripOption } from '../types/bus';

export type ActiveTab =
  | 'dashboard'
  | 'lines'
  | 'schedules'
  | 'stops'
  | 'map'
  | 'planner';

interface AppState {
  language: Language;
  selectedLineId: SelectedLineId;
  selectedLineDirection: 'outbound' | 'return';
  selectedStopId: SelectedStopId;
  searchQuery: string;
  flyToStopId: string | null;
  userLocation: { lat: number; lng: number } | null;
  activeTab: ActiveTab;

  // Trip planner state
  plannerOriginStopId: string | null;
  plannerDestinationStopId: string | null;
  selectedTripOption: TripOption | null;

  // Full schedule modal state
  fullScheduleStopId: string | null;

  // Sidebar collapse state
  sidebarCollapsed: boolean;

  // Geolocation toast feedback
  geoToast: { message: string; type: 'info' | 'success' | 'error' } | null;

  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  setSelectedLineId: (id: SelectedLineId) => void;
  setSelectedLineDirection: (direction: 'outbound' | 'return') => void;
  toggleSelectedLineDirection: () => void;
  setSelectedStopId: (id: SelectedStopId) => void;
  setSearchQuery: (query: string) => void;
  requestFlyToStop: (id: string | null) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  setPlannerOriginStopId: (id: string | null) => void;
  setPlannerDestinationStopId: (id: string | null) => void;
  setSelectedTripOption: (option: TripOption | null) => void;
  swapPlannerStops: () => void;
  setFullScheduleStopId: (id: string | null) => void;
  setGeoToast: (toast: { message: string; type: 'info' | 'success' | 'error' } | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  language: 'hu',
  selectedLineId: null,
  selectedLineDirection: 'outbound',
  selectedStopId: null,
  searchQuery: '',
  flyToStopId: null,
  userLocation: null,
  activeTab: 'dashboard',

  plannerOriginStopId: null,
  plannerDestinationStopId: null,
  selectedTripOption: null,
  fullScheduleStopId: null,
  sidebarCollapsed: false,
  geoToast: null,

  setLanguage: (language) => set({ language }),
  toggleLanguage: () =>
    set({ language: get().language === 'hu' ? 'ro' : 'hu' }),
  setSelectedLineId: (id) => set({ selectedLineId: id, selectedLineDirection: 'outbound' }),
  setSelectedLineDirection: (direction) => set({ selectedLineDirection: direction }),
  toggleSelectedLineDirection: () =>
    set({
      selectedLineDirection:
        get().selectedLineDirection === 'outbound' ? 'return' : 'outbound',
    }),
  setSelectedStopId: (id) => set({ selectedStopId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  requestFlyToStop: (id) => set({ flyToStopId: id }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setPlannerOriginStopId: (id) => set({ plannerOriginStopId: id }),
  setPlannerDestinationStopId: (id) => set({ plannerDestinationStopId: id }),
  setSelectedTripOption: (option) => set({ selectedTripOption: option }),
  swapPlannerStops: () => {
    const { plannerOriginStopId, plannerDestinationStopId } = get();
    set({
      plannerOriginStopId: plannerDestinationStopId,
      plannerDestinationStopId: plannerOriginStopId,
    });
  },
  setFullScheduleStopId: (id) => set({ fullScheduleStopId: id }),
  setGeoToast: (toast) => set({ geoToast: toast }),
}));
