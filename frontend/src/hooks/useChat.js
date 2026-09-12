import { useState, useCallback, useRef } from 'react';
import { asistenteApi } from '../services/api';

const BIENVENIDA = {
  id: 'welcome',
  rol: 'asistente',
  tipo: 'texto',
  texto: '¡Hola! Soy el asistente del depósito. Preguntame dónde está cualquier producto o qué variedades tenemos disponibles.',
  fecha: new Date(),
};

export function useChat({ onUbicacion } = {}) {
  const [mensajes, setMensajes] = useState([BIENVENIDA]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const contadorRef = useRef(1);
  // Ref para evitar que enviarMensaje se recree en cada cambio de estado de cargando
  const cargandoRef = useRef(false);

  const enviarMensaje = useCallback(async (texto, canal = 'chat') => {
    if (!texto?.trim() || cargandoRef.current) return;

    const idUsuario = `u-${++contadorRef.current}`;
    setMensajes(prev => [...prev, { id: idUsuario, rol: 'usuario', tipo: 'texto', texto: texto.trim(), fecha: new Date() }]);
    cargandoRef.current = true;
    setCargando(true);
    setError(null);

    try {
      const { tipo, respuesta, ubicacion, opciones } = await asistenteApi.consultar(texto.trim(), canal);
      const idAsistente = `a-${++contadorRef.current}`;
      setMensajes(prev => [...prev, {
        id: idAsistente, rol: 'asistente',
        tipo: tipo || 'texto', texto: respuesta,
        ubicacion, opciones,
        fecha: new Date(),
      }]);
      if (tipo === 'ubicacion' && ubicacion && onUbicacion) {
        onUbicacion(ubicacion);
      }
      return { respuesta, ubicacion };
    } catch (err) {
      const msg = err.response?.data?.error || 'Error de conexión con el servidor';
      setError(msg);
      setMensajes(prev => [...prev, { id: `e-${++contadorRef.current}`, rol: 'error', tipo: 'texto', texto: msg, fecha: new Date() }]);
      return null;
    } finally {
      cargandoRef.current = false;
      setCargando(false);
    }
  }, [onUbicacion]); // cargando removido de deps — se lee via cargandoRef

  const seleccionarProducto = useCallback(async (productoId, msgId) => {
    setMensajes(prev => prev.map(m => m.id === msgId ? { ...m, seleccionado: productoId } : m));
    cargandoRef.current = true;
    setCargando(true);
    try {
      const { tipo, respuesta, ubicacion } = await asistenteApi.ubicacion(productoId);
      setMensajes(prev => [...prev, {
        id: `a-${++contadorRef.current}`, rol: 'asistente',
        tipo: tipo || 'ubicacion', texto: respuesta,
        ubicacion, fecha: new Date(),
      }]);
      if (ubicacion && onUbicacion) {
        onUbicacion(ubicacion);
      }
      return { respuesta };
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al obtener la ubicación';
      setMensajes(prev => [...prev, { id: `e-${++contadorRef.current}`, rol: 'error', tipo: 'texto', texto: msg, fecha: new Date() }]);
      return null;
    } finally {
      cargandoRef.current = false;
      setCargando(false);
    }
  }, [onUbicacion]);

  const limpiarChat = useCallback(() => {
    setMensajes([BIENVENIDA]);
    setError(null);
  }, []);

  return { mensajes, cargando, error, enviarMensaje, limpiarChat, seleccionarProducto };
}
