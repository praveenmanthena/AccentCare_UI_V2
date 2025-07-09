import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import React, { useState } from "react";
import PenguinLogo from "../../../public/images/penguin-logo.svg";

import Penguin from "../../../public/images/Penguinai-name.png";
interface BrandedHeaderProps {
  selectedEpisodeDocId: string;
  onReturnToDashboard: () => void;
  onLogout: () => void;
}

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  selectedEpisodeDocId,
  onReturnToDashboard,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Logo, Company Name, and Episode ID */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={PenguinLogo} alt="PenguinAI Logo" className="w-8 h-8" />
            <img src={Penguin} alt="PenguinAI" className="h-6" />
          </div>

          {/* Episode Info - Moved next to logo */}
          <div className="bg-blue-100 px-3 py-1 rounded-lg">
            <div className="text-sm font-bold text-blue-800">
              Episode: {selectedEpisodeDocId}
            </div>
          </div>
        </div>

        {/* Right side - Dashboard Button and User Profile */}
        <div className="flex items-center gap-3">
          {/* Dashboard Button */}
          <button
            onClick={onReturnToDashboard}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          {/* User Profile with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                <span style={{ textTransform: "capitalize" }}>
                  {localStorage.getItem("username")?.split("@")[0]}
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {/* User Info Section */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div
                        className="text-sm text-gray-600"
                        style={{ textTransform: "capitalize" }}
                      >
                        {localStorage.getItem("username")}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Medical Coding Specialist
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors group"
                  >
                    <div className="w-8 h-8 bg-red-100 group-hover:bg-red-200 rounded-full flex items-center justify-center transition-colors">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 group-hover:text-red-800">
                        Sign Out
                      </div>
                      <div className="text-xs text-gray-500">
                        End current session
                      </div>
                    </div>
                  </button>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                  <div className="text-xs text-gray-500 text-center">
                    PenguinAI Medical Coding Platform v2.1
                  </div>
                </div>
              </div>
            )}

            {/* Overlay to close dropdown when clicking outside */}
            {showUserMenu && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
