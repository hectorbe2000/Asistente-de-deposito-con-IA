import { Menu } from 'lucide-react';

export default function Header({ onAbrirMenu }) {
  return (
    <header className="h-12 bg-white border-b border-border shadow-card flex items-center px-4 gap-3 flex-shrink-0">
      <button
        onClick={onAbrirMenu}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted bg-surface2 border border-border hover:text-primary hover:border-primary/40 hover:bg-surface3 transition-all duration-150 flex-shrink-0"
        title="Menú"
      >
        <Menu size={16} />
      </button>
      <img src="/apolo_logo.png" alt="Apolo Import S.A." className="h-7 w-auto" />
      <div className="ml-auto">
        <span className="text-xs text-muted hidden sm:block">
          {new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
    </header>
  );
}
