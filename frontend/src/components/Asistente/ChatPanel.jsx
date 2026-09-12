import { useEffect, useRef, useCallback, useState } from 'react';
import { Bot, Trash2, Menu } from 'lucide-react';
import MensajeChat from './MensajeChat';
import InputChat from './InputChat';
import BotonVoz from './BotonVoz';
import AvatarAsistente from './AvatarAsistente';
import { useChat } from '../../hooks/useChat';
import { useVoz } from '../../hooks/useVoz';

export default function ChatPanel({ onUbicacion, mostrarAvatar = false, onAbrirMenu, onLimpiar }) {
  const { mensajes, cargando, enviarMensaje, limpiarChat, seleccionarProducto } = useChat({ onUbicacion });
  const mensajesEndRef = useRef(null);
  const [hablando, setHablando] = useState(false);

  const hablarConCallback = useCallback((texto, vozFn) => {
    setHablando(true);
    vozFn(texto, () => setHablando(false));
  }, []);

  // Ref para romper la dependencia circular: handleTranscripcion → hablar → useVoz → handleTranscripcion
  const hablarRef = useRef(null);

  const handleTranscripcion = useCallback(async (texto) => {
    const resultado = await enviarMensaje(texto, 'voz');
    if (resultado?.respuesta) {
      hablarConCallback(resultado.respuesta, hablarRef.current);
    } else if (resultado === null) {
      hablarConCallback('Hubo un error al procesar tu consulta. Intentá de nuevo.', hablarRef.current);
    }
  }, [enviarMensaje, hablarConCallback]);

  const { escuchando, soportado, error: errorVoz, iniciarEscucha, detenerEscucha, hablar, detenerVoz } = useVoz({
    onTranscripcion: handleTranscripcion,
  });

  // Mantener el ref actualizado después de que useVoz inicializa hablar
  hablarRef.current = hablar;

  const handleEnviarTexto = useCallback(async (texto) => {
    const resultado = await enviarMensaje(texto, 'chat');
    if (resultado?.respuesta && soportado) {
      hablarConCallback(resultado.respuesta, hablar);
    }
  }, [enviarMensaje, soportado, hablar, hablarConCallback]);

  const handleSeleccionarProducto = useCallback(async (productoId, msgId) => {
    const resultado = await seleccionarProducto(productoId, msgId);
    if (resultado?.respuesta && soportado) {
      hablarConCallback(resultado.respuesta, hablar);
    }
  }, [seleccionarProducto, soportado, hablar, hablarConCallback]);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const toggleVoz = () => {
    if (hablando) { detenerVoz(); setHablando(false); return; }
    if (escuchando) detenerEscucha();
    else iniciarEscucha();
  };

  if (mostrarAvatar) {
    return (
      <div className="flex flex-col h-full bg-white border border-border rounded-xl overflow-hidden shadow-card">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface2 flex-shrink-0">
          {onAbrirMenu && (
            <button
              onClick={onAbrirMenu}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted bg-white border border-border hover:text-primary hover:border-primary/40 transition-all flex-shrink-0"
              title="Menú"
            >
              <Menu size={16} />
            </button>
          )}
          <Bot size={15} className="text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-text">Asistente de Depósito</span>
          <div className="flex items-center gap-1.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] text-muted hidden sm:block">Responde por voz y texto</span>
          </div>
          <button onClick={() => { detenerVoz(); limpiarChat(); onLimpiar?.(); }} className="ml-auto text-muted hover:text-danger p-1 rounded-lg transition-colors">
            <Trash2 size={15} />
          </button>
        </div>

        {/* Avatar central */}
        <div className="flex-shrink-0 flex items-center justify-center py-2 bg-gradient-to-b from-surface3/80 to-white border-b border-border">
          <AvatarAsistente
            hablando={hablando}
            escuchando={escuchando}
            cargando={cargando}
          />
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {mensajes.map((msg) => (
            <MensajeChat key={msg.id} mensaje={msg} onSeleccionarProducto={(id) => handleSeleccionarProducto(id, msg.id)} />
          ))}
          {cargando && <TypingIndicator />}
          <div ref={mensajesEndRef} />
        </div>

        {/* Input */}
        <InputArea
          escuchando={escuchando}
          hablando={hablando}
          soportado={soportado}
          errorVoz={errorVoz}
          cargando={cargando}
          onToggleVoz={toggleVoz}
          onEnviar={handleEnviarTexto}
        />
      </div>
    );
  }

  // Modo admin: sin avatar
  return (
    <div className="flex flex-col h-full bg-white border border-border rounded-xl overflow-hidden shadow-card">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface2 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Bot size={16} className="text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-text">Asistente de Depósito</div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-[11px] text-muted">En línea — responde por voz y texto</span>
          </div>
        </div>
        <button onClick={() => { detenerVoz(); limpiarChat(); onLimpiar?.(); }} className="ml-auto text-muted hover:text-danger p-1 rounded-lg transition-colors">
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {mensajes.map((msg) => <MensajeChat key={msg.id} mensaje={msg} onSeleccionarProducto={(id) => handleSeleccionarProducto(id, msg.id)} />)}
        {cargando && <TypingIndicator />}
        <div ref={mensajesEndRef} />
      </div>

      <InputArea
        escuchando={escuchando}
        hablando={hablando}
        soportado={soportado}
        errorVoz={errorVoz}
        cargando={cargando}
        onToggleVoz={toggleVoz}
        onEnviar={handleEnviarTexto}
      />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2 text-base">🤖</div>
      <div className="bg-surface2 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map(delay => (
            <span key={delay} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function InputArea({ escuchando, hablando, soportado, errorVoz, cargando, onToggleVoz, onEnviar }) {
  return (
    <div className="px-4 py-3 border-t border-border bg-surface2 flex-shrink-0">
      {escuchando && (
        <div className="flex items-center gap-2 mb-2 text-xs text-success">
          <div className="flex items-end gap-0.5 h-4">
            {[60, 100, 70].map((h, i) => (
              <div key={i} className="w-1 bg-success rounded-full animate-voice-wave"
                style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          Escuchando... hablá ahora
        </div>
      )}
      {hablando && !escuchando && (
        <div className="flex items-center gap-2 mb-2 text-xs text-primary">
          <div className="flex items-end gap-0.5 h-4">
            {[40, 100, 60, 80, 50].map((h, i) => (
              <div key={i} className="w-1 bg-primary rounded-full animate-voice-wave"
                style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          Respondiendo por voz...
        </div>
      )}
      <div className="flex items-center gap-2">
        <BotonVoz
          escuchando={escuchando}
          hablando={hablando}
          soportado={soportado}
          error={errorVoz}
          onToggle={onToggleVoz}
          cargando={cargando}
        />
        <div className="flex-1">
          <InputChat onEnviar={onEnviar} cargando={cargando} />
        </div>
      </div>
    </div>
  );
}
