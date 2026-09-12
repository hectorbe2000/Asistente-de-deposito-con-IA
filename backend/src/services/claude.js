const Groq = require('groq-sdk');
const pool = require('../db');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const STOP_WORDS = new Set([
  'donde', 'esta', 'estan', 'cual', 'cuales', 'tenemos', 'tienen', 'hay',
  'busco', 'para', 'como', 'cuando', 'este', 'esos', 'esas', 'estos',
  'quiero', 'necesito', 'dame', 'dime', 'puedes', 'favor', 'que', 'los',
  'las', 'del', 'una', 'uno', 'son', 'sus', 'por', 'con', 'sin', 'pero',
  'mas', 'muy', 'todo', 'todos', 'algo', 'algun', 'alguna', 'otro', 'otra',
  'cuanto', 'cuanta', 'cuantos', 'cuantas', 'tiene', 'tengo', 'hay',
  'ver', 'saber', 'decir', 'hacer', 'poder', 'soy', 'sos', 'fue', 'ser'
]);

async function buscarProductosPorQuery(pregunta) {
  const palabras = pregunta.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:]/g, '')
    .split(/\s+/)
    .filter(p => p.length > 2 && !STOP_WORDS.has(p));

  if (!palabras.length) return [];

  const conditions = palabras.map((_, i) =>
    `(LOWER(pr.nombre) LIKE $${i + 1} OR LOWER(COALESCE(pr.descripcion,'')) LIKE $${i + 1} OR LOWER(COALESCE(pr.marca,'')) LIKE $${i + 1})`
  ).join(' OR ');

  const params = palabras.map(p => `%${p}%`);

  const { rows } = await pool.query(`
    SELECT
      pr.id, pr.codigo, pr.nombre, pr.descripcion,
      pr.cantidad, pr.unidad, pr.precio, pr.marca, pr.imagen_url,
      p.numero AS pasillo, e.numero AS estante, e.lado, d.numero AS divisoria
    FROM productos pr
    LEFT JOIN divisorias d ON pr.divisoria_id = d.id
    LEFT JOIN estantes e ON d.estante_id = e.id
    LEFT JOIN pasillos p ON e.pasillo_id = p.id
    WHERE ${conditions}
    ORDER BY pr.nombre
    LIMIT 15
  `, params);

  return rows;
}

async function obtenerInventarioContexto() {
  const { rows } = await pool.query(`
    SELECT
      pr.id, pr.codigo, pr.nombre, pr.descripcion,
      pr.cantidad, pr.unidad, pr.marca, pr.precio,
      cat.nombre AS categoria,
      p.numero AS pasillo, e.numero AS estante, e.lado, d.numero AS divisoria
    FROM productos pr
    LEFT JOIN divisorias d ON pr.divisoria_id = d.id
    LEFT JOIN estantes e ON d.estante_id = e.id
    LEFT JOIN pasillos p ON e.pasillo_id = p.id
    LEFT JOIN categorias cat ON pr.categoria_id = cat.id
    ORDER BY p.numero, e.numero, d.numero
  `);
  return rows;
}

async function guardarConsulta(pregunta, respuesta, canal) {
  try {
    await pool.query(
      'INSERT INTO consultas_asistente (pregunta, respuesta, canal) VALUES ($1, $2, $3)',
      [pregunta, respuesta, canal]
    );
  } catch (_) {}
}

async function consultarAsistente(pregunta, canal) {
  const productosEncontrados = await buscarProductosPorQuery(pregunta);

  if (productosEncontrados.length === 1) {
    const prod = productosEncontrados[0];
    const respuesta = prod.pasillo
      ? `${prod.nombre} está en Pasillo ${prod.pasillo}, Estante ${prod.estante}${prod.lado !== 'unico' ? ` lado ${prod.lado}` : ''}, Divisoria ${prod.divisoria}. Stock: ${prod.cantidad} ${prod.unidad}.`
      : `${prod.nombre} no tiene una ubicación asignada actualmente.`;
    const ubicacion = prod.pasillo
      ? { pasillo: prod.pasillo, estante: prod.estante, lado: prod.lado, divisoria: prod.divisoria, producto: prod.nombre }
      : null;
    await guardarConsulta(pregunta, respuesta, canal);
    return { tipo: 'ubicacion', respuesta, ubicacion };
  }

  if (productosEncontrados.length > 1) {
    // En modo voz no se pueden mostrar tarjetas: responder con el de mayor stock
    if (canal === 'voz') {
      const mejor = [...productosEncontrados].sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0))[0];
      const nombres = productosEncontrados.map(p => p.nombre).join(', ');
      const respuesta = mejor.pasillo
        ? `Hay ${productosEncontrados.length} variantes: ${nombres}. El de mayor stock es ${mejor.nombre}, en Pasillo ${mejor.pasillo}, Divisoria ${mejor.divisoria}.`
        : `Encontré ${productosEncontrados.length} variantes: ${nombres}. Ninguna tiene ubicación asignada.`;
      const ubicacion = mejor.pasillo
        ? { pasillo: mejor.pasillo, estante: mejor.estante, lado: mejor.lado, divisoria: mejor.divisoria, producto: mejor.nombre }
        : null;
      await guardarConsulta(pregunta, respuesta, canal);
      return { tipo: 'ubicacion', respuesta, ubicacion };
    }

    // Modo chat: mostrar tarjetas para seleccionar
    const respuesta = `Encontré ${productosEncontrados.length} productos disponibles. ¿Cuál es el que buscás?`;
    const opciones = productosEncontrados.map(p => ({
      id: p.id, codigo: p.codigo, nombre: p.nombre,
      marca: p.marca || '', precio: p.precio || 0, imagen_url: p.imagen_url || null,
      cantidad: p.cantidad, unidad: p.unidad,
    }));
    await guardarConsulta(pregunta, respuesta, canal);
    return { tipo: 'opciones', respuesta, opciones };
  }

  // No products found - use Groq LLM
  const inventario = await obtenerInventarioContexto();
  const inventarioFormateado = inventario.map(p => ({
    codigo: p.codigo, nombre: p.nombre, marca: p.marca, categoria: p.categoria,
    cantidad: p.cantidad, unidad: p.unidad,
    ubicacion: p.pasillo
      ? { pasillo: p.pasillo, estante: p.estante, lado: p.lado !== 'unico' ? p.lado : null, divisoria: p.divisoria }
      : 'Sin ubicación'
  }));

  const systemPrompt = `Sos el asistente del depósito Apolo Import S.A. Ayudás a los operarios a gestionar el inventario.

INVENTARIO ACTUAL (${inventarioFormateado.length} productos):
${JSON.stringify(inventarioFormateado, null, 2)}

REGLAS:
- Respondé siempre en español, directo y práctico
- Si el producto no está en el inventario, decilo claramente y sugerí alternativas
- Si te hacen preguntas no relacionadas con el depósito, redirigí amablemente
${canal === 'voz'
    ? '- Respuesta MUY CORTA: máximo 2 oraciones directas.'
    : '- Podés dar más detalle. Máximo 4-5 oraciones.'}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: canal === 'voz' ? 200 : 600,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: pregunta }
    ],
  });

  const respuesta = completion.choices[0].message.content;
  const ubicacion = detectarUbicacion(respuesta, inventario, pregunta);
  await guardarConsulta(pregunta, respuesta, canal);
  return { tipo: 'texto', respuesta, ubicacion };
}

function detectarUbicacion(respuesta, inventario, pregunta) {
  const textoBusqueda = (pregunta + ' ' + respuesta).toLowerCase();
  for (const prod of inventario) {
    if (!prod.pasillo) continue;
    const palabras = prod.nombre.toLowerCase().split(' ').filter(p => p.length > 3);
    if (palabras.some(p => textoBusqueda.includes(p))) {
      return { pasillo: prod.pasillo, estante: prod.estante, lado: prod.lado, divisoria: prod.divisoria, producto: prod.nombre };
    }
  }
  return null;
}

module.exports = { consultarAsistente };
