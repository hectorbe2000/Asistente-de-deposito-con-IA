require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('../db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS pasillos (
        id SERIAL PRIMARY KEY,
        numero INTEGER NOT NULL UNIQUE,
        nombre VARCHAR(50),
        descripcion TEXT
      );
      CREATE TABLE IF NOT EXISTS estantes (
        id SERIAL PRIMARY KEY,
        pasillo_id INTEGER REFERENCES pasillos(id),
        numero INTEGER NOT NULL,
        lado VARCHAR(10) CHECK (lado IN ('izquierdo', 'derecho', 'unico')),
        UNIQUE(pasillo_id, numero, lado)
      );
      CREATE TABLE IF NOT EXISTS divisorias (
        id SERIAL PRIMARY KEY,
        estante_id INTEGER REFERENCES estantes(id),
        numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 7),
        capacidad_maxima INTEGER DEFAULT 10,
        UNIQUE(estante_id, numero)
      );
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        color VARCHAR(7) DEFAULT '#6366f1'
      );
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
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        rol VARCHAR(10) CHECK (rol IN ('admin', 'operario')) NOT NULL DEFAULT 'operario',
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS consultas_asistente (
        id SERIAL PRIMARY KEY,
        pregunta TEXT NOT NULL,
        respuesta TEXT NOT NULL,
        canal VARCHAR(10) CHECK (canal IN ('chat', 'voz')),
        fecha TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Tablas creadas');

    // Limpiar datos existentes
    await client.query('DELETE FROM movimientos');
    await client.query('DELETE FROM productos');
    await client.query('DELETE FROM divisorias');
    await client.query('DELETE FROM estantes');
    await client.query('DELETE FROM pasillos');
    await client.query('DELETE FROM categorias');
    await client.query('DELETE FROM consultas_asistente');
    await client.query('DELETE FROM usuarios');

    // Reset sequences
    await client.query(`
      SELECT setval('pasillos_id_seq', 1, false);
      SELECT setval('estantes_id_seq', 1, false);
      SELECT setval('divisorias_id_seq', 1, false);
      SELECT setval('categorias_id_seq', 1, false);
      SELECT setval('productos_id_seq', 1, false);
      SELECT setval('movimientos_id_seq', 1, false);
      SELECT setval('usuarios_id_seq', 1, false);
    `);

    // Pasillos
    for (let i = 1; i <= 15; i++) {
      await client.query(
        'INSERT INTO pasillos (numero, nombre, descripcion) VALUES ($1, $2, $3)',
        [i, `Pasillo ${i}`, i === 1 ? 'Pasillo de un solo lado (9 estantes)' : `Pasillo con 4 estantes a cada lado`]
      );
    }
    console.log('✅ 15 pasillos insertados');

    // Estantes
    const { rows: pasillosRows } = await client.query('SELECT id, numero FROM pasillos ORDER BY numero');
    const pasilloMap = {};
    pasillosRows.forEach(p => pasilloMap[p.numero] = p.id);

    for (const p of pasillosRows) {
      if (p.numero === 1) {
        // Pasillo 1: 9 estantes, lado único
        for (let e = 1; e <= 9; e++) {
          await client.query(
            'INSERT INTO estantes (pasillo_id, numero, lado) VALUES ($1, $2, $3)',
            [p.id, e, 'unico']
          );
        }
      } else {
        // Pasillos 2-15: 4 estantes izquierdo + 4 estantes derecho
        for (let e = 1; e <= 4; e++) {
          await client.query(
            'INSERT INTO estantes (pasillo_id, numero, lado) VALUES ($1, $2, $3)',
            [p.id, e, 'izquierdo']
          );
          await client.query(
            'INSERT INTO estantes (pasillo_id, numero, lado) VALUES ($1, $2, $3)',
            [p.id, e, 'derecho']
          );
        }
      }
    }
    console.log('✅ Estantes insertados (9 para Pasillo 1, 8 para cada uno de los demás)');

    // Divisorias (7 por cada estante)
    const { rows: estantesRows } = await client.query('SELECT id FROM estantes');
    for (const est of estantesRows) {
      for (let d = 1; d <= 7; d++) {
        await client.query(
          'INSERT INTO divisorias (estante_id, numero, capacidad_maxima) VALUES ($1, $2, $3)',
          [est.id, d, 10]
        );
      }
    }
    console.log('✅ Divisorias insertadas (7 por estante)');

    // Categorías
    const categorias = [
      { nombre: 'Electrónica', color: '#4f6ef7' },
      { nombre: 'Herramientas', color: '#f7a24f' },
      { nombre: 'Almacén', color: '#4fdc7c' },
      { nombre: 'Limpieza', color: '#4fc8f7' },
      { nombre: 'Varios', color: '#b04ff7' },
    ];
    for (const cat of categorias) {
      await client.query('INSERT INTO categorias (nombre, color) VALUES ($1, $2)', [cat.nombre, cat.color]);
    }
    console.log('✅ 5 categorías insertadas');

    // Helper para obtener divisoria_id por pasillo/estante/lado/divisoria
    const getDivisoriaId = async (numPasillo, numEstante, lado, numDivisoria) => {
      const result = await client.query(`
        SELECT d.id FROM divisorias d
        JOIN estantes e ON d.estante_id = e.id
        JOIN pasillos p ON e.pasillo_id = p.id
        WHERE p.numero = $1 AND e.numero = $2 AND e.lado = $3 AND d.numero = $4
      `, [numPasillo, numEstante, lado, numDivisoria]);
      return result.rows[0]?.id;
    };

    // Productos (20 de ejemplo)
    const productos = [
      { codigo: 'ELEC-001', nombre: 'Cable HDMI 2m', desc: 'Cable HDMI de alta definición 4K', cat: 1, p: 2, e: 1, l: 'izquierdo', d: 1, cant: 45, unidad: 'unidad' },
      { codigo: 'ELEC-002', nombre: 'Cargador USB-C 65W', desc: 'Cargador rápido para laptops', cat: 1, p: 2, e: 2, l: 'izquierdo', d: 3, cant: 28, unidad: 'unidad' },
      { codigo: 'ELEC-003', nombre: 'Memoria RAM DDR4 8GB', desc: 'Módulo de memoria DDR4 2400MHz', cat: 1, p: 2, e: 3, l: 'derecho', d: 2, cant: 15, unidad: 'unidad' },
      { codigo: 'HERR-001', nombre: 'Destornillador Phillips #2', desc: 'Destornillador de punta cruz', cat: 2, p: 3, e: 1, l: 'izquierdo', d: 4, cant: 32, unidad: 'unidad' },
      { codigo: 'HERR-002', nombre: 'Llave ajustable 12"', desc: 'Llave inglesa ajustable 300mm', cat: 2, p: 3, e: 2, l: 'derecho', d: 1, cant: 18, unidad: 'unidad' },
      { codigo: 'HERR-003', nombre: 'Taladro percutor 750W', desc: 'Taladro eléctrico con percusión', cat: 2, p: 3, e: 3, l: 'izquierdo', d: 5, cant: 7, unidad: 'unidad' },
      { codigo: 'HERR-004', nombre: 'Tornillos autorroscantes 4x30', desc: 'Caja de 100 unidades', cat: 2, p: 4, e: 3, l: 'izquierdo', d: 2, cant: 450, unidad: 'caja' },
      { codigo: 'ALM-001', nombre: 'Arroz 5kg', desc: 'Arroz largo fino', cat: 3, p: 5, e: 1, l: 'izquierdo', d: 1, cant: 60, unidad: 'bolsa' },
      { codigo: 'ALM-002', nombre: 'Aceite girasol 1L', desc: 'Aceite de girasol refinado', cat: 3, p: 5, e: 2, l: 'izquierdo', d: 3, cant: 84, unidad: 'botella' },
      { codigo: 'ALM-003', nombre: 'Harina 0000 1kg', desc: 'Harina de trigo extra fina', cat: 3, p: 5, e: 3, l: 'derecho', d: 2, cant: 120, unidad: 'bolsa' },
      { codigo: 'ALM-004', nombre: 'Azúcar 1kg', desc: 'Azúcar refinada', cat: 3, p: 6, e: 1, l: 'izquierdo', d: 4, cant: 95, unidad: 'bolsa' },
      { codigo: 'LIM-001', nombre: 'Lavandina 1L', desc: 'Blanqueador concentrado', cat: 4, p: 7, e: 2, l: 'derecho', d: 1, cant: 72, unidad: 'botella' },
      { codigo: 'LIM-002', nombre: 'Detergente líquido 500ml', desc: 'Lavavajillas concentrado', cat: 4, p: 7, e: 3, l: 'izquierdo', d: 6, cant: 48, unidad: 'botella' },
      { codigo: 'LIM-003', nombre: 'Desinfectante piso 1L', desc: 'Limpiador de pisos multi-superficies', cat: 4, p: 8, e: 1, l: 'izquierdo', d: 2, cant: 36, unidad: 'botella' },
      { codigo: 'VAR-001', nombre: 'Pilas AA (pack x4)', desc: 'Pilas alcalinas AA', cat: 5, p: 9, e: 4, l: 'derecho', d: 7, cant: 88, unidad: 'pack' },
      { codigo: 'VAR-002', nombre: 'Cinta adhesiva transparente', desc: 'Rollo de cinta adhesiva 50m', cat: 5, p: 10, e: 2, l: 'izquierdo', d: 3, cant: 55, unidad: 'rollo' },
      { codigo: 'ELEC-004', nombre: 'Lámpara LED 9W', desc: 'Foco LED E27 luz cálida', cat: 1, p: 11, e: 1, l: 'derecho', d: 1, cant: 200, unidad: 'unidad' },
      { codigo: 'HERR-005', nombre: 'Metro de madera 2m', desc: 'Regla articulada de madera', cat: 2, p: 12, e: 3, l: 'izquierdo', d: 4, cant: 22, unidad: 'unidad' },
      { codigo: 'VAR-003', nombre: 'Bolsas plásticas 50x70', desc: 'Bolsas de polietileno resistentes', cat: 5, p: 13, e: 2, l: 'derecho', d: 5, cant: 3, unidad: 'paquete' },
      { codigo: 'ALM-005', nombre: 'Café molido 500g', desc: 'Café tostado y molido', cat: 3, p: 14, e: 4, l: 'izquierdo', d: 2, cant: 41, unidad: 'paquete' },
    ];

    const { rows: catRows } = await client.query('SELECT id, nombre FROM categorias ORDER BY id');
    const catMap = {};
    catRows.forEach(c => catMap[c.id] = c.id);

    for (const prod of productos) {
      const divId = await getDivisoriaId(prod.p, prod.e, prod.l, prod.d);
      if (!divId) {
        console.warn(`⚠️  Divisoria no encontrada para ${prod.codigo}: P${prod.p} E${prod.e} L${prod.l} D${prod.d}`);
        continue;
      }
      await client.query(
        `INSERT INTO productos (codigo, nombre, descripcion, categoria_id, divisoria_id, cantidad, unidad)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [prod.codigo, prod.nombre, prod.desc, prod.cat, divId, prod.cant, prod.unidad]
      );
    }
    console.log('✅ 20 productos insertados');

    // Movimientos de ejemplo
    const { rows: prodRows } = await client.query('SELECT id FROM productos LIMIT 5');
    const tiposMov = ['ingreso', 'egreso', 'ingreso', 'egreso', 'ingreso'];
    for (let i = 0; i < prodRows.length; i++) {
      await client.query(
        `INSERT INTO movimientos (producto_id, tipo, cantidad, observaciones)
         VALUES ($1, $2, $3, $4)`,
        [prodRows[i].id, tiposMov[i], Math.floor(Math.random() * 20) + 1, 'Movimiento inicial de stock']
      );
    }
    console.log('✅ Movimientos de ejemplo insertados');

    // Usuarios
    const hashAdmin = await bcrypt.hash('admin123', 10);
    const hashOp = await bcrypt.hash('operario123', 10);
    await client.query(
      `INSERT INTO usuarios (usuario, password_hash, nombre, rol) VALUES ($1, $2, $3, $4)`,
      ['admin', hashAdmin, 'Administrador', 'admin']
    );
    await client.query(
      `INSERT INTO usuarios (usuario, password_hash, nombre, rol) VALUES ($1, $2, $3, $4)`,
      ['operario', hashOp, 'Operario', 'operario']
    );
    console.log('✅ Usuarios creados:');
    console.log('   👤 admin     / admin123     (rol: administrador)');
    console.log('   👤 operario  / operario123  (rol: operario)');

    await client.query('COMMIT');
    console.log('\n🎉 Seed completado exitosamente!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
