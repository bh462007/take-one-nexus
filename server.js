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

// 1. Security Headers (Helmet)
const helmet = require('helmet');

const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://us.i.posthog.com", "https://eu.i.posthog.com", "https://app.posthog.com", "https://cdn.jsdelivr.net", "https://js.sentry-cdn.com", "https://browser.sentry-cdn.com", "https://takeone-nexus.net.in", "https://www.takeone-nexus.net.in"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
    imgSrc: ["'self'", "blob:", "data:", "https://api.dicebear.com", "https://ui-avatars.com", "https://us.i.posthog.com", "https://eu.i.posthog.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
    connectSrc: ["'self'", "https://us.i.posthog.com", "https://eu.i.posthog.com", "https://app.posthog.com", "https://sentry.io", "https://*.sentry.io", "wss://*.pusher.com", "https://*.pusher.com", "https://*.pusherapp.com", "wss://*.pusherapp.com", "http://localhost:*", "ws://localhost:*", "https://takeone-nexus.net.in", "https://www.takeone-nexus.net.in"],
    frameSrc: ["'self'", "https://us.posthog.com", "https://eu.posthog.com", "https://app.posthog.com"],
    workerSrc: ["'self'", "blob:"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
  },
};

app.use(helmet({
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: "sameorigin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xContentTypeOptions: true,
}));

// Set Permissions-Policy globally
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=()');
  next();
});

// 2. Strict CORS Configuration
const allowedOrigins = [
  'https://takeone-nexus.net.in',
  'https://www.takeone-nexus.net.in'
];

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push(
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  );
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin (no origin) or allowed origins
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost'))) {
      return callback(null, true);
    }
    
    // Check for Vercel preview deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    console.warn(`[SECURITY] CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400 // 24 hours
}));

// 3. Global Rate Limiting
const { createRateLimiter } = require('./middleware/rateLimiter');
const globalLimiter = createRateLimiter({
  limit: 200, // 200 requests
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyPrefix: 'global'
});
app.use(globalLimiter);

// 4. Body Parsing & Sanitization
app.use(express.json({ limit: '10kb' })); // Limit body size to 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

const { sanitizeMiddleware } = require('./utils/validation');
app.use(sanitizeMiddleware); // Prevent XSS globally

app.use('/uploads', express.static(path.join(__dirname, 'public', 'assets', 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// 5. Routes
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
