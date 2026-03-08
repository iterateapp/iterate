export interface InterviewQuestion {
    id: string;
    text: string;
}
export interface InterviewConfig {
    interview: {
        title: string;
        language: string;
        interviewer_name: string;
    };
    questions: InterviewQuestion[];
}
export interface InterviewAnswer {
    question_id: string;
    question: string;
    answer_summary: string;
    full_transcript: string;
}
export interface InterviewResults {
    session: {
        session_id: string;
        title: string;
        completed_at: string;
        duration_seconds: number;
    };
    answers: InterviewAnswer[];
}
export declare function parseInterviewConfig(toml: string): InterviewConfig;
export declare function stringifyInterviewResults(results: InterviewResults): string;
