import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { env } from './env.js';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', service: 'interview-agent' }));

serve({ fetch: app.fetch, port: env.PORT }, () => {
  console.log(`Interview agent HTTP server listening on port ${env.PORT}`);
  console.log('Start the LiveKit agent worker with: pnpm dev:agent');
});
