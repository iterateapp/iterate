// Pre-compiled ESM entrypoint for @iterate/db.
// This bridges the CJS Prisma generated client to ESM consumers (apps/interview-agent).
// By using createRequire + explicit named export, Node.js can statically link the
// named export at module instantiation time — something tsx-compiled re-exports cannot do.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Load the CJS Prisma generated client
const _client = require('.prisma/client');

export const PrismaClient = _client.PrismaClient;
