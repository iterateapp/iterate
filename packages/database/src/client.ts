import { createClient } from '@supabase/supabase-js';

export type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'expired';

export interface InterviewSession {
  id: string;
  config_toml: string;
  results_toml: string | null;
  status: InterviewStatus;
  expires_at: string;
  created_at: string;
}

// Supabase PostgREST "no rows" error code
const PGRST_NO_ROWS = 'PGRST116';

export function createDbClient(supabaseUrl: string, supabaseKey: string) {
  const client = createClient(supabaseUrl, supabaseKey);

  return {
    async getSession(id: string): Promise<InterviewSession | null> {
      const { data, error } = await client
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        if (error.code === PGRST_NO_ROWS) return null;
        throw new Error(`getSession failed: ${error.message}`);
      }
      return data as InterviewSession;
    },

    async updateStatus(id: string, status: InterviewStatus): Promise<void> {
      const { error } = await client
        .from('interview_sessions')
        .update({ status })
        .eq('id', id);
      if (error) throw new Error(`updateStatus failed: ${error.message}`);
    },

    async saveResults(id: string, resultToml: string): Promise<void> {
      const { error } = await client
        .from('interview_sessions')
        .update({ results_toml: resultToml, status: 'completed' satisfies InterviewStatus })
        .eq('id', id);
      if (error) throw new Error(`saveResults failed: ${error.message}`);
    },
  };
}

export type DbClient = ReturnType<typeof createDbClient>;
