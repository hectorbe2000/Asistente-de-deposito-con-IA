const express = require('express');
const router = express.Router();
const pool = require('../db');
const { soloAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { rows } = await pool.query(`
      SELECT m.*, pr.nombre as producto_nombre, pr.codigo as producto_codigo,
             po.numero as pasillo_origen, eo.numero as estante_origen,
             eo.lado as lado_origen, doo.numero as div_origen,
             pd.numero as pasillo_destino, ed.numero as estante_destino,
             ed.lado as lado_destino, dd.numero as div_destino
      FROM movimientos m
      JOIN productos pr ON m.producto_id = pr.id
      LEFT JOIN divisorias doo ON m.divisoria_origen_id = doo.id
      LEFT JOIN estantes eo ON doo.estante_id = eo.id
      LEFT JOIN pasillos po ON eo.pasillo_id = po.id
      LEFT JOIN divisorias dd ON m.divisoria_destino_id = dd.id
      LEFT JOIN estantes ed ON dd.estante_id = ed.id
      LEFT JOIN pasillos pd ON ed.pasillo_id = pd.id
      ORDER BY m.fecha DESC
      LIMIT $1
    `, [limit]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', soloAdmin, async (req, res) => {
  const { producto_id, tipo, cantidad, divisoria_origen_id, divisoria_destino_id, observaciones } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO movimientos (producto_id, tipo, cantidad, divisoria_origen_id, divisoria_destino_id, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [producto_id, tipo, cantidad, divisoria_origen_id || null, divisoria_destino_id || null, observaciones]
    );
    if (tipo === 'ingreso') {
      await client.query('UPDATE productos SET cantidad = cantidad + $1, ultima_modificacion = NOW() WHERE id = $2', [cantidad, producto_id]);
    } else if (tipo === 'egreso') {
      await client.query('UPDATE productos SET cantidad = GREATEST(0, cantidad - $1), ultima_modificacion = NOW() WHERE id = $2', [cantidad, producto_id]);
    } else if (tipo === 'traslado' && divisoria_destino_id) {
      await client.query('UPDATE productos SET divisoria_id = $1, ultima_modificacion = NOW() WHERE id = $2', [divisoria_destino_id, producto_id]);
    }
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
