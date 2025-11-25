export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  currentCompany: string;
  currentSalary: string;
  noticePeriod: string;
  registeredAt: number;
}

export interface Question {
  id: string;
  section: string;
  title: string;
  text: string;
  idealAnswerKey: string; // Used for AI grading context
  codeType?: 'javascript' | 'text'; // Added for code editor support
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
  startTime: number;
  endTime?: number;
  answers: Record<string, string>; // questionId -> text
  proctorLogs: ProctorLog[];
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  aiEvaluation?: EvaluationResult;
}

export interface QuestionEvaluation {
  score: number; // 0 to 10
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