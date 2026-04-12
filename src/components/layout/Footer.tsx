import { Dice5, ExternalLink, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 text-text-muted">
            <Dice5 size={18} className="text-gold/50" />
            <span className="text-sm font-extrabold tracking-tight">DnDex</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              Made with <Heart size={14} className="text-crimson fill-crimson" /> for TTRPG community
            </span>
          </div>

          {/* Social */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
              aria-label="GitHub"
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
