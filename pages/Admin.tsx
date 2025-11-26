import React, { useState, useEffect } from 'react';
import { Candidate, ExamSubmission, EvaluationResult, QuestionPaper, Question, ExamAssignment } from '../types';
import { db } from '../services/db';
import { evaluateExam } from '../services/gemini';

type AdminTab = 'SUBMISSIONS' | 'MANAGE_EXAMS' | 'ASSIGN_EXAMS';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('SUBMISSIONS');
  
  // Data State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [assignments, setAssignments] = useState<ExamAssignment[]>([]);
  
  // UI State
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  
  // Exam Paper Editor State
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperDesc, setPaperDesc] = useState('');
  const [paperDuration, setPaperDuration] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // New/Edit Question State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qTitle, setQTitle] = useState('');
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<'text' | 'javascript'>('text');
  const [qMarks, setQMarks] = useState('10');
  const [qKey, setQKey] = useState('');

  // Assign Form State
  const [assignEmail, setAssignEmail] = useState('');
  const [assignPaperId, setAssignPaperId] = useState('');
  const [assignStatus, setAssignStatus] = useState('');

  const fetchData = async () => {
    const c = await db.getAllCandidates();
    setCandidates(c);
    
    const p = await db.getAllPapers();
    setPapers(p);

    const a = await db.getAllAssignments();
    setAssignments(a);

    // Fetch all submissions manually
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

  const handleDeleteCandidate = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete user ${name}? This action cannot be undone.`)) {
        await db.deleteCandidate(id);
        await fetchData();
    }
  };

  const handleEvaluate = async (submission: ExamSubmission) => {
    setEvaluatingId(submission.candidateId);
    try {
      // Need to fetch the specific paper to know question details (marks, keys)
      const paper = await db.getPaper(submission.paperId);
      if (paper) {
        const result = await evaluateExam(paper.questions, submission.answers);
        await db.saveEvaluation(submission.candidateId, result);
        await fetchData();
      } else {
        alert("Original question paper for this submission not found.");
      }
    } catch (e) {
      console.error("Evaluation failed", e);
    } finally {
      setEvaluatingId(null);
    }
  };

  // --- Paper Editor Logic ---

  const initPaperEditor = (paper?: QuestionPaper) => {
    if (paper) {
        setEditingPaperId(paper.id);
        setPaperTitle(paper.title);
        setPaperDesc(paper.description);
        setPaperDuration(paper.duration || 60);
        setQuestions([...paper.questions]);
    } else {
        setEditingPaperId(null);
        setPaperTitle('');
        setPaperDesc('');
        setPaperDuration(60);
        setQuestions([]);
    }
    // Reset question form
    clearQuestionForm();
  };

  const clearQuestionForm = () => {
    setEditingQuestionId(null);
    setQTitle(''); setQText(''); setQKey(''); setQType('text'); setQMarks('10');
  };

  const loadQuestionForEdit = (q: Question) => {
    setEditingQuestionId(q.id);
    setQTitle(q.title);
    setQText(q.text);
    setQType(q.codeType || 'text');
    setQMarks(String(q.marks || 10));
    setQKey(q.idealAnswerKey);
  };

  const handleAddOrUpdateQuestion = () => {
    if (!qTitle || !qText) return;
    
    const newQ: Question = {
      id: editingQuestionId || `q-${Date.now()}`,
      section: 'Custom Section',
      title: qTitle,
      text: qText,
      codeType: qType,
      marks: parseInt(qMarks) || 10,
      idealAnswerKey: qKey
    };

    if (editingQuestionId) {
        // Update existing
        setQuestions(questions.map(q => q.id === editingQuestionId ? newQ : q));
    } else {
        // Add new
        setQuestions([...questions, newQ]);
    }
    clearQuestionForm();
  };

  const removeQuestion = (qId: string) => {
      setQuestions(questions.filter(q => q.id !== qId));
  };

  const handleSavePaper = async () => {
    if (!paperTitle || questions.length === 0) {
        alert("Please provide a title and at least one question.");
        return;
    }
    
    const paper: QuestionPaper = {
      id: editingPaperId || `paper-${Date.now()}`,
      title: paperTitle,
      description: paperDesc,
      questions: questions,
      duration: paperDuration,
      createdAt: editingPaperId ? (papers.find(p => p.id === editingPaperId)?.createdAt || Date.now()) : Date.now()
    };

    if (editingPaperId) {
        await db.updateQuestionPaper(paper);
    } else {
        await db.createQuestionPaper(paper);
    }
    
    alert("Exam Paper Saved!");
    initPaperEditor(undefined); // Reset
    fetchData();
  };

  const handleAssign = async () => {
    if (!assignEmail || !assignPaperId) return;
    await db.assignExam(assignEmail, assignPaperId);
    setAssignStatus(`Assigned to ${assignEmail}`);
    setAssignEmail('');
    fetchData();
    setTimeout(() => setAssignStatus(''), 3000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">In Progress</span>;
      case 'SUBMITTED': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Submitted</span>;
      case 'GRADED': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Graded</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Not Started</span>;
    }
  };

  // --- Subcomponents for Cleanliness ---

  const renderManageExams = () => (
    <div className="grid md:grid-cols-3 gap-6">
        {/* Left Col: List of Papers */}
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4 h-fit">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Exam Papers</h3>
                <button 
                    onClick={() => initPaperEditor()} 
                    className="text-xs bg-brand-600 text-white px-2 py-1 rounded hover:bg-brand-700"
                >
                    + New
                </button>
            </div>
            <ul className="space-y-2">
                {papers.map(p => (
                    <li key={p.id} className="bg-gray-50 p-3 rounded border hover:bg-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-medium text-sm">{p.title}</div>
                                <div className="text-xs text-gray-500">{p.questions.length} Qs • {p.duration || 60} mins</div>
                            </div>
                            <button 
                                onClick={() => initPaperEditor(p)} 
                                className="text-brand-600 hover:text-brand-800 text-xs font-medium"
                            >
                                Edit
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>

        {/* Right Col: Editor */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-6">
                {editingPaperId ? 'Edit Exam Paper' : 'Create New Exam Paper'}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                <label className="block text-sm font-medium mb-1">Paper Title</label>
                <input className="w-full border rounded p-2" value={paperTitle} onChange={e => setPaperTitle(e.target.value)} placeholder="e.g. React Senior Dev Assessment v2" />
                </div>
                <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input className="w-full border rounded p-2" value={paperDesc} onChange={e => setPaperDesc(e.target.value)} placeholder="Short description..." />
                </div>
                <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input type="number" className="w-full border rounded p-2" value={paperDuration} onChange={e => setPaperDuration(parseInt(e.target.value) || 60)} />
                </div>
            </div>

            <div className="border-t pt-6 bg-gray-50 -mx-6 px-6 pb-6">
                <h4 className="font-bold mb-4">{editingQuestionId ? 'Edit Question' : 'Add Question'}</h4>
                <div className="bg-white p-4 rounded border mb-4 space-y-4 shadow-sm">
                    <div>
                        <label className="block text-sm font-medium">Question Title</label>
                        <input className="w-full border rounded p-2" value={qTitle} onChange={e => setQTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Question Text</label>
                        <textarea className="w-full border rounded p-2" rows={2} value={qText} onChange={e => setQText(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Type</label>
                            <select className="w-full border rounded p-2" value={qType} onChange={(e: any) => setQType(e.target.value)}>
                                <option value="text">Text / Descriptive</option>
                                <option value="javascript">Code (JS/React)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Marks</label>
                            <input type="number" className="w-full border rounded p-2" value={qMarks} onChange={e => setQMarks(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Ideal Answer Key (Context for AI)</label>
                        <textarea className="w-full border rounded p-2" rows={2} value={qKey} onChange={e => setQKey(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAddOrUpdateQuestion} className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700">
                            {editingQuestionId ? 'Update Question' : 'Add Question'}
                        </button>
                        {editingQuestionId && (
                             <button onClick={clearQuestionForm} className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400">
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <h5 className="font-bold text-sm text-gray-700 mb-2">Questions in Paper ({questions.length}):</h5>
                    {questions.length === 0 && <p className="text-gray-500 text-xs italic">No questions added yet.</p>}
                    <ul className="space-y-2">
                        {questions.map((q, i) => (
                            <li key={i} className="bg-white p-2 rounded border flex justify-between items-center text-sm">
                                <span className="truncate flex-1 font-medium">{q.title} <span className="text-gray-500 font-normal">({q.marks} marks)</span></span>
                                <div className="flex gap-2 ml-2">
                                    <button onClick={() => loadQuestionForEdit(q)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button>
                                    <button onClick={() => removeQuestion(q.id)} className="text-red-600 hover:text-red-800 text-xs">Remove</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <button onClick={handleSavePaper} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-bold w-full">
                    {editingPaperId ? 'Save Changes' : 'Create Paper'}
                </button>
            </div>
        </div>
    </div>
  );

  const renderAssign = () => (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h3 className="text-xl font-bold mb-6">Assign Exam to Candidate</h3>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Candidate Email</label>
                <input 
                    type="email" 
                    className="w-full border rounded p-2" 
                    placeholder="candidate@example.com"
                    value={assignEmail}
                    onChange={e => setAssignEmail(e.target.value)} 
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Select Question Paper</label>
                <select 
                    className="w-full border rounded p-2"
                    value={assignPaperId}
                    onChange={e => setAssignPaperId(e.target.value)}
                >
                    <option value="">-- Select Exam --</option>
                    {papers.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </select>
            </div>
            <button onClick={handleAssign} className="bg-brand-600 text-white px-6 py-2 rounded hover:bg-brand-700 font-bold w-full">
                Assign Exam
            </button>
            {assignStatus && <p className="text-green-600 text-center font-medium mt-2">{assignStatus}</p>}
        </div>

        <div className="mt-10 border-t pt-6">
            <h4 className="font-bold mb-4">Current Assignments</h4>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="p-2">Email</th>
                            <th className="p-2">Paper ID</th>
                            <th className="p-2">Assigned At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map(a => (
                            <tr key={a.id} className="border-t">
                                <td className="p-2">{a.email}</td>
                                <td className="p-2">{a.paperId}</td>
                                <td className="p-2">{new Date(a.assignedAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  // Detail View (Submissions)
  if (selectedCandidateId && activeTab === 'SUBMISSIONS') {
    const candidate = candidates.find(c => c.id === selectedCandidateId);
    const submission = submissions.find(s => s.candidateId === selectedCandidateId);
    // Find paper info to verify questions title in detail view
    const paper = papers.find(p => p.id === submission?.paperId);
    // Fallback to paper questions or empty if not found
    const questionsToDisplay = paper?.questions || [];

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCandidateId(null)} className="text-brand-600 hover:underline mb-4">&larr; Back to Dashboard</button>
        
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold">{candidate?.fullName}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                <div>Email: {candidate?.email}</div>
                <div>Paper: {paper?.title || submission?.paperId || 'Unknown'}</div>
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
                {questionsToDisplay.length === 0 && <p className="text-gray-500">No question data available (Paper ID might be missing).</p>}
                {questionsToDisplay.map(q => {
                    const ans = submission?.answers[q.id];
                    const evalData = submission?.aiEvaluation?.questionEvaluations[q.id];
                    return (
                        <div key={q.id} className="border p-4 rounded bg-gray-50">
                            <div className="flex justify-between mb-2">
                                <h4 className="font-bold text-gray-900">{q.title} <span className="text-xs font-normal text-gray-500">({q.marks || 10} marks)</span></h4>
                                {evalData && (
                                    <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded font-mono">
                                        Score: {evalData.score}/{q.marks || 10}
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

  // List View (Submissions)
  const renderSubmissions = () => (
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidates.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No candidates found.</td></tr>
            )}
            {candidates.map(candidate => {
              const sub = submissions.find(s => s.candidateId === candidate.id);
              return (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{candidate.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{candidate.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(sub?.status || 'NOT_STARTED')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sub?.aiEvaluation ? `${sub.aiEvaluation.totalScore} / ${sub.aiEvaluation.maxScore}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                        onClick={() => setSelectedCandidateId(candidate.id)}
                        className="text-brand-600 hover:text-brand-900 mr-3"
                    >
                        View
                    </button>
                    <button 
                        onClick={() => handleDeleteCandidate(candidate.id, candidate.fullName)}
                        className="text-red-600 hover:text-red-900"
                    >
                        Delete
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

  return (
    <div>
        <div className="mb-6 flex gap-4 border-b">
            <button 
                className={`pb-2 px-4 font-medium ${activeTab === 'SUBMISSIONS' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('SUBMISSIONS')}
            >
                Submissions
            </button>
            <button 
                className={`pb-2 px-4 font-medium ${activeTab === 'MANAGE_EXAMS' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('MANAGE_EXAMS')}
            >
                Manage Exams
            </button>
            <button 
                className={`pb-2 px-4 font-medium ${activeTab === 'ASSIGN_EXAMS' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('ASSIGN_EXAMS')}
            >
                Assign Exams
            </button>
        </div>

        {activeTab === 'SUBMISSIONS' && renderSubmissions()}
        {activeTab === 'MANAGE_EXAMS' && renderManageExams()}
        {activeTab === 'ASSIGN_EXAMS' && renderAssign()}
    </div>
  );
};

export default Admin;