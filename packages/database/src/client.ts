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

export function createDbClient(supabaseUrl: string, supabaseKey: string) {
  const client = createClient(supabaseUrl, supabaseKey);

  return {
    async getSession(id: string): Promise<InterviewSession | null> {
      const { data, error } = await client
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data as InterviewSession;
    },

    async updateStatus(id: string, status: InterviewStatus): Promise<void> {
      await client
        .from('interview_sessions')
        .update({ status })
        .eq('id', id);
    },

    async saveResults(id: string, resultToml: string): Promise<void> {
      await client
        .from('interview_sessions')
        .update({ results_toml: resultToml, status: 'completed' as InterviewStatus })
        .eq('id', id);
    },
  };
}

export type DbClient = ReturnType<typeof createDbClient>;
