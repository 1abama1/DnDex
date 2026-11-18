import { Link } from 'react-router-dom';
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="brand"
      aria-label="DnDex"
      onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
    >
      <svg className="brand-symbol" viewBox="0 0 36 40" fill="none" aria-hidden="true">
        <path d="m18 2 16 9v18l-16 9-16-9V11Z" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="m18 2-9 15 9 21 9-21Zm-16 9 7 6h18l7-6M2 29l7-12m18 0 7 12M2 29h32"
          stroke="currentColor"
          strokeWidth=".8"
        />
        <path d="m18 12 4 9h-8Z" stroke="currentColor" strokeWidth=".8" />
      </svg>
      <span>
        <span className="brand-word">
          Dn<em>Dex</em>
        </span>
        {!compact && <span className="brand-caption block">THE ADVENTURER’S CODEX</span>}
      </span>
    </Link>
  );
}
