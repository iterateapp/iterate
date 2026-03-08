// eslint-disable-next-line @typescript-eslint/no-require-imports
// Use require() for CJS-to-ESM static analysis compatibility.
// Node.js can detect `exports.PrismaClient = ...` as a named export when this
// CJS module is imported from an ESM consumer (apps/interview-agent), but cannot
// detect esbuild's re-export spread pattern from `export { X } from 'pkg'`.
const _client = require('.prisma/client') as typeof import('.prisma/client');

// Export PrismaClient as a value (the class itself) — type is inferred from the value.
export const PrismaClient = _client.PrismaClient;
// Re-export model types only (no PrismaClient here — that's exported as a value above).
export type { Interview, InterviewResponse, InterviewStatus, Prisma } from '.prisma/client';
