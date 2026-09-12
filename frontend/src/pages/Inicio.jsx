import { useState, useCallback } from 'react';
import ChatPanel from '../components/Asistente/ChatPanel';
import MapaDeposito from '../components/Deposito/MapaDeposito';

export default function Inicio({ onAbrirMenu }) {
  const [ubicacionActiva, setUbicacionActiva] = useState(null);

  const handleUbicacion = useCallback((ubicacion) => {
    setUbicacionActiva(ubicacion);
  }, []);

  return (
    <div className="flex gap-3 h-full p-3">
      {/* Asistente — 55% */}
      <div className="flex-[11] min-w-0 min-h-0">
        <ChatPanel onUbicacion={handleUbicacion} mostrarAvatar={true} onAbrirMenu={onAbrirMenu} onLimpiar={() => setUbicacionActiva(null)} />
      </div>

      {/* Mapa — 45% */}
      <div className="flex-[9] min-w-0 min-h-0 flex flex-col gap-2">
        <div className="flex-1 min-h-0">
          <MapaDeposito ubicacionActiva={ubicacionActiva} />
        </div>

        {/* Única info contextual: ubicación activa cuando el asistente encuentra algo */}
        {ubicacionActiva && (
          <div className="flex-shrink-0 flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 animate-fade-in-up">
            <span className="text-xl">📍</span>
            <div>
              <p className="text-xs font-mono font-bold text-accent">
                Pasillo {ubicacionActiva.pasillo} · Estante {ubicacionActiva.estante} · Divisoria {ubicacionActiva.divisoria}
                {ubicacionActiva.lado && ubicacionActiva.lado !== 'unico' && ` · ${ubicacionActiva.lado === 'izquierdo' ? 'Lado Izquierdo' : 'Lado Derecho'}`}
              </p>
              {ubicacionActiva.producto && (
                <p className="text-xs text-muted mt-0.5">{ubicacionActiva.producto}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
