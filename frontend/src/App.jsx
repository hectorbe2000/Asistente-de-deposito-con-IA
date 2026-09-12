import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import VistaOperario from './pages/VistaOperario';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Inicio from './pages/Inicio';
import Inventario from './pages/Inventario';
import Mapa from './pages/Mapa';
import Movimientos from './pages/Movimientos';

function AppRouter() {
  const { usuario, cargando } = useAuth();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const location = useLocation();
  const esDashboard = location.pathname === '/';

  if (cargando) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Routes><Route path="*" element={<Login />} /></Routes>;
  }

  if (usuario.rol === 'operario') {
    return <Routes><Route path="*" element={<VistaOperario />} /></Routes>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Overlay oscuro al abrir el sidebar */}
      {sidebarAbierto && (
        <div
          className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      {/* Sidebar como drawer desde la izquierda */}
      <div className={`
        fixed top-0 left-0 h-full z-40
        transform transition-transform duration-300 ease-in-out
        ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCerrar={() => setSidebarAbierto(false)} />
      </div>

      {/* Contenido principal — ocupa toda la pantalla */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {!esDashboard && <Header onAbrirMenu={() => setSidebarAbierto(true)} />}
        <main className="flex-1 min-h-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<Inicio onAbrirMenu={() => setSidebarAbierto(true)} />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/movimientos" element={<Movimientos />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
