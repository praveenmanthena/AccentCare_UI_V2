import React from "react";
import PenguinLogo from "../../../public/images/penguin-logo.svg";

import Penguin from "../../../public/images/Penguinai-name.png";
import { AuthCredentials } from "../../types";
interface LoginPageProps {
  credentials: AuthCredentials;
  setCredentials: (credentials: AuthCredentials) => void;
  onLogin: (username: string, password: string) => Promise<boolean>;
  isLoggingIn?: boolean;
  loginError?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  credentials,
  setCredentials,
  onLogin,
  isLoggingIn = false,
  loginError = null,
}) => {
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const success = await onLogin(credentials.username, credentials.password);
    if (success) {
      localStorage.setItem("username", credentials.username);
    }
    if (!success && !loginError) {
      // Only show generic error if no specific error is already shown
      console.error("Login failed without specific error message");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-30 h-16  rounded-full flex items-center justify-center mb-4">
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <img
                style={{ width: "25px", marginBottom: "5px" }}
                src={PenguinLogo}
              ></img>
              <img
                style={{
                  width: "150px",
                  height: "100%",
                  marginTop: "10px",
                  marginLeft: "10px",
                }}
                src={Penguin}
              ></img>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Medical Coding Platform
          </h1>
          {/* <p className="text-gray-600 mt-2 font-medium">AI-Powered Medical Coding Platform</p> */}
        </div>

        {/* Login Error Display */}
        {loginError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs">!</span>
              </div>
              <p className="text-sm text-red-800 font-medium">{loginError}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                placeholder="Enter your username"
                disabled={isLoggingIn}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                placeholder="Enter your password"
                disabled={isLoggingIn}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full py-2 px-4 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 ${
                isLoggingIn
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isLoggingIn && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isLoggingIn ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p className="font-medium">© 2025 Penguin AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
