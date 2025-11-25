import React from 'react';

interface InstructionsProps {
  onStart: () => void;
  candidateName?: string;
}

const Instructions: React.FC<InstructionsProps> = ({ onStart, candidateName }) => {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden mt-8">
      <div className="bg-brand-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Assessment Instructions</h2>
        <p className="text-brand-100 text-sm mt-1">Please read carefully before proceeding.</p>
      </div>

      <div className="p-8 space-y-6 text-gray-800">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
          <h3 className="font-bold text-blue-900 mb-2">Welcome{candidateName ? `, ${candidateName}` : ''}!</h3>
          <p className="text-sm text-blue-800">
            You are about to start the <strong>Pathfinder Production Tracking Assessment</strong>. 
            This evaluation tests your React.js knowledge, problem-solving skills, and architectural thinking related to modernizing a legacy application.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-3 border-b pb-2">Proctoring Rules</h3>
          <div className="bg-red-50 p-4 rounded border border-red-100">
            <p className="text-red-800 text-sm font-semibold mb-2">Strict compliance is required:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-red-700">
              <li><strong>Do not switch tabs</strong> or minimize the browser window. All tab switches are monitored and logged.</li>
              <li><strong>Copy/Paste</strong> operations are tracked.</li>
              <li><strong>Right-click context menu</strong> is disabled to ensure fairness.</li>
              <li>Ensure you have a stable internet connection.</li>
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-lg mb-3 border-b pb-2">Exam Format</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li><strong>Section A:</strong> Core React & JavaScript</li>
              <li><strong>Section B:</strong> Advanced State Management</li>
              <li><strong>Section C:</strong> Frontend Architecture</li>
              <li><strong>Section D:</strong> UX & Performance</li>
              <li><strong>Section E:</strong> Collaboration & Agile</li>
            </ul>
          </div>
          <div>
             <h3 className="font-bold text-lg mb-3 border-b pb-2">Tools & Environment</h3>
             <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
               <li><strong>Code Editor:</strong> A built-in code runner is available for JavaScript programming questions.</li>
               <li><strong>Auto-Save:</strong> Your answers are saved automatically every few seconds.</li>
               <li><strong>Console Output:</strong> You can execute your code and view console logs directly in the editor.</li>
             </ul>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end">
          <button
            onClick={onStart}
            className="bg-brand-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-brand-700 transition-colors shadow-lg flex items-center gap-2 transform active:scale-95"
          >
            I Understand, Start Exam &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default Instructions;