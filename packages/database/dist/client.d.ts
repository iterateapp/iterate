export type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'expired';
export interface InterviewSession {
    id: string;
    config_toml: string;
    results_toml: string | null;
    status: InterviewStatus;
    expires_at: string;
    created_at: string;
}
export declare function createDbClient(supabaseUrl: string, supabaseKey: string): {
    getSession(id: string): Promise<InterviewSession | null>;
    updateStatus(id: string, status: InterviewStatus): Promise<void>;
    saveResults(id: string, resultToml: string): Promise<void>;
};
export type DbClient = ReturnType<typeof createDbClient>;
