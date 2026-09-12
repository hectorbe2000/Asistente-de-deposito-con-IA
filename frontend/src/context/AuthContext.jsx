import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('deposito_token');
    const user = localStorage.getItem('deposito_user');
    if (token && user) {
      try {
        setUsuario(JSON.parse(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch {
        localStorage.removeItem('deposito_token');
        localStorage.removeItem('deposito_user');
      }
    }
    setCargando(false);
  }, []);

  const login = async (usuarioInput, password) => {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`,
      { usuario: usuarioInput, password }
    );
    const { token, usuario: user } = res.data;
    localStorage.setItem('deposito_token', token);
    localStorage.setItem('deposito_user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUsuario(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('deposito_token');
    localStorage.removeItem('deposito_user');
    delete axios.defaults.headers.common['Authorization'];
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, esAdmin: usuario?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
