import { createClient } from '@supabase/supabase-js';
// Supabase PostgREST "no rows" error code
const PGRST_NO_ROWS = 'PGRST116';
export function createDbClient(supabaseUrl, supabaseKey) {
    const client = createClient(supabaseUrl, supabaseKey);
    return {
        async getSession(id) {
            const { data, error } = await client
                .from('interview_sessions')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                if (error.code === PGRST_NO_ROWS)
                    return null;
                throw new Error(`getSession failed: ${error.message}`);
            }
            return data;
        },
        async updateStatus(id, status) {
            const { error } = await client
                .from('interview_sessions')
                .update({ status })
                .eq('id', id);
            if (error)
                throw new Error(`updateStatus failed: ${error.message}`);
        },
        async saveResults(id, resultToml) {
            const { error } = await client
                .from('interview_sessions')
                .update({ results_toml: resultToml, status: 'completed' })
                .eq('id', id);
            if (error)
                throw new Error(`saveResults failed: ${error.message}`);
        },
    };
}
