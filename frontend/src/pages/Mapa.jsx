import { Map } from 'lucide-react';
import MapaDeposito from '../components/Deposito/MapaDeposito';

export default function Mapa() {
  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Map size={18} className="text-primary" />
        <h1 className="text-lg font-bold text-text">Mapa del Depósito</h1>
        <span className="text-xs text-muted ml-2">Hacé click en un pasillo o estante para ver sus productos</span>
      </div>
      <div className="flex-1 min-h-0">
        <MapaDeposito />
      </div>
    </div>
  );
}
