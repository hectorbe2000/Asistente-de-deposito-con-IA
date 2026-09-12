import { useState } from 'react';
import { Send } from 'lucide-react';

export default function InputChat({ onEnviar, cargando, placeholder = 'Preguntá por un producto...' }) {
  const [valor, setValor] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valor.trim() || cargando) return;
    onEnviar(valor.trim());
    setValor('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        value={valor}
        onChange={e => setValor(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={cargando}
        placeholder={placeholder}
        className="flex-1 bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-text
                   placeholder-muted/60 focus:outline-none focus:border-primary focus:ring-2
                   focus:ring-primary/20 disabled:opacity-50 transition-all duration-200 shadow-card"
      />
      <button
        type="submit"
        disabled={!valor.trim() || cargando}
        className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-[#0D9E93]
                   flex items-center justify-center flex-shrink-0 shadow-btn
                   hover:shadow-btn-lg hover:-translate-y-px active:translate-y-0
                   transition-all duration-200
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
      >
        {cargando ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send size={16} className="text-white" />
        )}
      </button>
    </form>
  );
}
