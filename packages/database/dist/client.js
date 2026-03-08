import { createClient } from '@supabase/supabase-js';
export function createDbClient(supabaseUrl, supabaseKey) {
    const client = createClient(supabaseUrl, supabaseKey);
    return {
        async getSession(id) {
            const { data, error } = await client
                .from('interview_sessions')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                return null;
            return data;
        },
        async updateStatus(id, status) {
            await client
                .from('interview_sessions')
                .update({ status })
                .eq('id', id);
        },
        async saveResults(id, resultToml) {
            await client
                .from('interview_sessions')
                .update({ results_toml: resultToml, status: 'completed' })
                .eq('id', id);
        },
    };
}
