const express = require('express');
const router = express.Router();
const pool = require('../db');
const { autenticar, soloAdmin } = require('../middleware/auth');

const PRODUCTO_SELECT = `
  SELECT
    pr.id, pr.codigo, pr.nombre, pr.descripcion,
    pr.cantidad, pr.unidad, pr.precio, pr.marca, pr.imagen_url, pr.fecha_ingreso, pr.ultima_modificacion,
    cat.id AS categoria_id, cat.nombre AS categoria, cat.color AS categoria_color,
    p.id AS pasillo_id, p.numero AS pasillo_numero,
    e.id AS estante_id, e.numero AS estante_numero, e.lado,
    d.id AS divisoria_id, d.numero AS divisoria_numero
  FROM productos pr
  LEFT JOIN categorias cat ON pr.categoria_id = cat.id
  LEFT JOIN divisorias d ON pr.divisoria_id = d.id
  LEFT JOIN estantes e ON d.estante_id = e.id
  LEFT JOIN pasillos p ON e.pasillo_id = p.id
`;

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(PRODUCTO_SELECT + ' ORDER BY pr.nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/buscar', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const { rows } = await pool.query(
      PRODUCTO_SELECT + ` WHERE pr.nombre ILIKE $1 OR pr.codigo ILIKE $1 OR pr.descripcion ILIKE $1 ORDER BY pr.nombre LIMIT 20`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) as total, SUM(cantidad) as stock_total FROM productos');
    const stockBajo = await pool.query('SELECT COUNT(*) as count FROM productos WHERE cantidad < 5');
    const sinUbicacion = await pool.query('SELECT COUNT(*) as count FROM productos WHERE divisoria_id IS NULL');
    res.json({
      total_productos: parseInt(total.rows[0].total),
      stock_total: parseInt(total.rows[0].stock_total) || 0,
      stock_bajo: parseInt(stockBajo.rows[0].count),
      sin_ubicacion: parseInt(sinUbicacion.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(PRODUCTO_SELECT + ' WHERE pr.id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', soloAdmin, async (req, res) => {
  const { codigo, nombre, descripcion, categoria_id, divisoria_id, cantidad, unidad, precio, marca, imagen_url } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO productos (codigo, nombre, descripcion, categoria_id, divisoria_id, cantidad, unidad, precio, marca, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [codigo, nombre, descripcion, categoria_id, divisoria_id, cantidad || 0, unidad || 'unidad', precio, marca, imagen_url]
    );
    const producto = await pool.query(PRODUCTO_SELECT + ' WHERE pr.id = $1', [rows[0].id]);
    res.status(201).json(producto.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', soloAdmin, async (req, res) => {
  const { codigo, nombre, descripcion, categoria_id, divisoria_id, cantidad, unidad, precio, marca, imagen_url } = req.body;
  try {
    await pool.query(
      `UPDATE productos SET codigo=$1, nombre=$2, descripcion=$3, categoria_id=$4,
       divisoria_id=$5, cantidad=$6, unidad=$7, precio=$8, marca=$9, imagen_url=$10, ultima_modificacion=NOW()
       WHERE id=$11`,
      [codigo, nombre, descripcion, categoria_id, divisoria_id, cantidad, unidad, precio, marca, imagen_url, req.params.id]
    );
    const producto = await pool.query(PRODUCTO_SELECT + ' WHERE pr.id = $1', [req.params.id]);
    res.json(producto.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM movimientos WHERE producto_id = $1', [req.params.id]);
    await pool.query('DELETE FROM productos WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
