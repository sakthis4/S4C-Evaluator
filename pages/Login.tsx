import React, { useState } from 'react';
import { Candidate } from '../types';
import { db } from '../services/db';

interface LoginProps {
  onRegister: (candidate: Candidate) => void;
  onAdminClick: () => void;
}

const Login: React.FC<LoginProps> = ({ onRegister, onAdminClick }) => {
  // Pre-filled data for testing purposes
  const [formData, setFormData] = useState({
    fullName: 'Alex Tester',
    email: 'alex.tester@example.com',
    currentCompany: 'Tech Innovations Ltd',
    currentSalary: '5 LPA',
    noticePeriod: '15 Days'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const newCandidate: Candidate = {
      id: crypto.randomUUID(),
      registeredAt: Date.now(),
      ...formData
    };

    try {
      const result = await db.registerCandidate(newCandidate);
      
      if (result.status === 'CREATED' && result.candidate) {
        onRegister(result.candidate);
      } else if (result.status === 'RESUMED' && result.candidate) {
        // Optional: Replace alert with a toast or nicer UI if desired
        alert(`Welcome back, ${result.candidate.fullName}! Resuming your assessment.`);
        onRegister(result.candidate);
      } else if (result.status === 'REJECTED') {
        setError(result.error || 'Access denied.');
      }
    } catch (e) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-brand-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Candidate Registration</h2>
        <p className="text-brand-100 text-sm mt-1">Please enter your details to begin the assessment.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            required
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            required
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Company</label>
          <input
            required
            type="text"
            name="currentCompany"
            value={formData.currentCompany}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Tech Solutions Inc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Salary</label>
            <input
              required
              type="text"
              name="currentSalary"
              value={formData.currentSalary}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. 15 LPA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period</label>
            <input
              required
              type="text"
              name="noticePeriod"
              value={formData.noticePeriod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. 30 Days"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-600 text-white py-2 px-4 rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50"
          >
            {isLoading ? 'Checking Access...' : 'Start / Resume Assessment'}
          </button>
        </div>
      </form>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-center">
        <button 
          onClick={onAdminClick}
          className="text-xs text-gray-500 hover:text-brand-600 underline"
        >
          Administrator Access
        </button>
      </div>
    </div>
  );
};

export default Login;