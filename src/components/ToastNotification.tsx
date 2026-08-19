import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function ToastNotification() {
  const geoToast = useAppStore((s) => s.geoToast);
  const setGeoToast = useAppStore((s) => s.setGeoToast);

  if (!geoToast) return null;

  const isError = geoToast.type === 'error';
  const isSuccess = geoToast.type === 'success';
  const isInfo = geoToast.type === 'info';

  return (
    <div className="fixed top-4 left-1/2 z-[9999] -translate-x-1/2 max-w-[92vw] w-auto animate-in fade-in slide-in-from-top-4 duration-200">
      <div
        className={`
          flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-2xl border backdrop-blur-md text-xs font-semibold
          ${
            isError
              ? 'bg-rose-900/95 text-rose-50 border-rose-700/80 shadow-rose-950/30'
              : isSuccess
                ? 'bg-emerald-900/95 text-emerald-50 border-emerald-700/80 shadow-emerald-950/30'
                : 'bg-slate-900/95 text-slate-50 border-slate-700/80 shadow-slate-950/30'
          }
        `}
      >
        {isInfo && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-400" />}
        {isSuccess && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
        {isError && <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />}

        <span className="leading-snug">{geoToast.message}</span>

        <button
          type="button"
          onClick={() => setGeoToast(null)}
          className="ml-2 rounded-lg p-1 text-white/70 hover:text-white hover:bg-white/10 transition"
          aria-label="Bezárás"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
