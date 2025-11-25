import React, { useState, useEffect, useCallback } from 'react';
import { Question, ProctorLog, ExamSubmission } from '../types';
import { QUESTIONS, EXAM_CONTEXT } from '../constants';
import Proctoring from '../components/Proctoring';
import CodeRunner from '../components/CodeRunner';
import { db } from '../services/db';
import { evaluateExam } from '../services/gemini';

interface ExamProps {
  candidateId: string;
  onFinish: () => void;
}

// Helper to prevent infinite hanging
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timeout")), ms);
      promise.then(
          (res) => { clearTimeout(timer); resolve(res); },
          (err) => { clearTimeout(timer); reject(err); }
      );
  });
};

type SaveStatus = 'saved' | 'saving' | 'error';

const Exam: React.FC<ExamProps> = ({ candidateId, onFinish }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [proctorLogs, setProctorLogs] = useState<ProctorLog[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // Initialize DB entry and load saved data (Resume capability)
  useEffect(() => {
    const loadSession = async () => {
      const sub = await db.initSubmission(candidateId);
      if (sub) {
        if (sub.proctorLogs && sub.proctorLogs.length > 0) {
          setProctorLogs(sub.proctorLogs);
        }
        
        // If answers exist (Resume), load them. 
        // If new session (Empty), pre-fill with dummy data for testing convenience as requested.
        if (sub.answers && Object.keys(sub.answers).length > 0) {
           setAnswers(sub.answers);
        } else {
           // PRE-FILL ONLY FOR NEW SESSIONS (Testing Convenience)
           const initialAnswers: Record<string, string> = {};
           QUESTIONS.forEach(q => {
             initialAnswers[q.id] = q.idealAnswerKey;
           });
           setAnswers(initialAnswers);
        }
      }
    };
    loadSession();
  }, [candidateId]);

  // Periodic Auto-save with visual status
  useEffect(() => {
    // Debounce/interval save
    const interval = setInterval(async () => {
      // Only save if there's data to save
      if (Object.keys(answers).length === 0) return;

      setSaveStatus('saving');
      try {
        await db.saveDraft(candidateId, answers, proctorLogs);
        // Add a tiny artificial delay so the user sees the "Saving..." state momentarily
        await new Promise(resolve => setTimeout(resolve, 400));
        setLastSaved(Date.now());
        setSaveStatus('saved');
      } catch (e) {
        console.error("Auto-save failed", e);
        setSaveStatus('error');
      }
    }, 5000); // Save every 5 seconds
    return () => clearInterval(interval);
  }, [answers, proctorLogs, candidateId]);

  const handleProctorViolation = useCallback((log: ProctorLog) => {
    setProctorLogs(prev => [...prev, log]);
    // Optionally alert user
    if (log.type === 'TAB_SWITCH' || log.type === 'COPY_ATTEMPT') {
      console.warn(`Proctoring: ${log.type} detected.`);
    }
  }, []);

  const handleAnswerChange = (qId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [qId]: text }));
    // Immediately set to saving if desired, but interval handles it
  };

  const handleSubmit = async () => {
    // Removed blocking window.confirm to prevent environment cancellation errors
    setIsSubmitting(true);
    setSaveStatus('saving');
    
    try {
      // 1. Save final answers
      await db.saveDraft(candidateId, answers, proctorLogs);

      // 2. Mark as submitted (sets endTime)
      await db.submitExam(candidateId);

      // 3. Auto-grade with AI
      try {
        // Timeout after 60 seconds to prevent hanging
        const evaluation = await withTimeout(evaluateExam(QUESTIONS, answers), 60000);
        await db.saveEvaluation(candidateId, evaluation);
      } catch (aiError) {
        console.error("Auto-grading skipped due to error or timeout:", aiError);
        // Note: Admin can manually trigger grading later from the dashboard
      }
      
    } catch (error) {
      console.error("Error during submission process:", error);
    } finally {
      onFinish();
    }
  };

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-brand-600">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs font-medium">Saving...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Could not save</span>
          </div>
        );
      case 'saved':
      default:
        return (
          <div className="flex items-center gap-2 text-green-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs font-medium">All changes saved</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Proctoring isActive={!isSubmitting} onViolation={handleProctorViolation} />

      {/* Context Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm">
        <h3 className="text-blue-800 font-bold mb-2">Scenario Context: Pathfinder</h3>
        <p className="text-blue-900 text-sm whitespace-pre-line">{EXAM_CONTEXT}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-4 flex justify-between items-center sticky top-0 z-10 border-b">
        <div className="flex items-center gap-6">
            <span className="text-gray-600 font-medium">Progress: {Object.keys(answers).length} / {QUESTIONS.length} Answered</span>
            <div className="h-6 w-px bg-gray-300"></div>
            {renderSaveStatus()}
        </div>
        <div className="text-red-600 font-bold text-sm flex items-center gap-2">
            {proctorLogs.length > 0 && (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>Violations: {proctorLogs.length}</span>
              </>
            )}
        </div>
      </div>

      <div className="space-y-6">
        {QUESTIONS.map((q, index) => (
          <div key={q.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded mb-2">
                  {q.section}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{q.title}</h3>
              </div>
            </div>
            <p className="text-gray-700 mb-4">{q.text}</p>
            
            {q.codeType === 'javascript' ? (
               <CodeRunner 
                 code={answers[q.id] || ''} 
                 onChange={(val) => handleAnswerChange(q.id, val)}
                 language="javascript"
               />
            ) : (
              <textarea
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-sans text-base leading-relaxed text-gray-800 resize-y"
                placeholder="Type your answer here..."
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                spellCheck={false}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-6 pb-12">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          type="button"
          className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Grading Assessment...
            </>
          ) : 'Submit Assessment'}
        </button>
      </div>
    </div>
  );
};

export default Exam;