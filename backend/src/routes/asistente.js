const express = require('express');
const router = express.Router();
const pool = require('../db');
const { consultarAsistente } = require('../services/claude');
const { autenticar } = require('../middleware/auth');

router.post('/consulta', autenticar, async (req, res) => {
  const { pregunta, canal = 'chat' } = req.body;
  if (!pregunta?.trim()) {
    return res.status(400).json({ error: 'La pregunta no puede estar vacía' });
  }
  try {
    const resultado = await consultarAsistente(pregunta.trim(), canal);
    res.json(resultado);
  } catch (err) {
    console.error('Error en asistente:', err);
    res.status(500).json({ error: 'Error al procesar la consulta. Verificá la API key de Groq.' });
  }
});

router.get('/historial', autenticar, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM consultas_asistente ORDER BY fecha DESC LIMIT 10'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ubicacion/:id', autenticar, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT pr.id, pr.nombre, pr.marca, pr.cantidad, pr.unidad, pr.precio, pr.imagen_url,
        p.numero AS pasillo, e.numero AS estante, e.lado, d.numero AS divisoria
      FROM productos pr
      LEFT JOIN divisorias d ON pr.divisoria_id = d.id
      LEFT JOIN estantes e ON d.estante_id = e.id
      LEFT JOIN pasillos p ON e.pasillo_id = p.id
      WHERE pr.id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const prod = rows[0];
    const ubicacion = prod.pasillo !== null
      ? { pasillo: prod.pasillo, estante: prod.estante, lado: prod.lado, divisoria: prod.divisoria, producto: prod.nombre }
      : null;
    const respuesta = ubicacion
      ? `${prod.nombre} está en Pasillo ${prod.pasillo}, Estante ${prod.estante}${prod.lado !== 'unico' ? ' lado ' + prod.lado : ''}, Divisoria ${prod.divisoria}. Stock disponible: ${prod.cantidad} ${prod.unidad}.`
      : `${prod.nombre} no tiene una ubicación asignada actualmente.`;
    res.json({ tipo: 'ubicacion', respuesta, ubicacion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
