require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connectDB } = require('./config/db');
const { captureError, initSentry } = require('./src/lib/sentry');

// Initialize Sentry for backend tracking
initSentry();

const homeRoutes = require('./routes/home');
const userRoutes = require('./routes/users');
const scriptRoutes = require('./routes/scripts');
const requestRoutes = require('./routes/requests');
const notificationRoutes = require('./routes/notifications');
const systemRoutes = require('./routes/system');
const moderationRoutes = require('./routes/moderation');
const chatRoutes = require('./routes/chat');
const tasksRoutes = require('./routes/tasks');
const issuesRoutes = require('./routes/issues');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://take-one-nexus.vercel.app',
  'https://takeone-nexus.net.in',
  'https://www.takeone-nexus.net.in'
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
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'public', 'assets', 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/issues', issuesRoutes);

app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbDetails = {};
  
  try {
    const { pool, dbConfig } = require('./config/db');
    const start = Date.now();
    const [rows] = await pool.query('SELECT 1 as health_check');
    const latency = Date.now() - start;
    
    if (rows && rows[0].health_check === 1) {
      dbStatus = 'connected';
      dbDetails = {
        status: 'online',
        latency: `${latency}ms`,
        host: dbConfig.host,
        database: dbConfig.database
      };
    }
  } catch (err) {
    dbStatus = 'error';
    dbDetails = {
      status: 'offline',
      error: err.code || err.message,
      message: err.message
    };
    console.error('Health check DB error:', err.message);
  }


  let prismaStatus = 'unknown';
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    prismaStatus = 'connected';
    await prisma.$disconnect();
  } catch (err) {
    console.error('Prisma health check failed:', err.message);
    prismaStatus = 'error: ' + err.message;
  }

  res.json({
    success: true,
    status: (dbStatus === 'connected' && prismaStatus === 'connected') ? 'ok' : 'degraded',
    message: 'TAKE ONE API is running',
    version: '2.2.0',
    timestamp: new Date().toISOString(),
    env: {
      node_env: process.env.NODE_ENV || 'development',
      jwt_secret_set: Boolean(process.env.JWT_SECRET),
      db_configured: Boolean(process.env.DB_HOST || process.env.DATABASE_URL)
    },
    database: {
        ...dbDetails,
        prisma: prismaStatus
    },
    system: {
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      uptime: Math.round(process.uptime()) + 's'
    }
  });
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'project.htm'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.htm'));
});

app.get('/project', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'project.htm'));
});

app.get('/crew', (req, res) => {
  res.redirect(308, '/crew.htm');
});

app.get('/legal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'legal.htm'));
});

app.get('/moderation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'moderation.htm'));
});


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  
  console.error(`[Server Error] ${req.method} ${req.url}`);
  console.error(err);

  // Report to Sentry with request context
  captureError(err, {
    url: req.url,
    method: req.method,
    status
  });

  // Hide detailed error messages in production unless they are intentionally thrown
  const message = (isProd && status === 500) 
    ? 'An internal server error occurred. Our team has been notified.' 
    : err.message || 'Something went wrong on the server';

  res.status(status).json({
    success: false,
    status,
    message,
    ...(isProd ? {} : { stack: err.stack })
  });
});


// For Vercel serverless environment, we export the app and only call listen if run directly
if (require.main === module || process.env.NODE_ENV !== 'production') {
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
}

module.exports = app;

if (require.main === module || process.env.TAKE_ONE_DB_BOOT_CHECK === 'true') {
  connectDB().catch((error) => {
    console.error('Database boot check failed:', error.message);
  });
}
