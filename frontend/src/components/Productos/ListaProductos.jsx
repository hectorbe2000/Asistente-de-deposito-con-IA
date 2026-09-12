import { useState } from 'react';
import { Edit2, Trash2, MapPin, Package, ChevronUp, ChevronDown } from 'lucide-react';
import { uploadsApi } from '../../services/api';

export default function ListaProductos({ productos, onEditar, onEliminar }) {
  const [sortBy, setSortBy] = useState('nombre');
  const [sortDir, setSortDir] = useState('asc');

  const toggleSort = (campo) => {
    if (sortBy === campo) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(campo); setSortDir('asc'); }
  };

  const sorted = [...productos].sort((a, b) => {
    let va = a[sortBy] ?? '';
    let vb = b[sortBy] ?? '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const ColHeader = ({ campo, label }) => (
    <th className="px-3 py-3 text-left cursor-pointer group select-none" onClick={() => toggleSort(campo)}>
      <div className="flex items-center gap-1 text-xs font-bold text-muted group-hover:text-text uppercase tracking-wide transition-colors">
        {label}
        {sortBy === campo
          ? (sortDir === 'asc' ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />)
          : <ChevronUp size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />}
      </div>
    </th>
  );

  if (!productos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        <div className="w-16 h-16 rounded-2xl bg-surface3 border border-border flex items-center justify-center mb-4">
          <Package size={28} className="text-muted/50" />
        </div>
        <p className="text-sm font-medium">No hay productos</p>
        <p className="text-xs text-muted/60 mt-1">Agregá el primer producto con el botón de arriba</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface2">
            <th className="px-2 py-3 w-12" />
            <ColHeader campo="codigo" label="Código" />
            <ColHeader campo="nombre" label="Nombre" />
            <ColHeader campo="marca" label="Marca" />
            <ColHeader campo="categoria" label="Categoría" />
            <ColHeader campo="precio" label="Precio" />
            <th className="px-3 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Ubicación</th>
            <ColHeader campo="cantidad" label="Stock" />
            <th className="px-3 py-3 w-20" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={p.id}
              className={`border-b border-border/40 hover:bg-surface3/40 transition-colors ${i % 2 === 0 ? '' : 'bg-surface2/30'}`}>
              <td className="px-2 py-3 w-12">
                {p.imagen_url ? (
                  <img src={uploadsApi.urlCompleta(p.imagen_url)} alt={p.nombre} className="w-9 h-9 object-contain rounded-lg bg-surface3 border border-border p-0.5" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-surface3 border border-border flex items-center justify-center">
                    <Package size={16} className="text-muted/40" />
                  </div>
                )}
              </td>
              <td className="px-3 py-3">
                <span className="font-mono text-xs bg-surface2 border border-border px-2 py-0.5 rounded-lg text-muted">{p.codigo}</span>
              </td>
              <td className="px-3 py-3">
                <span className="text-sm font-medium text-text">{p.nombre}</span>
                {p.descripcion && <span className="block text-xs text-muted truncate max-w-[200px] mt-0.5">{p.descripcion}</span>}
              </td>
              <td className="px-3 py-3">
                <span className="text-xs text-muted">{p.marca || '—'}</span>
              </td>
              <td className="px-3 py-3">
                {p.categoria ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${p.categoria_color}18`, color: p.categoria_color, border: `1px solid ${p.categoria_color}35` }}>
                    {p.categoria}
                  </span>
                ) : <span className="text-xs text-muted">—</span>}
              </td>
              <td className="px-3 py-3 font-tabular">
                {p.precio ? (
                  <span className="text-xs font-semibold text-primary">
                    Gs {Number(p.precio).toLocaleString('es-PY')}
                  </span>
                ) : <span className="text-xs text-muted/60">—</span>}
              </td>
              <td className="px-3 py-3">
                {p.pasillo_numero ? (
                  <div className="inline-flex items-center gap-1 bg-primary/8 border border-primary/20 text-primary rounded-lg px-2 py-1 text-xs font-mono">
                    <MapPin size={10} />
                    P{p.pasillo_numero}·E{p.estante_numero}·D{p.divisoria_numero}
                    {p.lado && p.lado !== 'unico' && <span className="text-primary/60 ml-0.5">{p.lado === 'izquierdo' ? 'Izq' : 'Der'}</span>}
                  </div>
                ) : <span className="text-xs text-muted/60 italic">Sin ubicar</span>}
              </td>
              <td className="px-3 py-3 font-tabular">
                <span className={`text-sm font-bold ${p.cantidad < 5 ? 'text-danger' : p.cantidad < 15 ? 'text-amber-600' : 'text-success'}`}>
                  {p.cantidad}
                </span>
                <span className="text-xs text-muted ml-1">{p.unidad}</span>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => onEditar(p)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Editar">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => onEliminar(p)}
                    className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Eliminar">
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
