import { useState, useEffect, useRef } from 'react';
import { X, Upload, ImageIcon } from 'lucide-react';
import { productosApi, ubicacionesApi, uploadsApi } from '../../services/api';

export default function FormProducto({ producto, onGuardado, onCancelar }) {
  const [form, setForm] = useState({
    codigo: '', nombre: '', descripcion: '',
    categoria_id: '', divisoria_id: '', cantidad: '', unidad: 'unidad',
    marca: '', precio: '', imagen_url: '',
  });
  const [categorias, setCategorias] = useState([]);
  const [pasillos, setPasillos] = useState([]);
  const [selPasillo, setSelPasillo] = useState('');
  const [selEstante, setSelEstante] = useState('');
  const [selLado, setSelLado] = useState('');
  const [divisorias, setDivisorias] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [subiendoImg, setSubiendoImg] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    ubicacionesApi.categorias().then(setCategorias);
    ubicacionesApi.pasillos().then(setPasillos);
  }, []);

  useEffect(() => {
    if (producto) {
      setForm({
        codigo: producto.codigo || '',
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        categoria_id: producto.categoria_id || '',
        divisoria_id: producto.divisoria_id || '',
        cantidad: producto.cantidad ?? '',
        unidad: producto.unidad || 'unidad',
        marca: producto.marca || '',
        precio: producto.precio ?? '',
        imagen_url: producto.imagen_url || '',
      });
      if (producto.pasillo_numero) {
        setSelPasillo(String(producto.pasillo_numero));
        setSelEstante(String(producto.estante_numero));
        setSelLado(producto.lado || '');
      }
    }
  }, [producto]);

  useEffect(() => {
    if (!selPasillo || !selEstante || !selLado) { setDivisorias([]); return; }
    const pasillo = pasillos.find(p => p.numero === parseInt(selPasillo));
    const estante = pasillo?.estantes?.find(e => e.numero === parseInt(selEstante) && e.lado === selLado);
    setDivisorias(estante?.divisorias || []);
  }, [selPasillo, selEstante, selLado, pasillos]);

  const estantesDisponibles = () => {
    const p = pasillos.find(p => p.numero === parseInt(selPasillo));
    if (!p) return [];
    const mapa = {};
    p.estantes?.forEach(e => {
      if (!mapa[e.numero]) mapa[e.numero] = [];
      mapa[e.numero].push(e.lado);
    });
    return Object.entries(mapa).map(([num, lados]) => ({ numero: parseInt(num), lados }));
  };

  const ladosDisponibles = () => {
    const nums = estantesDisponibles().find(e => e.numero === parseInt(selEstante));
    return nums?.lados || [];
  };

  const handleImagenChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoImg(true);
    try {
      const { url } = await uploadsApi.subirImagen(file);
      setForm(f => ({ ...f, imagen_url: url }));
    } catch (err) {
      setError('Error al subir la imagen. Intentá de nuevo.');
    } finally {
      setSubiendoImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.codigo || !form.nombre) { setError('Código y nombre son obligatorios'); return; }
    setGuardando(true); setError('');
    try {
      const data = { ...form, divisoria_id: form.divisoria_id || null, cantidad: Number(form.cantidad) || 0, precio: Number(form.precio) || 0 };
      const result = producto
        ? await productosApi.editar(producto.id, data)
        : await productosApi.crear(data);
      onGuardado(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const selectCls = 'w-full bg-white border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-card transition-all';
  const label = (txt) => <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">{txt}</label>;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-card-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-text">{producto ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button onClick={onCancelar} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-text hover:bg-surface3 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              {label('Código *')}
              <input
                type="text"
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                className="input-base font-mono"
              />
            </div>
            <div>
              {label('Nombre *')}
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>

          <div>
            {label('Descripción')}
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={2}
              className="input-base resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              {label('Marca')}
              <input
                type="text"
                value={form.marca}
                onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              {label('Precio (Gs)')}
              <input
                type="number"
                min="0"
                value={form.precio}
                onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>

          <div>
            {label('Imagen del producto')}
            <div className="flex items-center gap-3">
              {/* Preview */}
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border bg-surface3 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {form.imagen_url ? (
                  <img
                    src={uploadsApi.urlCompleta(form.imagen_url)}
                    alt="preview"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <ImageIcon size={22} className="text-muted/40" />
                )}
              </div>
              {/* Botón de carga */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImagenChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={subiendoImg}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border text-sm text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  {subiendoImg ? (
                    <><span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Subiendo...</>
                  ) : (
                    <><Upload size={15} /> {form.imagen_url ? 'Cambiar imagen' : 'Seleccionar imagen'}</>
                  )}
                </button>
                {form.imagen_url && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, imagen_url: '' }))}
                    className="mt-1.5 text-xs text-danger/70 hover:text-danger transition-colors"
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              {label('Categoría')}
              <select value={form.categoria_id} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))} className={selectCls}>
                <option value="">Sin categoría</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                {label('Cantidad')}
                <input type="number" min="0" value={form.cantidad}
                  onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                  className="input-base" />
              </div>
              <div>
                {label('Unidad')}
                <select value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} className={selectCls}>
                  {['unidad', 'caja', 'bolsa', 'botella', 'paquete', 'rollo', 'par', 'kg', 'litro'].map(u =>
                    <option key={u} value={u}>{u}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-surface2 border border-border rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">📍 Ubicación en el depósito</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-muted mb-1">Pasillo</label>
                <select value={selPasillo} onChange={e => { setSelPasillo(e.target.value); setSelEstante(''); setSelLado(''); setForm(f => ({ ...f, divisoria_id: '' })); }}
                  className={selectCls + ' py-2 text-xs'}>
                  <option value="">—</option>
                  {pasillos.map(p => <option key={p.id} value={p.numero}>P{p.numero}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Estante</label>
                <select value={selEstante} onChange={e => { setSelEstante(e.target.value); setSelLado(''); setForm(f => ({ ...f, divisoria_id: '' })); }}
                  disabled={!selPasillo}
                  className={selectCls + ' py-2 text-xs disabled:opacity-40'}>
                  <option value="">—</option>
                  {estantesDisponibles().map(e => <option key={e.numero} value={e.numero}>E{e.numero}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Lado</label>
                <select value={selLado} onChange={e => { setSelLado(e.target.value); setForm(f => ({ ...f, divisoria_id: '' })); }}
                  disabled={!selEstante}
                  className={selectCls + ' py-2 text-xs disabled:opacity-40'}>
                  <option value="">—</option>
                  {ladosDisponibles().map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            {divisorias.length > 0 && (
              <div>
                <label className="block text-xs text-muted mb-2">Divisoria (1-7)</label>
                <div className="flex gap-1.5 flex-wrap">
                  {divisorias.map(d => (
                    <button key={d.id} type="button"
                      onClick={() => setForm(f => ({ ...f, divisoria_id: d.id }))}
                      className={`w-9 h-9 rounded-xl text-xs font-mono font-bold border-2 transition-all duration-150 shadow-card
                        ${form.divisoria_id == d.id
                          ? 'bg-primary border-primary text-white shadow-btn scale-105'
                          : 'bg-white border-border text-muted hover:border-primary/50 hover:text-primary'}`}>
                      {d.numero}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-danger/8 border border-danger/25 rounded-xl px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancelar} className="btn-outline flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary flex-1">
              {guardando ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
              ) : producto ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
