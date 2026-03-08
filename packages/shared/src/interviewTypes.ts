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
  const raw = parse(toml) as Record<string, unknown>;

  const interview = raw['interview'] as Record<string, unknown> | undefined;
  if (!interview || typeof interview['title'] !== 'string' || typeof interview['language'] !== 'string') {
    throw new Error('Invalid interview config: missing [interview] section with title and language');
  }

  const questions = raw['questions'];
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Invalid interview config: missing or empty [[questions]] array');
  }

  for (const q of questions) {
    const question = q as Record<string, unknown>;
    if (typeof question['id'] !== 'string' || typeof question['text'] !== 'string') {
      throw new Error('Invalid interview config: each question must have id and text fields');
    }
  }

  return raw as unknown as InterviewConfig;
}

export function stringifyInterviewResults(results: InterviewResults): string {
  return stringify(results as unknown as Record<string, unknown>);
}
