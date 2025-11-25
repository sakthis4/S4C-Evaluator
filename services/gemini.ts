import { GoogleGenAI, Type } from "@google/genai";
import { Question, EvaluationResult, QuestionEvaluation } from '../types';
import { EXAM_CONTEXT } from '../constants';

// Safe access to API Key to prevent ReferenceError in browser environments
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || '';
    }
  } catch (e) {
    console.warn("process.env access failed safely");
  }
  return '';
};

export const evaluateExam = async (
  questions: Question[],
  answers: Record<string, string>
): Promise<EvaluationResult> => {
  
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error("No API KEY found");
    return createFallbackResult(questions, "AI Evaluation Failed: No API Key provided.");
  }

  // Initialize client inside the function to avoid module-level crashes
  const ai = new GoogleGenAI({ apiKey });

  const promptParts = [
    `You are a Senior Technical Interviewer evaluating a React Developer candidate.`,
    `The context of the application is: ${EXAM_CONTEXT}`,
    `Evaluate the answers based on technical accuracy, conceptual understanding, and problem-solving approach.`,
    `IMPORTANT INSTRUCTIONS FOR GRADING:`,
    `1. The 'Context/Ideal Key' provided is a GUIDELINE for expected concepts, NOT a strict answer key. Do not require exact text matches.`,
    `2. If the candidate provides a valid alternative solution or uses different wording that demonstrates correct understanding, award appropriate marks.`,
    `3. For coding questions (Javascript/React), focus on the logic, state management, and correct usage of hooks. Minor syntax errors should be penalized slightly, but not result in a zero score if the logic is sound.`,
    `4. For architectural/design questions, evaluate the feasibility and reasoning of their approach.`,
    `Return the output strictly in JSON format.`,
    `For each question, provide a score (0-10) and brief feedback (max 2 sentences).`,
    `Also provide a pass/fail status (Pass if total score > 60% of max).`,
    `Here are the Question/Answer pairs:`
  ];

  questions.forEach((q, index) => {
    const answer = answers[q.id] || "NO ANSWER PROVIDED";
    promptParts.push(
      `Q${index + 1} ID: ${q.id}`,
      `Question: ${q.text}`,
      `Context/Ideal Key: ${q.idealAnswerKey}`,
      `Candidate Answer: ${answer}`,
      `---`
    );
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [{ text: promptParts.join('\n') }]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            passFail: { type: Type.STRING, enum: ['PASS', 'FAIL'] },
            questionEvaluations: {
              type: Type.OBJECT,
              properties: questions.reduce((acc, q) => {
                acc[q.id] = {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                  },
                  required: ['score', 'feedback']
                };
                return acc;
              }, {} as Record<string, any>)
            }
          },
          required: ['summary', 'passFail', 'questionEvaluations']
        }
      }
    });

    let jsonText = response.text || '{}';
    // Robustly clean any markdown code blocks if the model includes them
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    const result = JSON.parse(jsonText);
    
    // Calculate total score manually to ensure accuracy
    let totalScore = 0;
    const evaluations: Record<string, QuestionEvaluation> = {};
    
    questions.forEach(q => {
      const qEval = result.questionEvaluations?.[q.id];
      const score = typeof qEval?.score === 'number' ? qEval.score : 0;
      totalScore += score;
      evaluations[q.id] = {
        score: score,
        feedback: qEval?.feedback || "Could not evaluate"
      };
    });

    return {
      totalScore,
      maxScore: questions.length * 10,
      summary: result.summary || "Evaluation completed.",
      passFail: (result.passFail === 'PASS' || result.passFail === 'FAIL') ? result.passFail : 'FAIL',
      questionEvaluations: evaluations
    };

  } catch (error) {
    console.error("AI Evaluation Error", error);
    return createFallbackResult(questions, "Error during AI evaluation process. See console for details.");
  }
};

const createFallbackResult = (questions: Question[], reason: string): EvaluationResult => {
  return {
    totalScore: 0,
    maxScore: questions.length * 10,
    summary: reason,
    questionEvaluations: questions.reduce((acc, q) => {
      acc[q.id] = { score: 0, feedback: "Evaluation failed" };
      return acc;
    }, {} as Record<string, QuestionEvaluation>),
    passFail: 'FAIL'
  };
};