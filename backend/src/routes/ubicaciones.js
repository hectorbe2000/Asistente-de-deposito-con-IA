const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/pasillos', async (req, res) => {
  try {
    const { rows: pasillos } = await pool.query('SELECT * FROM pasillos ORDER BY numero');
    const result = [];
    for (const pasillo of pasillos) {
      const { rows: estantes } = await pool.query(
        'SELECT * FROM estantes WHERE pasillo_id = $1 ORDER BY lado, numero',
        [pasillo.id]
      );
      const estantesConDiv = [];
      for (const estante of estantes) {
        const { rows: divisorias } = await pool.query(
          'SELECT d.*, (SELECT COUNT(*) FROM productos WHERE divisoria_id = d.id) as productos_count FROM divisorias d WHERE d.estante_id = $1 ORDER BY numero',
          [estante.id]
        );
        estantesConDiv.push({ ...estante, divisorias });
      }
      const { rows: stats } = await pool.query(
        `SELECT COUNT(pr.id) as total_productos, COALESCE(SUM(pr.cantidad), 0) as total_stock
         FROM productos pr
         JOIN divisorias d ON pr.divisoria_id = d.id
         JOIN estantes e ON d.estante_id = e.id
         WHERE e.pasillo_id = $1`,
        [pasillo.id]
      );
      result.push({ ...pasillo, estantes: estantesConDiv, ...stats[0] });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pasillos/:id/productos', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT pr.*, cat.nombre as categoria, cat.color as categoria_color,
             p.numero as pasillo_numero, e.numero as estante_numero,
             e.lado, d.numero as divisoria_numero
      FROM productos pr
      JOIN divisorias d ON pr.divisoria_id = d.id
      JOIN estantes e ON d.estante_id = e.id
      JOIN pasillos p ON e.pasillo_id = p.id
      LEFT JOIN categorias cat ON pr.categoria_id = cat.id
      WHERE p.id = $1
      ORDER BY pr.nombre
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/disponibles', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT d.id, d.numero as divisoria_numero, d.capacidad_maxima,
             e.numero as estante_numero, e.lado,
             p.numero as pasillo_numero,
             (d.capacidad_maxima - COALESCE((SELECT COUNT(*) FROM productos WHERE divisoria_id = d.id), 0)) as espacios_libres
      FROM divisorias d
      JOIN estantes e ON d.estante_id = e.id
      JOIN pasillos p ON e.pasillo_id = p.id
      WHERE (SELECT COUNT(*) FROM productos WHERE divisoria_id = d.id) < d.capacidad_maxima
      ORDER BY p.numero, e.lado, e.numero, d.numero
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categorias', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categorias ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
