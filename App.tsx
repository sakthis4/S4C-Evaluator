import React, { useState } from 'react';
import { AppRoute, Candidate } from './types';
import Layout from './components/Layout';
import Login from './pages/Login';
import Instructions from './pages/Instructions';
import Exam from './pages/Exam';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import ThankYou from './pages/ThankYou';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.LOGIN);
  const [currentUser, setCurrentUser] = useState<Candidate | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAdminClick = () => {
    setCurrentRoute(AppRoute.ADMIN_LOGIN);
  };

  const handleAdminAuth = (password: string) => {
    if (password === 'Qbend#123') {
      setIsAdmin(true);
      setCurrentRoute(AppRoute.ADMIN_DASHBOARD);
      return true;
    }
    return false;
  };

  const handleRegister = (candidate: Candidate) => {
    // Set user and move to Instructions page instead of Exam directly
    setCurrentUser(candidate);
    setCurrentRoute(AppRoute.INSTRUCTIONS);
  };

  const handleStartExam = () => {
    setCurrentRoute(AppRoute.EXAM);
  };

  const handleLogout = () => {
    setCurrentUser(undefined);
    setIsAdmin(false);
    setCurrentRoute(AppRoute.LOGIN);
  };

  const handleExamFinish = () => {
    // Assessment finished, go to thank you page
    setCurrentRoute(AppRoute.THANK_YOU);
  };

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.LOGIN:
        return <Login onRegister={handleRegister} onAdminClick={handleAdminClick} />;
      case AppRoute.ADMIN_LOGIN:
        return <AdminLogin onLogin={handleAdminAuth} onBack={() => setCurrentRoute(AppRoute.LOGIN)} />;
      case AppRoute.INSTRUCTIONS:
        return <Instructions onStart={handleStartExam} candidateName={currentUser?.fullName} />;
      case AppRoute.EXAM:
        if (!currentUser) return <Login onRegister={handleRegister} onAdminClick={handleAdminClick} />;
        return <Exam candidateId={currentUser.id} onFinish={handleExamFinish} />;
      case AppRoute.THANK_YOU:
        return <ThankYou onHome={handleLogout} />;
      case AppRoute.ADMIN_DASHBOARD:
        return isAdmin ? <Admin /> : <div className="p-8 text-center text-red-600">Access Denied</div>;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <Layout 
      user={currentUser ? { name: currentUser.fullName } : undefined} 
      onLogout={handleLogout}
      isAdmin={isAdmin}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;