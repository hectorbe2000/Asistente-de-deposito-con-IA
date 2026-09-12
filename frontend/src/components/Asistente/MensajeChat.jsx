import { MapPin, AlertTriangle } from 'lucide-react';
import TarjetasProducto from './TarjetasProducto';

function UbicacionChip({ ubicacion }) {
  if (!ubicacion) return null;
  const desc = ubicacion.lado && ubicacion.lado !== 'unico'
    ? `P${ubicacion.pasillo} · E${ubicacion.estante} · D${ubicacion.divisoria} · ${ubicacion.lado === 'izquierdo' ? 'Izq.' : 'Der.'}`
    : `P${ubicacion.pasillo} · E${ubicacion.estante} · D${ubicacion.divisoria}`;
  return (
    <div className="mt-2 inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-xl px-3 py-1.5">
      <MapPin size={12} className="text-primary flex-shrink-0" />
      <span className="font-mono text-xs text-primary font-semibold">{desc}</span>
      {ubicacion.producto && (
        <span className="text-xs text-muted border-l border-primary/25 pl-2 ml-1">{ubicacion.producto}</span>
      )}
    </div>
  );
}

export default function MensajeChat({ mensaje, onSeleccionarProducto }) {
  const esUsuario = mensaje.rol === 'usuario';
  const esError   = mensaje.rol === 'error';
  const tieneOpciones = !esUsuario && mensaje.opciones?.length > 0;

  if (esError) {
    return (
      <div className="flex justify-center animate-fade-in-up">
        <div className="flex items-center gap-2 bg-danger/10 border border-danger/25 rounded-xl px-4 py-2.5 text-xs text-danger shadow-card">
          <AlertTriangle size={14} />
          {mensaje.texto}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex animate-fade-in-up ${esUsuario ? 'justify-end' : 'justify-start'}`}>
      {!esUsuario && (
        <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2 text-base shadow-card">
          🤖
        </div>
      )}
      <div className={`${tieneOpciones ? 'max-w-[90%]' : 'max-w-[80%]'} ${esUsuario ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card
          ${esUsuario
            ? 'bg-gradient-to-br from-primary to-[#0D9E93] text-white rounded-tr-sm'
            : 'bg-white border border-border text-text rounded-tl-sm'
          }`}>
          {mensaje.texto}
        </div>
        {tieneOpciones && (
          <TarjetasProducto
            opciones={mensaje.opciones}
            onSeleccionar={onSeleccionarProducto}
            seleccionado={mensaje.seleccionado}
          />
        )}
        {!esUsuario && mensaje.ubicacion && (
          <UbicacionChip ubicacion={mensaje.ubicacion} />
        )}
        <span className="text-[10px] text-muted mt-1 px-1">
          {mensaje.fecha?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
