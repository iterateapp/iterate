export { PrismaClient } from '@prisma/client';
// These types come from the generated Prisma client (packages/db/node_modules/.prisma/client)
// We re-export them from the local generated path to avoid resolution issues in the monorepo.
export type { Interview, InterviewResponse, InterviewStatus, Prisma } from '.prisma/client';
