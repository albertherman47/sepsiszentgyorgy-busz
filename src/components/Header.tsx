import { Bell, Languages } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SepsiBusLogo } from './SepsiBusLogo';

const labels = {
  hu: {
    title: 'Sepsi Busz',
    subtitle: 'Menetrend & térkép',
    lang: 'RO',
    languageLabel: 'Váltás románra',
    notifications: 'Értesítések',
  },

  ro: {
    title: 'Sepsi Busz',
    subtitle: 'Orar & hartă',
    lang: 'HU',
    languageLabel: 'Schimbă în maghiară',
    notifications: 'Notificări',
  },
} as const;

export function Header() {
  const language = useAppStore((s) => s.language);
  const toggleLanguage = useAppStore((s) => s.toggleLanguage);

  const t = labels[language];

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-4 py-3.5">
      {/* Brand */}
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F8F4] border border-[#DDE1D6] p-1"
          aria-hidden
        >
          <SepsiBusLogo variant="mark" className="w-8 h-8" />
        </div>

        <div className="min-w-0 text-left">
          <h1 className="truncate font-[family-name:var(--font-display)] text-[16px] font-extrabold tracking-tight text-[#191d15]">
            {t.title}
          </h1>

          <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--text-muted)]">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Live */}
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 lg:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </span>

        {/* Notifications */}
        <button
          type="button"
          className="hidden h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-h)] lg:inline-flex"
          aria-label={t.notifications}
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Language */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[11px] font-black text-[var(--text-h)] transition hover:border-[var(--brand)] hover:bg-white hover:text-[var(--brand)]"
          aria-label={t.languageLabel}
        >
          <Languages className="h-3.5 w-3.5" aria-hidden />

          {t.lang}
        </button>
      </div>
    </header>
  );
}