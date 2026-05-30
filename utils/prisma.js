/**
 * utils/prisma.js
 *
 * Shared Prisma singleton for CommonJS Express context.
 * Mirrors the singleton pattern in src/lib/prisma.ts used by Next.js.
 *
 * Usage: const prisma = require('../utils/prisma');
 */

'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma =
  globalThis._prismaClient ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis._prismaClient = prisma;
}

module.exports = prisma;