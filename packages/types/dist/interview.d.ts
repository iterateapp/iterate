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
export interface InterviewAnswer {
    questionId: string;
    question: string;
    answerSummary: string;
    fullTranscript: string;
    followUpCount: number;
}
