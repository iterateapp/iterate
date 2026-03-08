/**
 * LiveKit Agent Entry Point
 *
 * Defines the prewarm and entry functions for the LiveKit Agents SDK.
 * The entry function delegates to the interview runner which orchestrates
 * the full voice-based interview session.
 *
 * Usage:
 *   tsx src/agent.ts dev     # Development mode
 *   node dist/agent.js dev   # Production mode
 */

import { fileURLToPath } from 'node:url';
import { cli, defineAgent, type JobContext, type JobProcess, ServerOptions } from '@livekit/agents';
import { VAD } from '@livekit/agents-plugin-silero';
import { runInterview } from './application/interviewRunner.js';

/**
 * LiveKit Agent definition
 */
export default defineAgent({
  prewarm: async (_proc: JobProcess) => {
    console.log('[Agent] Prewarm: loading Silero VAD model...');
    await VAD.load();
    console.log('[Agent] Prewarm complete.');
  },

  entry: async (jobCtx: JobContext) => {
    try {
      console.log(`[Agent] Job received: ${jobCtx.job?.id ?? 'unknown'}`);
      await runInterview(jobCtx);
    } catch (error) {
      console.error('[Agent] Entry error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },
});

/**
 * CLI entry point — runs when this file is executed directly.
 */
const agentPath = fileURLToPath(import.meta.url);

cli.runApp(
  new ServerOptions({
    agent: agentPath,
  }),
);
