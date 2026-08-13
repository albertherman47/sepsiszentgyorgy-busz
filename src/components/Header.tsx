import { Bus, Languages } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const labels = {
  hu: {
    title: 'Sepsiszentgyörgy Busz',
    subtitle: 'Menetrend & térkép',
    lang: 'RO',
  },
  ro: {
    title: 'Autobuz Sfântu Gheorghe',
    subtitle: 'Orar & hartă',
    lang: 'HU',
  },
} as const;

export function Header() {
  const language = useAppStore((s) => s.language);
  const toggleLanguage = useAppStore((s) => s.toggleLanguage);
  const t = labels[language];

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-sm"
          aria-hidden
        >
          <Bus className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 text-left">
          <h1 className="truncate font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--text-h)]">
            {t.title}
          </h1>
          <p className="truncate text-xs text-[var(--text-muted)]">{t.subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleLanguage}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-h)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
        aria-label={language === 'hu' ? 'Váltás románra' : 'Schimbă în maghiară'}
      >
        <Languages className="h-4 w-4" aria-hidden />
        {t.lang}
      </button>
    </header>
  );
}
