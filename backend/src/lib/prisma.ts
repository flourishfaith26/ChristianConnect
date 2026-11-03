import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple Prisma instances in development hot-reload
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __isDbConnected: boolean | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export function isDbConnected(): boolean {
  return global.__isDbConnected ?? false;
}

export function setDbConnected(connected: boolean): void {
  global.__isDbConnected = connected;
}

