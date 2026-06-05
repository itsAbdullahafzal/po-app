require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Allow requests from localhost dev AND any configured production frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin requests (mobile apps, curl, etc.) or known origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

async function start() {
  await require('./db/database').initialize();

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/po', require('./routes/po'));
  app.use('/api/fulfillment', require('./routes/fulfillment'));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

  // Helpful root page
  app.get('/', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    res.send(`<html><body style="font-family:sans-serif;max-width:500px;margin:60px auto;text-align:center">
      <h2>PO Manager — API Server</h2>
      <p>This is the backend API. Open the app at:</p>
      <a href="${frontendUrl}" style="font-size:1.4em;color:#2563eb">${frontendUrl}</a>
      <p style="color:#888;margin-top:30px">Health: <a href="/api/health">/api/health</a></p>
    </body></html>`);
  });

  app.listen(PORT, () => {
    console.log(`PO App backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch(err => { console.error('Startup failed:', err); process.exit(1); });
