import { useState, useCallback } from 'react';
import { LogOut } from 'lucide-react';
import ChatPanel from '../components/Asistente/ChatPanel';
import MapaDeposito from '../components/Deposito/MapaDeposito';
import { useAuth } from '../context/AuthContext';

export default function VistaOperario() {
  const { usuario, logout } = useAuth();
  const [ubicacionActiva, setUbicacionActiva] = useState(null);

  const handleUbicacion = useCallback((ub) => {
    setUbicacionActiva(ub);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">
      {/* Header mínimo para tablet */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-border shadow-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/apolo_logo.png" alt="Apolo Import S.A." className="h-8 w-auto" />
          <span className="text-xs text-muted hidden sm:block">Hola, {usuario?.nombre}</span>
        </div>

        {ubicacionActiva && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-3 py-1.5 animate-fade-in-up">
            <span className="text-primary">📍</span>
            <span className="text-xs font-mono text-primary font-bold">
              Pasillo {ubicacionActiva.pasillo} · Estante {ubicacionActiva.estante} · Div. {ubicacionActiva.divisoria}
              {ubicacionActiva.lado && ubicacionActiva.lado !== 'unico' && ` · ${ubicacionActiva.lado === 'izquierdo' ? 'Izq.' : 'Der.'}`}
            </span>
            {ubicacionActiva.producto && (
              <span className="text-xs text-muted border-l border-primary/30 pl-2">{ubicacionActiva.producto}</span>
            )}
          </div>
        )}

        <button
          onClick={logout}
          className="btn-outline text-sm"
        >
          <LogOut size={14} />
          <span className="hidden sm:block">Salir</span>
        </button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden">
        {/* Chat con avatar (ocupa más espacio) */}
        <div className="flex-[3] min-h-0 min-w-0">
          <ChatPanel onUbicacion={handleUbicacion} mostrarAvatar={true} onLimpiar={() => setUbicacionActiva(null)} />
        </div>

        {/* Mapa del depósito (solo visible en tablet landscape / desktop) */}
        <div className="flex-[2] min-h-0 min-w-0 hidden lg:flex flex-col">
          <MapaDeposito ubicacionActiva={ubicacionActiva} />
        </div>
      </div>
    </div>
  );
}
