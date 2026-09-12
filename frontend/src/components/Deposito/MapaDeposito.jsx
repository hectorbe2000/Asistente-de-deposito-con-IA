import { useState, useEffect } from 'react';
import { ubicacionesApi } from '../../services/api';

/* ─── Datos del mapa ─────────────────────────────────────────── */

// Pasillo 1: 9 estantes lado único, verticales en columna izquierda
// Pasillos 2–8: primera fila (arriba), cada uno con 2 columnas (izq/der) × 4 estantes
// Pasillo corredor horizontal (flecha central)
// Pasillos 9–15: segunda fila (abajo), misma estructura

const COLORES_CAT = {
  'Electrónica': '#0AADA0',
  'Herramientas': '#7DC422',
  'Almacén': '#16A34A',
  'Limpieza': '#0891b2',
  'Varios': '#7c3aed',
};

/* ─── Sub-componentes pequeños ───────────────────────────────── */

function Estante({ active, onClick, title }) {
  return (
    <div
      onClick={onClick}
      title={title}
      className={`cursor-pointer rounded-sm border transition-all duration-200 select-none
        ${active
          ? 'bg-amber-400 border-amber-500 shadow-lg shadow-amber-400/40 animate-location-pulse'
          : 'bg-surface3 border-border hover:border-primary/50'
        }`}
      style={{ width: 28, height: 72 }}
    >
      {/* 7 divisorias visuales */}
      <div className="flex flex-col h-full gap-px p-px">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className={`flex-1 rounded-[1px] transition-colors
            ${active ? 'bg-yellow-100/80' : 'bg-teal-200/50'}`} />
        ))}
      </div>
    </div>
  );
}

function PasilloVertical({ numero, estantes = [], activeEstante, onEstanteClick, onPasilloClick, productosPorEstante }) {
  const esPasilloUnico = numero === 1;

  if (esPasilloUnico) {
    const unicos = estantes.filter(e => e.lado === 'unico').sort((a, b) => a.numero - b.numero);
    return (
      <div className="flex flex-col items-center gap-1 group" onClick={() => onPasilloClick(numero)}>
        <span className="text-[9px] font-mono text-muted group-hover:text-primary transition-colors font-semibold">P1</span>
        <div className="flex flex-col gap-1 bg-surface2 rounded-lg p-1.5 border border-border group-hover:border-primary/40">
          {unicos.map(est => (
            <Estante
              key={est.id}
              active={activeEstante?.pasillo === numero && activeEstante?.estante === est.numero && activeEstante?.lado === 'unico'}
              tiene_productos={(productosPorEstante[est.id] || 0) > 0}
              onClick={(e) => { e.stopPropagation(); onEstanteClick({ pasillo: numero, estante: est.numero, lado: 'unico', estante_id: est.id }); }}
              title={`Pasillo 1 · Estante ${est.numero} · Único`}
            />
          ))}
        </div>
      </div>
    );
  }

  const izq = estantes.filter(e => e.lado === 'izquierdo').sort((a, b) => a.numero - b.numero);
  const der = estantes.filter(e => e.lado === 'derecho').sort((a, b) => a.numero - b.numero);

  return (
    <div className="flex flex-col items-center gap-1 group" onClick={() => onPasilloClick(numero)}>
      <span className="text-[9px] font-mono text-muted group-hover:text-primary transition-colors font-semibold">P{numero}</span>
      <div className="flex gap-1 bg-surface2 rounded-lg p-1.5 border border-border group-hover:border-primary/40">
        <div className="flex flex-col gap-1">
          {izq.map(est => (
            <Estante
              key={est.id}
              active={activeEstante?.pasillo === numero && activeEstante?.estante === est.numero && activeEstante?.lado === 'izquierdo'}
              tiene_productos={(productosPorEstante[est.id] || 0) > 0}
              onClick={(e) => { e.stopPropagation(); onEstanteClick({ pasillo: numero, estante: est.numero, lado: 'izquierdo', estante_id: est.id }); }}
              title={`Pasillo ${numero} · Estante ${est.numero} · Izquierdo`}
            />
          ))}
        </div>
        {/* Corredor entre columnas con flecha de circulación */}
        <div className="w-4 flex flex-col items-center justify-center gap-1">
          <span className="text-primary/60 text-[10px]">↑</span>
          <div className="flex-1 border-l border-dashed border-primary/20 mx-auto" />
          <span className="text-primary/60 text-[10px]">↓</span>
        </div>
        <div className="flex flex-col gap-1">
          {der.map(est => (
            <Estante
              key={est.id}
              active={activeEstante?.pasillo === numero && activeEstante?.estante === est.numero && activeEstante?.lado === 'derecho'}
              tiene_productos={(productosPorEstante[est.id] || 0) > 0}
              onClick={(e) => { e.stopPropagation(); onEstanteClick({ pasillo: numero, estante: est.numero, lado: 'derecho', estante_id: est.id }); }}
              title={`Pasillo ${numero} · Estante ${est.numero} · Derecho`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Panel lateral de detalle ───────────────────────────────── */

function PanelDetalle({ seleccion, productos, onCerrar }) {
  if (!seleccion) return null;
  const titulo = seleccion.tipo === 'pasillo'
    ? `Pasillo ${seleccion.numero}`
    : `P${seleccion.pasillo} · E${seleccion.estante} · ${seleccion.lado === 'unico' ? 'Único' : seleccion.lado === 'izquierdo' ? 'Izquierdo' : 'Derecho'}`;

  return (
    <div className="absolute right-0 top-0 h-full w-64 bg-white border-l border-border flex flex-col z-20 shadow-card-md">
      <div className="flex items-center justify-between p-3 border-b border-border bg-surface2">
        <span className="font-mono text-xs font-bold text-text">{titulo}</span>
        <button onClick={onCerrar} className="text-muted hover:text-primary text-lg leading-none transition-colors">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {productos.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">Sin productos en esta ubicación</p>
        ) : productos.map(p => (
          <div key={p.id} className="bg-surface2 rounded-xl p-2.5 border border-border">
            <div className="text-xs font-semibold text-text">{p.nombre}</div>
            <div className="text-[10px] font-mono text-muted mt-0.5">{p.codigo}</div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-muted">{p.categoria || 'Sin cat.'}</span>
              <span className={`text-[10px] font-tabular font-semibold ${p.cantidad < 5 ? 'text-danger' : 'text-success'}`}>
                {p.cantidad} {p.unidad}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────────── */

export default function MapaDeposito({ ubicacionActiva, compact = false }) {
  const [pasillos, setPasillos] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [productosDetalle, setProductosDetalle] = useState([]);
  const [productosPorEstante, setProductosPorEstante] = useState({});

  useEffect(() => {
    ubicacionesApi.pasillos().then(data => {
      setPasillos(data);
      const mapa = {};
      data.forEach(p => {
        p.estantes?.forEach(e => {
          const count = e.divisorias?.reduce((sum, d) => sum + parseInt(d.productos_count || 0), 0);
          mapa[e.id] = count;
        });
      });
      setProductosPorEstante(mapa);
    }).catch(() => {});
  }, []);

  const handleEstanteClick = async (info) => {
    setSeleccion({ tipo: 'estante', ...info });
    try {
      const all = await ubicacionesApi.productosPasillo(
        pasillos.find(p => p.numero === info.pasillo)?.id
      );
      setProductosDetalle(all.filter(p =>
        p.estante_numero === info.estante && p.lado === info.lado
      ));
    } catch (_) {
      setProductosDetalle([]);
    }
  };

  const handlePasilloClick = async (numero) => {
    const pasillo = pasillos.find(p => p.numero === numero);
    if (!pasillo) return;
    setSeleccion({ tipo: 'pasillo', numero });
    try {
      const data = await ubicacionesApi.productosPasillo(pasillo.id);
      setProductosDetalle(data);
    } catch (_) {
      setProductosDetalle([]);
    }
  };

  const pasilloMap = {};
  pasillos.forEach(p => { pasilloMap[p.numero] = p; });

  const activeEstante = ubicacionActiva ? {
    pasillo: ubicacionActiva.pasillo,
    estante: ubicacionActiva.estante,
    lado: ubicacionActiva.lado || 'unico',
  } : null;

  const filaSuperior = [2, 3, 4, 5, 6, 7, 8];
  const filaInferior = [9, 10, 11, 12, 13, 14, 15];

  return (
    <div className={`relative bg-white border border-border rounded-xl overflow-hidden shadow-card ${compact ? '' : 'h-full'}`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface2">
        <span className="text-xs font-semibold text-text">Planta del Depósito</span>
        <div className="flex items-center gap-3 text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-primary border border-primary inline-block" />
            Ubicación activa
          </span>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {/* Pasillo 1 (columna izquierda) */}
          <div className="flex flex-col justify-start pt-5">
            <PasilloVertical
              numero={1}
              estantes={pasilloMap[1]?.estantes || []}
              activeEstante={activeEstante}
              onEstanteClick={handleEstanteClick}
              onPasilloClick={handlePasilloClick}
              productosPorEstante={productosPorEstante}
            />
          </div>

          {/* Sección derecha: fila superior + corredor + fila inferior */}
          <div className="flex flex-col gap-2">
            {/* Fila superior: P2-P8 */}
            <div className="flex gap-2">
              {filaSuperior.map(n => (
                <PasilloVertical
                  key={n}
                  numero={n}
                  estantes={pasilloMap[n]?.estantes || []}
                  activeEstante={activeEstante}
                  onEstanteClick={handleEstanteClick}
                  onPasilloClick={handlePasilloClick}
                  productosPorEstante={productosPorEstante}
                />
              ))}
            </div>

            {/* Corredor horizontal principal */}
            <div className="flex items-center gap-2 py-1 px-2">
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-px bg-primary/20 border-t border-dashed border-primary/30" />
                <span className="text-primary/60 text-sm">←</span>
                <span className="text-[9px] text-primary/60 font-mono px-1">CORREDOR PRINCIPAL</span>
                <span className="text-primary/60 text-sm">→</span>
                <div className="flex-1 h-px bg-primary/20 border-t border-dashed border-primary/30" />
              </div>
            </div>

            {/* Fila inferior: P9-P15 */}
            <div className="flex gap-2">
              {filaInferior.map(n => (
                <PasilloVertical
                  key={n}
                  numero={n}
                  estantes={pasilloMap[n]?.estantes || []}
                  activeEstante={activeEstante}
                  onEstanteClick={handleEstanteClick}
                  onPasilloClick={handlePasilloClick}
                  productosPorEstante={productosPorEstante}
                />
              ))}
            </div>

            {/* Entrada */}
            <div className="flex justify-center pt-1">
              <div className="flex flex-col items-center gap-0.5">
                <div className="text-primary text-xl">▲</div>
                <span className="text-[9px] font-mono font-bold text-primary tracking-widest">ENTRADA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de detalle al seleccionar */}
      {seleccion && (
        <PanelDetalle
          seleccion={seleccion}
          productos={productosDetalle}
          onCerrar={() => { setSeleccion(null); setProductosDetalle([]); }}
        />
      )}
    </div>
  );
}
