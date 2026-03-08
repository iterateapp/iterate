// LiveKit room metadata (passed from API route to agent)
export interface AgentJobMetadata {
  interviewId: string;
  language: string;
  interviewerName: string;
  questions: InterviewQuestion[];
}

export interface InterviewQuestion {
  id: string;
  text: string;
}

// InterviewResponse.answers の各要素
export interface InterviewAnswer {
  questionId: string;
  question: string;
  answerSummary: string;
  fullTranscript: string; // "Agent: ...\nUser: ...\nAgent: ...\nUser: ..."
  followUpCount: number;
}
