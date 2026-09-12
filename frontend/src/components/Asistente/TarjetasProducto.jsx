import { Package } from 'lucide-react';
import { uploadsApi } from '../../services/api';

const formatPrecio = (precio) => {
  if (!precio) return null;
  return `Gs ${Number(precio).toLocaleString('es-PY')}`;
};

export default function TarjetasProducto({ opciones, onSeleccionar, seleccionado }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {opciones.map(prod => {
        const isSelected = seleccionado === prod.id;
        return (
          <button
            key={prod.id}
            onClick={() => !seleccionado && onSeleccionar(prod.id)}
            disabled={!!seleccionado}
            className={`text-left rounded-xl border-2 overflow-hidden transition-all duration-200 w-full
              ${isSelected
                ? 'border-primary bg-primary/5 shadow-btn scale-[1.02]'
                : seleccionado
                  ? 'border-border bg-surface2 opacity-50 cursor-not-allowed'
                  : 'border-border bg-white hover:border-primary hover:shadow-card-md cursor-pointer'
              }`}
          >
            <div className="h-20 bg-surface3 flex items-center justify-center overflow-hidden border-b border-border">
              {prod.imagen_url ? (
                <img src={uploadsApi.urlCompleta(prod.imagen_url)} alt={prod.nombre} className="h-full w-full object-contain p-1.5" />
              ) : (
                <Package size={28} className="text-muted/30" />
              )}
            </div>
            <div className="p-2 space-y-0.5">
              {formatPrecio(prod.precio) && (
                <div className="text-primary font-bold text-sm leading-none">{formatPrecio(prod.precio)}</div>
              )}
              {prod.marca && (
                <div className="text-[10px] text-muted uppercase tracking-wide font-semibold">{prod.marca}</div>
              )}
              <div className="text-xs text-text font-medium leading-tight line-clamp-2">{prod.nombre}</div>
              <div className="text-[10px] text-muted font-tabular">
                {prod.cantidad} {prod.unidad}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
