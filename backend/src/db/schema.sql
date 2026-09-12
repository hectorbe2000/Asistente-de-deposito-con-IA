-- Pasillos
CREATE TABLE IF NOT EXISTS pasillos (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL UNIQUE,
  nombre VARCHAR(50),
  descripcion TEXT
);

-- Estantes
CREATE TABLE IF NOT EXISTS estantes (
  id SERIAL PRIMARY KEY,
  pasillo_id INTEGER REFERENCES pasillos(id),
  numero INTEGER NOT NULL,
  lado VARCHAR(10) CHECK (lado IN ('izquierdo', 'derecho', 'unico')),
  UNIQUE(pasillo_id, numero, lado)
);

-- Divisorias
CREATE TABLE IF NOT EXISTS divisorias (
  id SERIAL PRIMARY KEY,
  estante_id INTEGER REFERENCES estantes(id),
  numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 7),
  capacidad_maxima INTEGER DEFAULT 10,
  UNIQUE(estante_id, numero)
);

-- Categorías de productos
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1'
);

-- Productos / Mercaderías
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  categoria_id INTEGER REFERENCES categorias(id),
  divisoria_id INTEGER REFERENCES divisorias(id),
  cantidad INTEGER DEFAULT 0,
  unidad VARCHAR(30) DEFAULT 'unidad',
  imagen_url TEXT,
  fecha_ingreso TIMESTAMP DEFAULT NOW(),
  ultima_modificacion TIMESTAMP DEFAULT NOW()
);

-- Historial de movimientos
CREATE TABLE IF NOT EXISTS movimientos (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id),
  tipo VARCHAR(20) CHECK (tipo IN ('ingreso', 'egreso', 'traslado')),
  cantidad INTEGER NOT NULL,
  divisoria_origen_id INTEGER REFERENCES divisorias(id),
  divisoria_destino_id INTEGER REFERENCES divisorias(id),
  observaciones TEXT,
  fecha TIMESTAMP DEFAULT NOW()
);

-- Historial de consultas al asistente
CREATE TABLE IF NOT EXISTS consultas_asistente (
  id SERIAL PRIMARY KEY,
  pregunta TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  canal VARCHAR(10) CHECK (canal IN ('chat', 'voz')),
  fecha TIMESTAMP DEFAULT NOW()
);
