import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Package } from 'lucide-react';
import ListaProductos from '../components/Productos/ListaProductos';
import FormProducto from '../components/Productos/FormProducto';
import { productosApi } from '../services/api';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [editando, setEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await productosApi.listar();
      setProductos(data);
    } catch (_) {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = productos.filter(p =>
    !filtro || p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    p.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleGuardado = (prod) => {
    if (editando) {
      setProductos(ps => ps.map(p => p.id === prod.id ? prod : p));
    } else {
      setProductos(ps => [...ps, prod]);
    }
    setEditando(null);
    setCreando(false);
  };

  const handleEliminar = async (prod) => {
    if (confirmDelete?.id === prod.id) {
      await productosApi.eliminar(prod.id);
      setProductos(ps => ps.filter(p => p.id !== prod.id));
      setConfirmDelete(null);
    } else {
      setConfirmDelete(prod);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Barra de herramientas */}
      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Package size={16} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold text-text">Inventario</h1>
          <span className="text-xs text-muted bg-surface2 border border-border px-2.5 py-1 rounded-full font-tabular font-medium">
            {filtrados.length} productos
          </span>
        </div>
        <div className="flex-1 max-w-xs">
          <input
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            placeholder="Filtrar por nombre o código..."
            className="input-base py-2"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={cargar}
            className="btn-outline p-2.5 !gap-0"
            title="Actualizar"
          >
            <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setCreando(true)} className="btn-primary">
            <Plus size={15} />
            Nuevo producto
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="flex items-center gap-3 bg-danger/8 border border-danger/25 rounded-xl px-4 py-3 flex-shrink-0 shadow-card">
          <span className="text-sm text-danger flex-1">
            ¿Eliminar <strong>{confirmDelete.nombre}</strong>? Hacé click en eliminar de nuevo para confirmar.
          </span>
          <button onClick={() => setConfirmDelete(null)} className="text-xs text-muted hover:text-text transition-colors">
            Cancelar
          </button>
        </div>
      )}

      <div className="flex-1 bg-white border border-border rounded-2xl overflow-hidden min-h-0 shadow-card">
        {cargando ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <ListaProductos
              productos={filtrados}
              onEditar={setEditando}
              onEliminar={handleEliminar}
            />
          </div>
        )}
      </div>

      {(creando || editando) && (
        <FormProducto
          producto={editando}
          onGuardado={handleGuardado}
          onCancelar={() => { setCreando(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
