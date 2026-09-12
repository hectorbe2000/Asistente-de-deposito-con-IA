require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: (origin, cb) => {
    // Permite cualquier localhost en dev, y FRONTEND_URL en prod
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === process.env.FRONTEND_URL) {
      cb(null, true);
    } else {
      cb(new Error('CORS no permitido'));
    }
  }
}));
app.use(express.json());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api', require('./routes/ubicaciones'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/asistente', require('./routes/asistente'));
app.use('/api/uploads', require('./routes/uploads'));

app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;
const pool = require('./db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio INTEGER DEFAULT 0');
    await pool.query('ALTER TABLE productos ADD COLUMN IF NOT EXISTS marca VARCHAR(100)');
    console.log('✔ Migration complete: precio and marca columns ready');
  } catch (err) {
    console.error('Migration error:', err);
  }
}

migrate().finally(() => {
  app.listen(PORT, () => {
    console.log(`🏭 Depósito API corriendo en http://localhost:${PORT}`);
  });
});
