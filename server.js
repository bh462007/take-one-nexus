require('dotenv').config();

// 0. Validate critical environment variables
const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  if (!process.env.JWT_SECRET) {
    console.error('\n==================================================');
    console.error('❌ CRITICAL CONFIGURATION ERROR: JWT_SECRET IS MISSING');
    console.error('Production environment requires JWT_SECRET to be configured.');
    console.error('==================================================\n');
    process.exit(1);
  }
} else {
  const hasDB = process.env.DATABASE_URL || process.env.DB_HOST;
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!hasDB) missing.push('DATABASE_URL (or DB_HOST)');
  
  if (missing.length > 0) {
    console.error('\n==================================================');
    console.error('❌ CRITICAL CONFIGURATION ERROR: MISSING ENVIRONMENT VARIABLES');
    console.error('The following required local environment variables are missing:');
    missing.forEach(key => {
      console.error(`  - ${key}`);
    });
    console.error('\nPlease check your .env or .env.local file.');
    console.error('To configure local development properly:');
    console.error('1. Copy .env.example to .env');
    console.error('2. Set values for JWT_SECRET and DATABASE_URL');
    console.error('==================================================\n');
  }
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connectDB } = require('./config/db');
const { captureError, initSentry } = require('./src/lib/sentry');
const csrfProtection = require('./middleware/csrf');
const csrfRoutes = require('./routes/csrf');


// Initialize Sentry for backend tracking
initSentry();

const homeRoutes = require('./routes/home');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const scriptRoutes = require('./routes/scripts');
const requestRoutes = require('./routes/requests');
const notificationRoutes = require('./routes/notifications');
const systemRoutes = require('./routes/system');
const moderationRoutes = require('./routes/moderation');
const chatRoutes = require('./routes/chat');
const tasksRoutes = require('./routes/tasks');
const issuesRoutes = require('./routes/issues');
const otpRoutes = require('./routes/otp');
const creditsRoutes = require('./routes/credits');
const paymentRoutes = require('./routes/payments');
const communityRoutes = require('./routes/community');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Security Headers (Helmet)
const helmet = require('helmet');

const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://us.i.posthog.com", "https://eu.i.posthog.com", "https://app.posthog.com", "https://cdn.jsdelivr.net", "https://js.sentry-cdn.com", "https://browser.sentry-cdn.com", "https://takeone-nexus.net.in", "https://www.takeone-nexus.net.in", "https://checkout.razorpay.com", "https://*.razorpay.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
    imgSrc: ["'self'", "blob:", "data:", "https://api.dicebear.com", "https://ui-avatars.com", "https://us.i.posthog.com", "https://eu.i.posthog.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
    connectSrc: ["'self'", "https://us.i.posthog.com", "https://eu.i.posthog.com", "https://app.posthog.com", "https://sentry.io", "https://*.sentry.io", "wss://*.pusher.com", "https://*.pusher.com", "https://*.pusherapp.com", "wss://*.pusherapp.com", "http://localhost:*", "ws://localhost:*", "http://127.0.0.1:*", "ws://127.0.0.1:*", "https://takeone-nexus.net.in", "https://www.takeone-nexus.net.in", "https://admin.takeone-nexus.net.in", "https://scripts.takeone-nexus.net.in", "https://api.razorpay.com", "https://*.razorpay.com"],
    frameSrc: ["'self'", "https://us.posthog.com", "https://eu.posthog.com", "https://app.posthog.com", "https://api.razorpay.com", "https://*.razorpay.com", "https://checkout.razorpay.com", "https://admin.takeone-nexus.net.in", "https://scripts.takeone-nexus.net.in"],
    workerSrc: ["'self'", "blob:"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    ...(isProd && { upgradeInsecureRequests: [] }),
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
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=*, usb=(), accelerometer=(), gyroscope=()');
  next();
});

// 2. Strict CORS Configuration
const allowedOrigins = [
  'https://takeone-nexus.net.in',
  'https://www.takeone-nexus.net.in',
  'https://admin.takeone-nexus.net.in',    // Admin panel subdomain
  'https://scripts.takeone-nexus.net.in',  // Scripts moderation subdomain
  // Vercel preview deployments — explicitly whitelisted trusted deployments only
  'https://take-one-nexus.vercel.app',
  'https://admin-take-one.vercel.app',
];

// Allow custom origins from environment variable (comma-separated)
if (process.env.ALLOWED_ORIGINS) {
  const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
  allowedOrigins.push(...customOrigins);
}

if (!isProd) {
  allowedOrigins.push(
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  );
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin (no origin) or allowed origins
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      (!isProd && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')))
    ) {
      return callback(null, true);
    }

    // SECURITY: Reject all other origins - removed unsafe .vercel.app wildcard
    console.warn(`[SECURITY] CORS blocked unauthorized origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
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
app.use(express.json({
  limit: '10kb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
})); // Limit body size to 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

const { sanitizeMiddleware } = require('./utils/validation');
app.use(sanitizeMiddleware); // Prevent XSS globally

app.use('/uploads', express.static(path.join(__dirname, 'public', 'assets', 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// CSRF token route definition
app.use('/api', csrfRoutes);

// Global CSRF Protection — applies to all subsequent mutating routes (POST, PUT, DELETE, PATCH)
app.use(csrfProtection);

// 5. Routes
app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/moderation', moderationRoutes);
const paymentRateLimiter = createRateLimiter({
  limit: 30,
  windowMs: 15 * 60 * 1000,
  keyPrefix: 'payment'
});

app.use('/api/chat', chatRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/payments', paymentRateLimiter, paymentRoutes);
app.use('/api/community/create-order', paymentRateLimiter);
app.use('/api/community/verify-payment', paymentRateLimiter);
app.use('/api/community', communityRoutes);

// Explicitly reject manual group creation outside community scope
app.post('/api/groups/create', (req, res) => {
  res.status(403).json({
    success: false,
    message: "Group creation is available only inside Communities."
  });
});

// Alias routes — mirror endpoints the frontend expects
app.use('/api/projects', scriptRoutes); // /api/projects mirrors /api/scripts

// Top-level leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { pool } = require('./config/db');
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.name, u.screen_name, u.role, u.college, u.avatar_url,
        u.display_preference,
        COUNT(DISTINCT s.id) AS scripts_count,
        COUNT(DISTINCT r.id) AS collaborations_count,
        (COUNT(DISTINCT s.id) * 10 + COUNT(DISTINCT r.id) * 5) AS credit_score
      FROM users u
      LEFT JOIN scripts s ON s.user_id = u.id AND s.payment_verified = TRUE
      LEFT JOIN collaboration_requests r ON (r.requester_id = u.id OR r.owner_id = u.id) AND r.status = 'Accepted'
      GROUP BY u.id
      ORDER BY credit_score DESC
      LIMIT 20
    `);
    const data = rows.map(u => ({
      id: u.id,
      displayName: u.display_preference === 'screen_name' && u.screen_name
        ? u.screen_name : u.name,
      screen_name: u.screen_name,
      role: u.role,
      college: u.college,
      avatar_url: u.avatar_url,
      scripts_count: Number(u.scripts_count) || 0,
      collaborations_count: Number(u.collaborations_count) || 0,
      credit_score: Number(u.credit_score) || 0
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load leaderboard' });
  }
});

// Top-level creators endpoint — returns registered users with basic info
app.get('/api/creators', async (req, res) => {
  try {
    const { pool } = require('./config/db');
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.name, u.screen_name, u.role, u.college, u.avatar_url,
        u.display_preference, u.email_verified,
        COUNT(DISTINCT s.id) AS scripts_count
      FROM users u
      LEFT JOIN scripts s ON s.user_id = u.id AND s.payment_verified = TRUE
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 50
    `);
    const data = rows.map(u => ({
      id: u.id,
      displayName: u.display_preference === 'screen_name' && u.screen_name
        ? u.screen_name : u.name,
      screen_name: u.screen_name,
      role: u.role,
      college: u.college,
      avatar_url: u.avatar_url,
      is_verified: Boolean(u.email_verified),
      scripts_count: Number(u.scripts_count) || 0
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('Creators list error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load creators' });
  }
});

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
    const prisma = require('./utils/prisma');
    await prisma.$queryRaw`SELECT 1`;
    prismaStatus = 'connected';
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
    console.log('POST /api/scripts (payment verification required)');
    console.log('POST /api/requests');
    console.log('GET /api/requests/user/:id');
    console.log('POST /api/users/register');
    console.log('POST /api/users/login');
    console.log('POST /api/auth/forgot-password');
    console.log('POST /api/auth/reset-password');
    console.log('');
  });

  server.on('error', (error) => {
    console.error('Server failed to start:', error.message);
    process.exit(1);
  });
}

module.exports = app;

const { seedCreditTasks } = require('./utils/seedCreditTasks');
const { cleanupExpiredDrafts } = require('./utils/cleanupDrafts');
const { initializeModerationTable } = require('./utils/dbInit');

if (require.main === module || process.env.TAKE_ONE_DB_BOOT_CHECK === 'true') {
  connectDB()
    .then(() => {
      // Initialize database tables
      return initializeModerationTable();
    })
    .then(() => {
      // Seed default credit tasks
      return seedCreditTasks();
    })
    .then(() => cleanupExpiredDrafts(true))
    .catch((error) => {
      console.error('Database boot check failed:', error.message);
    });
}
