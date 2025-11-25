import React from 'react';

interface ThankYouProps {
  onHome: () => void;
}

const ThankYou: React.FC<ThankYouProps> = ({ onHome }) => {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center mt-10">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Assessment Submitted!</h2>
      <p className="text-gray-600 text-lg mb-8">
        Thank you for completing the Pathfinder Production Tracking Assessment. 
        Your responses have been recorded and sent for AI evaluation.
      </p>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-8 text-left">
        <h3 className="font-bold text-gray-800 mb-2">What happens next?</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Your test results will be reviewed by our technical team.</li>
          <li>We have recorded any proctoring violations (e.g. tab switching).</li>
          <li>You will be contacted via email regarding the next steps in the hiring process.</li>
        </ul>
      </div>

      <button
        onClick={onHome}
        className="bg-brand-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors"
      >
        Return to Home
      </button>
    </div>
  );
};

export default ThankYou;