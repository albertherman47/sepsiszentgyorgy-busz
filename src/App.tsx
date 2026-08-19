import { useState } from 'react';
import {
  Compass,
} from 'lucide-react';
import { MapView } from './components/Map';
import { MapLineSelector } from './components/MapLineSelector';
import { DashboardView } from './components/DashboardView';
import { LinesView } from './components/LinesView';
import { SideNavBar } from './components/SideNavBar';
import { TopNavBar } from './components/TopNavBar';
import { BottomNavBar } from './components/BottomNavBar';
import { TimetableManagement } from './components/TimetableManagement';
import { StopList } from './components/StopList';
import { StopCard } from './components/StopCard';
import { TripPlanner } from './components/TripPlanner';
import { FullScheduleModal } from './components/FullScheduleModal';
import { ToastNotification } from './components/ToastNotification';
import { useAppStore } from './store/useAppStore';
import { useBusData } from './hooks/useBusData';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTab = useAppStore((s) => s.activeTab);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  const { language, selectedStop } = useBusData();
  const hu = language === 'hu';

  // Full-screen map condition
  const isMapView = activeTab === 'map';

  return (
    <div className="bg-[#F7F8F4] text-[#191d15] min-h-screen flex font-sans antialiased text-sm pb-20 md:pb-0">
      {/* Toast Feedback */}
      <ToastNotification />

      {/* Full Timetable Modal */}
      <FullScheduleModal />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SideNavBar - Hidden on desktop when collapsed or on full map */}
      {!isMapView ? (
        <SideNavBar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
      ) : mobileMenuOpen ? (
        <SideNavBar
          mobileOpen={true}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
      ) : null}

      {/* Main Content Wrapper */}
      {isMapView ? (
        /* =========================================================================
           FULL-SCREEN MAP VIEW (Zero margins, zero padding, 100% viewport coverage)
           ========================================================================= */
        <div className="w-full h-screen h-[100dvh] m-0 p-0 overflow-hidden relative flex flex-col">
          {/* Map Canvas */}
          <div className="w-full h-full relative">
            <MapView />
          </div>

          {/* Floating Line Selector and Menu Bar */}
          <MapLineSelector onOpenMenu={() => setMobileMenuOpen(true)} />

          {/* Floating Selected Stop Card Overlay if a stop is clicked */}
          {selectedStop && (
            <div className="absolute bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-[420px] max-h-[75vh] z-30 bg-white rounded-3xl border-2 border-[#657933] shadow-2xl overflow-hidden flex flex-col pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-4">
              <StopCard variant="panel" />
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
           STANDARD VIEW (Sidebar + TopNavBar + Content with comfortable spacing)
           ========================================================================= */
        <div
          className={`
            flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300
            ${sidebarCollapsed ? 'md:ml-0' : 'md:ml-[280px]'}
          `}
        >
          {/* TopNavBar (Fixed 64px header) */}
          <TopNavBar
            mobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          />

          {/* Page Content Canvas */}
          <main className="flex-1 pt-18 md:pt-20 px-3 md:px-6 pb-6 md:pb-8 flex flex-col gap-4 md:gap-6 w-full min-w-0 max-w-7xl mx-auto">
            {activeTab === 'dashboard' ? (
              /* Városi Közlekedési Irányítópult (Dashboard) */
              <DashboardView />
            ) : activeTab === 'schedules' ? (
              /* Menetrendek View (Exact Stitch Timetable Management design) */
              <TimetableManagement />
            ) : activeTab === 'stops' ? (
              /* Megállók Explorer View */
              <StopList />
            ) : activeTab === 'planner' ? (
              /* Útvonaltervező View */
              <div className="bg-white rounded-2xl border-2 border-[#DDE1D6] p-4 md:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-[#DDE1D6] mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-[#191d15] flex items-center gap-2.5">
                      <Compass className="h-6 w-6 text-[#657933]" />
                      <span>{hu ? 'Útvonaltervező A-ból B-be' : 'Planificator de rute'}</span>
                    </h2>
                    <p className="text-xs md:text-sm font-semibold text-[#505747] mt-1">
                      {hu
                        ? 'Válassza ki az indulási és érkezési megállót a leggyorsabb buszjárat megtalálásához!'
                        : 'Alegeți stația de plecare și sosire pentru a găsi cel mai rapid traseu!'}
                    </p>
                  </div>
                </div>
                <TripPlanner />
              </div>
            ) : (
              /* Járatok View (Újragondolt, nem végtelenül görgetős kártyarács & metró nézet) */
              <LinesView />
            )}
          </main>
        </div>
      )}

      {/* 2026 Senior-Friendly Bottom Mobile Navigation Bar */}
      <BottomNavBar />
    </div>
  );
}
