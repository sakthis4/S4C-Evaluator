import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  user?: { name: string };
  onLogout?: () => void;
  isAdmin?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, isAdmin }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      {/* Header */}
      <header className={`bg-white shadow-sm border-b ${isAdmin ? 'border-red-500' : 'border-brand-500'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className={`h-8 w-8 ${isAdmin ? 'text-red-600' : 'text-brand-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {isAdmin ? 'NINJA Admin' : 'NINJA Evaluation'}
            </h1>
          </div>
          {(user || isAdmin) && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {isAdmin ? 'Administrator' : `Candidate: ${user?.name}`}
              </span>
              <button
                onClick={onLogout}
                className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} S4Carlisle Publishing Services Pvt Ltd. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Pathfinder Production Tracking System Assessment
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;