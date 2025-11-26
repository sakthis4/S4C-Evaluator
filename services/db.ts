import { Candidate, ExamSubmission, ProctorLog, EvaluationResult, QuestionPaper, ExamAssignment, Question } from '../types';
import { QUESTIONS } from '../constants';

const DB_KEYS = {
  CANDIDATES: 'pathfinder_candidates',
  SUBMISSIONS: 'pathfinder_submissions',
  PAPERS: 'pathfinder_papers',
  ASSIGNMENTS: 'pathfinder_assignments'
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class DatabaseService {
  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // Ensure the default exam exists
    if (typeof localStorage !== 'undefined') {
      const papers = this.getList<QuestionPaper>(DB_KEYS.PAPERS);
      if (papers.length === 0) {
        const defaultPaper: QuestionPaper = {
          id: 'default-pathfinder-v1',
          title: 'Default: Pathfinder Production Tracking',
          description: 'Standard assessment for React Developer role involving the Pathfinder legacy modernization scenario.',
          questions: QUESTIONS.map(q => ({ ...q, marks: 10 })), // Default 10 marks
          duration: 60, // Default 60 minutes
          createdAt: Date.now()
        };
        this.saveList(DB_KEYS.PAPERS, [defaultPaper]);

        // Seed default assignment for the tester
        const assignments = this.getList<ExamAssignment>(DB_KEYS.ASSIGNMENTS);
        if (assignments.length === 0) {
          assignments.push({
            id: 'assign-default-1',
            email: 'alex.tester@example.com',
            paperId: 'default-pathfinder-v1',
            assignedBy: 'System',
            assignedAt: Date.now()
          });
          this.saveList(DB_KEYS.ASSIGNMENTS, assignments);
        }
      }
    }
  }

  private getList<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("DB Read Error", e);
      return [];
    }
  }

  private saveList<T>(key: string, list: T[]) {
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.error("DB Write Error", e);
    }
  }

  // --- Assignments ---

  async assignExam(email: string, paperId: string): Promise<void> {
    await delay(200);
    const list = this.getList<ExamAssignment>(DB_KEYS.ASSIGNMENTS);
    // Remove existing assignment for this email if any
    const filtered = list.filter(a => a.email.toLowerCase() !== email.toLowerCase());
    filtered.push({
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      paperId,
      assignedBy: 'Admin',
      assignedAt: Date.now()
    });
    this.saveList(DB_KEYS.ASSIGNMENTS, filtered);
  }

  async getAssignment(email: string): Promise<ExamAssignment | undefined> {
    await delay(100);
    const list = this.getList<ExamAssignment>(DB_KEYS.ASSIGNMENTS);
    return list.find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  async getAllAssignments(): Promise<ExamAssignment[]> {
    return this.getList<ExamAssignment>(DB_KEYS.ASSIGNMENTS);
  }

  // --- Papers ---

  async createQuestionPaper(paper: QuestionPaper): Promise<void> {
    await delay(200);
    const list = this.getList<QuestionPaper>(DB_KEYS.PAPERS);
    list.push(paper);
    this.saveList(DB_KEYS.PAPERS, list);
  }

  async updateQuestionPaper(paper: QuestionPaper): Promise<void> {
    await delay(200);
    const list = this.getList<QuestionPaper>(DB_KEYS.PAPERS);
    const index = list.findIndex(p => p.id === paper.id);
    if (index !== -1) {
        list[index] = paper;
        this.saveList(DB_KEYS.PAPERS, list);
    }
  }

  async getAllPapers(): Promise<QuestionPaper[]> {
    await delay(100);
    return this.getList<QuestionPaper>(DB_KEYS.PAPERS);
  }

  async getPaper(id: string): Promise<QuestionPaper | undefined> {
    const list = this.getList<QuestionPaper>(DB_KEYS.PAPERS);
    return list.find(p => p.id === id);
  }

  // --- Candidates ---

  async registerCandidate(candidate: Candidate): Promise<{ status: 'CREATED' | 'RESUMED' | 'REJECTED', candidate?: Candidate, error?: string }> {
    await delay(300);
    
    // 1. Check Assignment
    const assignment = await this.getAssignment(candidate.email);
    if (!assignment) {
        return { status: 'REJECTED', error: 'No exam has been assigned to this email address.' };
    }

    // Attach assigned paper ID
    candidate.assignedPaperId = assignment.paperId;

    const list = this.getList<Candidate>(DB_KEYS.CANDIDATES);
    const submissions = this.getList<ExamSubmission>(DB_KEYS.SUBMISSIONS);
    
    // Find all records for this email
    const userCandidates = list.filter(c => c.email.toLowerCase() === candidate.email.toLowerCase());

    // 2. Check for ANY active session to resume (Status IN_PROGRESS or No Submission record yet)
    // We prioritize resuming an active session over creating a new one, even for the tester.
    const activeCandidate = userCandidates.find(c => {
        const sub = submissions.find(s => s.candidateId === c.id);
        // If no submission record exists, they registered but didn't init exam => effectively in progress
        // If submission exists, check status
        return !sub || sub.status === 'IN_PROGRESS';
    });

    if (activeCandidate) {
        // Resume logic
        activeCandidate.currentCompany = candidate.currentCompany;
        activeCandidate.currentSalary = candidate.currentSalary;
        activeCandidate.noticePeriod = candidate.noticePeriod;
        activeCandidate.assignedPaperId = assignment.paperId; // Sync assignment if changed
        this.saveList(DB_KEYS.CANDIDATES, list);
        return { status: 'RESUMED', candidate: activeCandidate };
    }

    // 3. No active session found. Check if they have completed it before.
    const hasPastSubmission = userCandidates.some(c => {
         const sub = submissions.find(s => s.candidateId === c.id);
         return sub && (sub.status === 'SUBMITTED' || sub.status === 'GRADED');
    });

    if (hasPastSubmission) {
        // If it is the default tester, allow them to create a NEW candidate record (Retake)
        if (candidate.email.toLowerCase() !== 'alex.tester@example.com') {
             return { status: 'REJECTED', error: 'Assessment already submitted.' }; 
        }
        // If Alex Tester, we deliberately fall through to create a new record
    }

    // 4. New Candidate
    list.push(candidate);
    this.saveList(DB_KEYS.CANDIDATES, list);
    return { status: 'CREATED', candidate };
  }

  async getCandidate(id: string): Promise<Candidate | undefined> {
    await delay(100);
    const list = this.getList<Candidate>(DB_KEYS.CANDIDATES);
    return list.find(c => c.id === id);
  }

  async getAllCandidates(): Promise<Candidate[]> {
    await delay(200);
    return this.getList<Candidate>(DB_KEYS.CANDIDATES);
  }

  async deleteCandidate(id: string): Promise<void> {
    await delay(200);
    
    // Remove Candidate
    let candidates = this.getList<Candidate>(DB_KEYS.CANDIDATES);
    const candidateToDelete = candidates.find(c => c.id === id);
    candidates = candidates.filter(c => c.id !== id);
    this.saveList(DB_KEYS.CANDIDATES, candidates);

    // Remove Submission
    let submissions = this.getList<ExamSubmission>(DB_KEYS.SUBMISSIONS);
    submissions = submissions.filter(s => s.candidateId !== id);
    this.saveList(DB_KEYS.SUBMISSIONS, submissions);

    // Remove Assignment (optional: only if we want to completely wipe them, but usually assignment is by email)
    // If we delete the assignment, they can't log in again. 
    // Let's keep assignment so they can potentially be re-added, OR remove it. 
    // Generally "Delete User" in this context implies wiping the slate clean.
    if (candidateToDelete) {
        let assignments = this.getList<ExamAssignment>(DB_KEYS.ASSIGNMENTS);
        // Note: Assignment is by email, not candidate ID. 
        // We will remove assignment for that email to ensure full clean slate.
        assignments = assignments.filter(a => a.email.toLowerCase() !== candidateToDelete.email.toLowerCase());
        this.saveList(DB_KEYS.ASSIGNMENTS, assignments);
    }
  }

  // --- Submissions ---

  async initSubmission(candidateId: string, paperId: string): Promise<ExamSubmission> {
    const list = this.getList<ExamSubmission>(DB_KEYS.SUBMISSIONS);
    let submission = list.find(s => s.candidateId === candidateId);
    
    if (!submission) {
      submission = {
        candidateId,
        paperId,
        startTime: Date.now(),
        answers: {},
        proctorLogs: [],
        status: 'IN_PROGRESS'
      };
      list.push(submission);
      this.saveList(DB_KEYS.SUBMISSIONS, list);
    }
    return submission;
  }

  async saveDraft(candidateId: string, answers: Record<string, string>, logs: ProctorLog[]): Promise<void> {
    const list = this.getList<ExamSubmission>(DB_KEYS.SUBMISSIONS);
    const idx = list.findIndex(s => s.candidateId === candidateId);
    if (idx !== -1) {
      list[idx].answers = answers;
      list[idx].proctorLogs = logs; 
      this.saveList(DB_KEYS.SUBMISSIONS, list);
    }
  }

  async submitExam(candidateId: string): Promise<void> {
    await delay(500);
    const list = this.getList<ExamSubmission>(DB_KEYS.SUBMISSIONS);
    const idx = list.findIndex(s => s.candidateId === candidateId);
    if (idx !== -1) {
      list[idx].status = 'SUBMITTED';
      list[idx].endTime = Date.now();
      this.saveList(DB_KEYS.SUBMISSIONS, list);
    }
  }

  async saveEvaluation(candidateId: string, result: EvaluationResult): Promise<void> {
    const list = this.getList<ExamSubmission>(DB_KEYS.SUBMISSIONS);
    const idx = list.findIndex(s => s.candidateId === candidateId);
    if (idx !== -1) {
      list[idx].aiEvaluation = result;
      list[idx].status = 'GRADED';
      this.saveList(DB_KEYS.SUBMISSIONS, list);
    }
  }

  async getSubmission(candidateId: string): Promise<ExamSubmission | undefined> {
    await delay(200);
    const list = this.getList<ExamSubmission>(DB_KEYS.SUBMISSIONS);
    return list.find(s => s.candidateId === candidateId);
  }
}

export const db = new DatabaseService();