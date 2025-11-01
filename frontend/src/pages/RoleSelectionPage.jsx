import React from 'react';
import { IconUser, IconBuilding } from '../components/Icons.jsx';

export default function RoleSelectionPage({ onRoleSelect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-10">
        Welcome!
      </h1>
      <h2 className="text-xl text-gray-600 mb-12">
        Please select your role to continue
      </h2>
      <div className="flex flex-col md:flex-row gap-8">
        {/* User Card */}
        <button
          onClick={() => onRoleSelect('user')}
          className="bg-white p-10 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 w-72 text-center group"
        >
          <div className="flex justify-center mb-4 text-blue-500 group-hover:text-blue-600">
            <IconUser />
          </div>
          <h3 className="text-2xl font-semibold text-gray-700">
            I am a User
          </h3>
          <p className="text-gray-500 mt-2">
            Access your personal dashboard.
          </p>
        </button>

        {/* Organisation Card */}
        <button
          onClick={() => onRoleSelect('organisation')}
          className="bg-white p-10 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 w-72 text-center group"
        >
          <div className="flex justify-center mb-4 text-indigo-500 group-hover:text-indigo-600">
            <IconBuilding />
          </div>
          <h3 className="text-2xl font-semibold text-gray-700">
            I am an Organisation
          </h3>
          <p className="text-gray-500 mt-2">
            Manage your company profile.
          </p>
        </button>
      </div>
    </div>
  );
}