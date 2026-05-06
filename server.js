require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const homeRoutes = require('./routes/home');
const userRoutes = require('./routes/users');
const scriptRoutes = require('./routes/scripts');
const requestRoutes = require('./routes/requests');
const notificationRoutes = require('./routes/notifications');
const systemRoutes = require('./routes/system');
const moderationRoutes = require('./routes/moderation');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://take-one-nexus.vercel.app'
];

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin(origin, callback) {
    // Allow same-origin requests (origin will be undefined) or allowed origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS blocked this origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));
app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/moderation', moderationRoutes);

app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const { pool } = require('./config/db');
    // Using a fast query to check connection
    const [rows] = await pool.query('SELECT 1 as health_check');
    if (rows && rows[0].health_check === 1) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = `error: ${err.message}`;
    console.error('Health check DB error:', err.message);
  }

  res.json({
    success: true,
    status: 'ok',
    message: 'TAKE ONE API is running',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    env: {
      node_env: process.env.NODE_ENV || 'development',
      jwt_secret_set: Boolean(process.env.JWT_SECRET),
      db_host_set: Boolean(process.env.DB_HOST),
      db_user_set: Boolean(process.env.DB_USER),
      db_name: process.env.DB_NAME || 'take_one (default)',
      origin: req.headers.origin || 'same-origin'
    },
    database: dbStatus
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'project.htm'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'profile.htm'));
});

app.get('/project', (req, res) => {
  res.sendFile(path.join(__dirname, 'project.htm'));
});

app.get('/crew', (req, res) => {
  res.sendFile(path.join(__dirname, 'crew.htm'));
});

app.get('/legal', (req, res) => {
  res.sendFile(path.join(__dirname, 'legal.htm'));
});

app.get('/moderation', (req, res) => {
  res.sendFile(path.join(__dirname, 'moderation.htm'));
});

// Route files will keep growing as backend features are added.

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong on the server'
  });
});

const server = app.listen(PORT, () => {
  console.log('');
  console.log('TAKE ONE API running');
  console.log(`Port: ${PORT}`);
  console.log('');
  console.log('Available now:');
  console.log('GET /');
  console.log('GET /api/health');
  console.log('GET /api/home');
  console.log('GET /api/scripts/search');
  console.log('POST /api/scripts');
  console.log('POST /api/requests');
  console.log('GET /api/requests/user/:id');
  console.log('POST /api/users/register');
  console.log('POST /api/users/login');
  console.log('');
});

server.on('error', (error) => {
  console.error('Server failed to start:', error.message);
  process.exit(1);
});

connectDB().catch((error) => {
  console.error('Database boot check failed:', error.message);
});
