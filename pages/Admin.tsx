import React, { useState, useEffect } from 'react';
import { Candidate, ExamSubmission, EvaluationResult } from '../types';
import { db } from '../services/db';
import { evaluateExam } from '../services/gemini';
import { QUESTIONS } from '../constants';

const Admin: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  const fetchData = async () => {
    const c = await db.getAllCandidates();
    setCandidates(c);
    // Fetch all submissions manually (simulating a join query in a real DB)
    const subs: ExamSubmission[] = [];
    for (const cand of c) {
        const s = await db.getSubmission(cand.id);
        if (s) subs.push(s);
    }
    setSubmissions(subs);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEvaluate = async (submission: ExamSubmission) => {
    setEvaluatingId(submission.candidateId);
    try {
      const result = await evaluateExam(QUESTIONS, submission.answers);
      await db.saveEvaluation(submission.candidateId, result);
      await fetchData(); // Refresh data
    } catch (e) {
      console.error("Evaluation failed", e);
    } finally {
      setEvaluatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">In Progress</span>;
      case 'SUBMITTED': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Submitted</span>;
      case 'GRADED': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Graded</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Unknown</span>;
    }
  };

  // Detail View
  if (selectedCandidateId) {
    const candidate = candidates.find(c => c.id === selectedCandidateId);
    const submission = submissions.find(s => s.candidateId === selectedCandidateId);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCandidateId(null)} className="text-brand-600 hover:underline mb-4">&larr; Back to Dashboard</button>
        
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold">{candidate?.fullName}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                <div>Email: {candidate?.email}</div>
                <div>Company: {candidate?.currentCompany}</div>
                <div>Salary: {candidate?.currentSalary}</div>
                <div>Notice: {candidate?.noticePeriod}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 p-4 rounded border border-red-200">
                <h3 className="font-bold text-red-800 mb-2">Proctoring Logs ({submission?.proctorLogs.length || 0})</h3>
                <div className="h-40 overflow-y-auto text-xs space-y-1">
                    {submission?.proctorLogs.map((log, i) => (
                        <div key={i} className="text-red-700">
                            [{new Date(log.timestamp).toLocaleTimeString()}] {log.type} {log.details ? `- ${log.details}` : ''}
                        </div>
                    ))}
                    {(!submission?.proctorLogs || submission.proctorLogs.length === 0) && <span className="text-gray-500">No violations detected.</span>}
                </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded border border-green-200">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-green-800">AI Assessment</h3>
                    {submission?.aiEvaluation && (
                        <button 
                            onClick={() => submission && handleEvaluate(submission)}
                            disabled={!!evaluatingId}
                            className="text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 border border-green-300 px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                            {evaluatingId === selectedCandidateId ? 'Processing...' : 'Re-evaluate'}
                        </button>
                    )}
                </div>

                {submission?.aiEvaluation ? (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Score: {submission.aiEvaluation.totalScore} / {submission.aiEvaluation.maxScore}</span>
                            <span className={submission.aiEvaluation.passFail === 'PASS' ? 'text-green-600' : 'text-red-600'}>
                                {submission.aiEvaluation.passFail}
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 italic">{submission.aiEvaluation.summary}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-32">
                        <p className="text-gray-500 mb-2">Not graded yet</p>
                        <button 
                            onClick={() => submission && handleEvaluate(submission)}
                            disabled={!!evaluatingId}
                            className="bg-brand-600 text-white px-3 py-1 rounded text-sm disabled:bg-gray-400"
                        >
                            {evaluatingId === selectedCandidateId ? 'Grading...' : 'Run AI Grading'}
                        </button>
                    </div>
                )}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Detailed Answers</h3>
            <div className="space-y-6">
                {QUESTIONS.map(q => {
                    const ans = submission?.answers[q.id];
                    const evalData = submission?.aiEvaluation?.questionEvaluations[q.id];
                    return (
                        <div key={q.id} className="border p-4 rounded bg-gray-50">
                            <div className="flex justify-between mb-2">
                                <h4 className="font-bold text-gray-900">{q.title}</h4>
                                {evalData && (
                                    <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded font-mono">
                                        Score: {evalData.score}/10
                                    </span>
                                )}
                            </div>
                            <div className="mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Candidate Answer:</span>
                                <div className="text-sm text-gray-800 whitespace-pre-wrap mt-1 p-2 bg-white border rounded font-mono">
                                    {ans || <span className="text-gray-400 italic">No answer provided</span>}
                                </div>
                            </div>
                            {evalData && (
                                <div>
                                    <span className="text-xs font-semibold text-purple-600 uppercase">AI Feedback:</span>
                                    <p className="text-sm text-gray-600 mt-1">{evalData.feedback}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-bold">Candidate Submissions</h2>
        <button onClick={fetchData} className="text-sm text-brand-600 hover:text-brand-800">Refresh Data</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Violations</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidates.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No candidates found.</td></tr>
            )}
            {candidates.map(candidate => {
              const sub = submissions.find(s => s.candidateId === candidate.id);
              return (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{candidate.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.currentCompany}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(sub?.status || 'NOT_STARTED')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">
                    {sub?.proctorLogs.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sub?.aiEvaluation ? `${sub.aiEvaluation.totalScore} (${sub.aiEvaluation.passFail})` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                        onClick={() => setSelectedCandidateId(candidate.id)}
                        className="text-brand-600 hover:text-brand-900"
                    >
                        View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;