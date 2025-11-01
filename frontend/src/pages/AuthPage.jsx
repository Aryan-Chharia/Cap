import React, { useState } from "react";
import { IconUserPlus, IconMail, IconLock } from "../components/Icons.jsx";

export default function AuthPage({ role, onAuthSuccess }) {
  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    const mockUser = {
      email,
      name: authMode === "signup" ? name : "Demo User",
      role,
    };
    onAuthSuccess(mockUser);
  };

  const toggleMode = () => {
    setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md fade-in border border-gray-200">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 tracking-tight mb-2">
          {displayRole} {authMode === "login" ? "Login" : "Sign Up"}
        </h2>
        <p className="text-center text-gray-500 mb-8">
          {authMode === "login"
            ? `Welcome back! Please login to your ${role} account.`
            : `Create your new ${role} account.`}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {authMode === "signup" && (
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <IconUserPlus />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all box-border"
              />
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <IconMail />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all box-border"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <IconLock />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all box-border"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-transform duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            {authMode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <div className="flex justify-center items-center text-sm text-gray-600 mt-6">
          <span>
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>
          <button
            onClick={toggleMode}
            className="ml-2 px-2 py-1 text-indigo-600 font-semibold border border-indigo-200 rounded-md hover:text-indigo-700 hover:bg-indigo-50 transition-all"
          >
            {authMode === "login" ? "Sign Up" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
