export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  currentCompany: string;
  currentSalary: string;
  noticePeriod: string;
  registeredAt: number;
  assignedPaperId?: string; // Link to the specific exam paper
}

export interface Question {
  id: string;
  section: string;
  title: string;
  text: string;
  idealAnswerKey: string;
  codeType?: 'javascript' | 'text';
  marks?: number; // Configurable marks per question
}

export interface QuestionPaper {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  duration: number; // Duration in minutes
  createdAt: number;
}

export interface ExamAssignment {
  id: string;
  email: string;
  paperId: string;
  assignedBy: string;
  assignedAt: number;
}

export interface Answer {
  questionId: string;
  answerText: string;
}

export interface ProctorLog {
  timestamp: number;
  type: 'TAB_SWITCH' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT' | 'CONTEXT_MENU' | 'LOST_FOCUS';
  details?: string;
}

export interface ExamSubmission {
  candidateId: string;
  paperId: string; // Track which paper was taken
  startTime: number;
  endTime?: number;
  answers: Record<string, string>;
  proctorLogs: ProctorLog[];
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  aiEvaluation?: EvaluationResult;
}

export interface QuestionEvaluation {
  score: number;
  feedback: string;
}

export interface EvaluationResult {
  totalScore: number;
  maxScore: number;
  summary: string;
  questionEvaluations: Record<string, QuestionEvaluation>;
  passFail: 'PASS' | 'FAIL';
}

export enum AppRoute {
  LOGIN = 'LOGIN',
  INSTRUCTIONS = 'INSTRUCTIONS',
  EXAM = 'EXAM',
  THANK_YOU = 'THANK_YOU',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_CANDIDATE_VIEW = 'ADMIN_CANDIDATE_VIEW',
}