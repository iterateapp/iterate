import { parse, stringify } from 'smol-toml';

// Input TOML (from Phase 1)
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

// Output TOML (Phase 2 → Phase 3)
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

// Parsers
export function parseInterviewConfig(toml: string): InterviewConfig {
  return parse(toml) as unknown as InterviewConfig;
}

export function stringifyInterviewResults(results: InterviewResults): string {
  return stringify(results as unknown as Record<string, unknown>);
}
