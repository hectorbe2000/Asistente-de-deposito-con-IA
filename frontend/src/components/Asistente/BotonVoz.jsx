import { Mic, Volume2 } from 'lucide-react';

export default function BotonVoz({ escuchando, hablando = false, soportado, error, onToggle, cargando }) {
  if (!soportado) return null;

  const activo = escuchando || hablando;

  return (
    <div className="relative flex-shrink-0">
      {activo && (
        <>
          <span className={`absolute inset-0 rounded-xl ${escuchando ? 'bg-success/25' : 'bg-primary/25'} animate-pulse-ring`} />
          <span className={`absolute inset-0 rounded-xl ${escuchando ? 'bg-success/15' : 'bg-primary/15'} animate-pulse-ring`}
            style={{ animationDelay: '0.4s' }} />
        </>
      )}
      <button
        onClick={onToggle}
        disabled={cargando}
        title={hablando ? 'Detener voz' : escuchando ? 'Detener escucha' : 'Hablar por voz'}
        className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200
          ${escuchando
            ? 'bg-success text-white scale-110 shadow-lg shadow-success/30'
            : hablando
              ? 'bg-gradient-to-br from-primary to-[#0D9E93] text-white scale-110 shadow-btn'
              : 'bg-white border border-border text-muted hover:text-primary hover:border-primary/40 hover:bg-surface3 shadow-card'
          }
          ${cargando ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {escuchando ? (
          <div className="flex items-end gap-0.5 h-5">
            {[40, 100, 70, 55].map((h, i) => (
              <div key={i} className="w-1 bg-white rounded-full animate-voice-wave"
                style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : hablando ? (
          <Volume2 size={18} className="animate-pulse" />
        ) : (
          <Mic size={18} />
        )}
      </button>
      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-danger text-white text-xs rounded-xl px-3 py-1.5 whitespace-nowrap z-20 shadow-card-md">
          {error}
        </div>
      )}
    </div>
  );
}
