import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000,
});

// Inyectar token automáticamente en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('deposito_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expira, limpiar sesión
api.interceptors.response.use(
  r => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('deposito_token');
      localStorage.removeItem('deposito_user');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export const productosApi = {
  listar: () => api.get('/api/productos').then(r => r.data),
  buscar: (q) => api.get(`/api/productos/buscar?q=${encodeURIComponent(q)}`).then(r => r.data),
  stats: () => api.get('/api/productos/stats').then(r => r.data),
  obtener: (id) => api.get(`/api/productos/${id}`).then(r => r.data),
  crear: (data) => api.post('/api/productos', data).then(r => r.data),
  editar: (id, data) => api.put(`/api/productos/${id}`, data).then(r => r.data),
  eliminar: (id) => api.delete(`/api/productos/${id}`).then(r => r.data),
};

export const ubicacionesApi = {
  pasillos: () => api.get('/api/pasillos').then(r => r.data),
  productosPasillo: (id) => api.get(`/api/pasillos/${id}/productos`).then(r => r.data),
  disponibles: () => api.get('/api/ubicaciones/disponibles').then(r => r.data),
  categorias: () => api.get('/api/categorias').then(r => r.data),
};

export const movimientosApi = {
  listar: (limit) => api.get(`/api/movimientos${limit ? `?limit=${limit}` : ''}`).then(r => r.data),
  crear: (data) => api.post('/api/movimientos', data).then(r => r.data),
};

export const uploadsApi = {
  subirImagen: (file) => {
    const form = new FormData();
    form.append('imagen', file);
    return api.post('/api/uploads/imagen', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  urlCompleta: (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  },
};

export const asistenteApi = {
  consultar: (pregunta, canal = 'chat') =>
    api.post('/api/asistente/consulta', { pregunta, canal }).then(r => r.data),
  ubicacion: (id) =>
    api.get(`/api/asistente/ubicacion/${id}`).then(r => r.data),
  historial: () => api.get('/api/asistente/historial').then(r => r.data),
};

export default api;
