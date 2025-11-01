import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader.jsx';

export default function OrganisationDashboard({ onLogout }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader onLogout={onLogout} />
      <main>
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {user?.organizationName || user?.name || user?.email}!
            </h1>
            <p className="text-lg text-gray-600">
              This is your <span className="font-semibold text-indigo-600">Organisation Dashboard</span>.
            </p>
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h3 className="font-semibold text-indigo-700">Company Details:</h3>
              <p className="text-gray-600">Admin Email: {user?.email}</p>
              <p className="text-gray-600">Role: {user?.role || 'organisation'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}