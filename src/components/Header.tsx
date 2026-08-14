import { Bell, Bus, Languages } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const labels = {
  hu: {
    title: 'Sepsiszentgyörgy Busz',
    subtitle: 'Menetrend & térkép',
    lang: 'RO',
    languageLabel: 'Váltás románra',
    notifications: 'Értesítések',
  },

  ro: {
    title: 'Autobuz Sfântu Gheorghe',
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
          className="brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
          aria-hidden
        >
          <Bus
            className="h-[18px] w-[18px]"
            strokeWidth={2.4}
          />
        </div>

        <div className="min-w-0 text-left">
          <h1 className="truncate font-[family-name:var(--font-display)] text-[16px] font-bold tracking-tight text-[var(--text-h)]">
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