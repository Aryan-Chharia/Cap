import React, { useState } from 'react';
import RoleSelectionPage from './pages/RoleSelectionPage';
import AuthPage from './pages/AuthPage';
import UserDashboard from './pages/UserDashboard';
import OrganisationDashboard from './pages/OrganisationDashboard';

export default function App() {
  const [page, setPage] = useState('roleSelect');
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setPage('auth');
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    if (role === 'user') {
      setPage('userDashboard');
    } else if (role === 'organisation') {
      setPage('orgDashboard');
    }
  };

  const handleLogout = () => {
    setPage('roleSelect');
    setRole(null);
    setUser(null);
  };

  // This switch statement acts as our "Router"
  const renderPage = () => {
    switch (page) {
      case 'roleSelect':
        return <RoleSelectionPage onRoleSelect={handleRoleSelect} />;
      case 'auth':
        return <AuthPage role={role} onAuthSuccess={handleAuthSuccess} />;
      case 'userDashboard':
        return <UserDashboard user={user} onLogout={handleLogout} />;
      case 'orgDashboard':
        return <OrganisationDashboard user={user} onLogout={handleLogout} />;
      default:
        return <RoleSelectionPage onRoleSelect={handleRoleSelect} />;
    }
  };

  return (
    <div className="font-sans text-gray-800">
      {renderPage()}
    </div>
  );
}
