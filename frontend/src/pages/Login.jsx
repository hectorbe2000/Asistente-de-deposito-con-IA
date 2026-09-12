import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.usuario || !form.password) {
      setError('Completá usuario y contraseña');
      return;
    }
    setCargando(true);
    setError('');
    try {
      await login(form.usuario, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Gradiente radial teal suave en esquinas */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(10,173,160,0.10) 0%, transparent 45%), ' +
            'radial-gradient(circle at 90% 80%, rgba(125,196,34,0.07) 0%, transparent 40%), ' +
            'radial-gradient(circle at 80% 10%, rgba(10,173,160,0.06) 0%, transparent 35%)',
        }} />
        {/* Patrón de puntos muy sutil */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#0AADA0" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo Apolo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl shadow-card px-6 py-3 mb-5">
            <img src="/apolo_logo.png" alt="Apolo Import S.A." className="h-14 w-auto" />
          </div>
          <h1 className="text-xl font-bold text-text tracking-tight">Sistema de Depósito</h1>
          <p className="text-muted text-sm mt-1">Apolo Import S.A.</p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-card-md border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Usuario */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Usuario</label>
              <input
                type="text"
                value={form.usuario}
                onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
                placeholder="Ingresá tu usuario"
                autoComplete="username"
                className="input-base"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={verPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-base pr-12"
                  style={{ fontSize: '16px' }}
                />
                <button
                  type="button"
                  onClick={() => setVerPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1"
                >
                  {verPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={cargando}
              className="btn-primary w-full py-3.5 rounded-xl text-base mt-2"
            >
              {cargando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Créditos */}
        <p className="text-center text-xs text-muted/50 mt-6">
          Depósito Apolo · Sistema interno
        </p>
      </div>
    </div>
  );
}
