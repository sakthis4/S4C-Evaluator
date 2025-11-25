import { Candidate, ExamSubmission, ProctorLog, EvaluationResult } from '../types';

const DB_KEYS = {
  CANDIDATES: 'pathfinder_candidates',
  SUBMISSIONS: 'pathfinder_submissions',
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class DatabaseService {
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

  async registerCandidate(candidate: Candidate): Promise<{ status: 'CREATED' | 'RESUMED' | 'REJECTED', candidate?: Candidate }> {
    await delay(300);
    const list = this.getList<Candidate>(DB_KEYS.CANDIDATES);
    const existing = list.find(c => c.email.toLowerCase() === candidate.email.toLowerCase());

    if (existing) {
      // Check submission status
      const submissions = this.getList<ExamSubmission>(DB_KEYS.SUBMISSIONS);
      const sub = submissions.find(s => s.candidateId === existing.id);
      
      // If submitted or graded, reject
      if (sub && (sub.status === 'SUBMITTED' || sub.status === 'GRADED')) {
        return { status: 'REJECTED' }; 
      }
      
      // Otherwise allow resume
      return { status: 'RESUMED', candidate: existing };
    }

    // New Candidate
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

  async initSubmission(candidateId: string): Promise<ExamSubmission> {
    const list = this.getList<ExamSubmission>(DB_KEYS.SUBMISSIONS);
    let submission = list.find(s => s.candidateId === candidateId);
    
    if (!submission) {
      submission = {
        candidateId,
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
    // Instant save, minimal delay
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
      // Ensure we don't revert a 'SUBMITTED' status if logic changes, 
      // but typically graded implies submitted.
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