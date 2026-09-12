import { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, RefreshCw, X } from 'lucide-react';
import { movimientosApi, productosApi } from '../services/api';

const TIPO_STYLES = {
  ingreso:  { label: 'Ingreso',   bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  egreso:   { label: 'Egreso',    bg: 'bg-danger/10',  text: 'text-danger',  border: 'border-danger/30'  },
  traslado: { label: 'Traslado',  bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
};

function FilaMovimiento({ mov }) {
  const t = TIPO_STYLES[mov.tipo] || TIPO_STYLES.ingreso;
  return (
    <tr className="border-b border-border/40 hover:bg-surface2/60 transition-colors">
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${t.bg} ${t.text} ${t.border}`}>
          {t.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-text">{mov.producto_nombre}</div>
        <div className="text-xs font-mono text-muted">{mov.producto_codigo}</div>
      </td>
      <td className="px-4 py-3 font-tabular text-sm font-bold text-text">{mov.cantidad}</td>
      <td className="px-4 py-3 text-xs text-muted font-mono">
        {mov.pasillo_origen ? `P${mov.pasillo_origen}·E${mov.estante_origen}` : '—'}
        {mov.tipo === 'traslado' && mov.pasillo_destino && ` → P${mov.pasillo_destino}·E${mov.estante_destino}`}
      </td>
      <td className="px-4 py-3 text-xs text-muted max-w-[200px] truncate">{mov.observaciones || '—'}</td>
      <td className="px-4 py-3 text-xs text-muted font-tabular">
        {new Date(mov.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
      </td>
    </tr>
  );
}

function ModalMovimiento({ onGuardado, onCancelar }) {
  const [form, setForm] = useState({ producto_id: '', tipo: 'ingreso', cantidad: 1, observaciones: '' });
  const [productos, setProductos] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    productosApi.listar().then(setProductos).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.producto_id) return;
    setGuardando(true);
    try {
      await movimientosApi.crear({ ...form, cantidad: parseInt(form.cantidad) });
      onGuardado();
    } catch (_) {}
    setGuardando(false);
  };

  const selectCls = 'w-full bg-white border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-card transition-all';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-border rounded-2xl w-full max-w-md shadow-card-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-text">Registrar Movimiento</h2>
          <button onClick={onCancelar} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-text hover:bg-surface3 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Producto *</label>
            <select value={form.producto_id} onChange={e => setForm(f => ({ ...f, producto_id: e.target.value }))} className={selectCls}>
              <option value="">Seleccioná un producto</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={selectCls}>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
                <option value="traslado">Traslado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Cantidad</label>
              <input type="number" min="1" value={form.cantidad}
                onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                className="input-base" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Observaciones</label>
            <input type="text" value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              placeholder="Motivo del movimiento..."
              className="input-base" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancelar} className="btn-outline flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={!form.producto_id || guardando} className="btn-primary flex-1">
              {guardando ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
              ) : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try { setMovimientos(await movimientosApi.listar(100)); } catch (_) {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <ArrowLeftRight size={16} className="text-primary" />
        </div>
        <h1 className="text-lg font-bold text-text">Movimientos</h1>
        <span className="text-xs text-muted bg-surface2 border border-border px-2.5 py-1 rounded-full font-tabular font-medium">
          {movimientos.length} registros
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={cargar} className="btn-outline p-2.5 !gap-0" title="Actualizar">
            <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setModal(true)} className="btn-primary">
            <Plus size={15} /> Registrar
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-border rounded-2xl overflow-hidden min-h-0 shadow-card">
        {cargando ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : movimientos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted">
            <ArrowLeftRight size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Sin movimientos registrados</p>
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface2">
                  {['Tipo', 'Producto', 'Cantidad', 'Ubicación', 'Observaciones', 'Fecha'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.map(m => <FilaMovimiento key={m.id} mov={m} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <ModalMovimiento onGuardado={() => { setModal(false); cargar(); }} onCancelar={() => setModal(false)} />}
    </div>
  );
}
