import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Map, ArrowLeftRight, LogOut, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  { to: '/mapa', icon: Map, label: 'Mapa' },
  { to: '/movimientos', icon: ArrowLeftRight, label: 'Movimientos' },
];

export default function Sidebar({ onCerrar }) {
  const { usuario, logout } = useAuth();

  return (
    <aside className="w-64 h-full bg-white border-r border-border flex flex-col shadow-card-md">
      {/* Header del drawer con logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
        <img src="/apolo_logo.png" alt="Apolo Import S.A." className="h-8 w-auto" />
        <button
          onClick={onCerrar}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-primary hover:bg-surface3 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onCerrar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'bg-primary/10 text-primary border-l-[3px] border-primary pl-[13px]'
                 : 'text-muted hover:bg-surface3 hover:text-text border-l-[3px] border-transparent pl-[13px]'}`
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer con usuario y logout */}
      <div className="p-3 border-t border-border space-y-1.5 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface2 border border-border">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={15} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text truncate">{usuario?.nombre}</p>
            <p className="text-xs text-muted capitalize">{usuario?.rol}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); onCerrar(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-danger/80 hover:text-danger hover:bg-danger/8 transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
