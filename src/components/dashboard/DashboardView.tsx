import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  LogOut,
  RefreshCw,
  TrendingUp,
  User,
} from "lucide-react";
import React from "react";
import PenguinLogo from "../../../public/images/penguin-logo.svg";
import { useDashboardApi } from "../../hooks/useDashboardApi";

import Penguin from "../../../public/images/Penguinai-name.png";
interface DashboardViewProps {
  onStartCoding: (docId: string) => void;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartCoding,
  onLogout,
}) => {
  const {
    dashboardCases,
    summaryMetrics,
    nextPriorityEpisode,
    formatDate,
    loading,
    error,
    refreshData,
  } = useDashboardApi();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto font-sans">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-semibold text-gray-700">
              Loading dashboard data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto font-sans">
      {/* Dashboard Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Branding */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={PenguinLogo} alt="PenguinAI Logo" className="w-8 h-8" />
              <img src={Penguin} alt="PenguinAI" className="h-6" />
            </div>
          </div>

          {/* Right side - Actions and User Profile */}
          <div className="flex items-center gap-4">
            {error && (
              <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  API Error - Using fallback data
                </span>
                <button
                  onClick={refreshData}
                  className="ml-2 text-orange-700 hover:text-orange-800 font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Start Next Episode Button - Hidden */}
            {/* {nextPriorityEpisode && (
              <button
                onClick={() => onStartCoding(nextPriorityEpisode.doc_id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Start Next Episode (Priority)
              </button>
            )} */}

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            {/* User Profile Section */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  <span style={{ textTransform: "capitalize" }}>
                    {localStorage.getItem("username")?.split("@")[0]}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Medical Coder</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Dashboard Title and Description */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 font-medium">
            Review and validate coding results across all episodes
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-6">
            {/* Total Episodes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-1">
                {summaryMetrics.totalEpisodes}
              </div>
              <div className="text-sm font-semibold text-blue-700">
                Total Episodes
              </div>
            </div>

            {/* Completed */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-900 mb-1">
                {summaryMetrics.completed}
              </div>
              <div className="text-sm font-semibold text-green-700">
                Completed
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-900 mb-1">
                {summaryMetrics.inProgress}
              </div>
              <div className="text-sm font-semibold text-orange-700">
                In Progress
              </div>
            </div>

            {/* Avg Revenue - Hidden */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center hidden">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-1">
                {summaryMetrics.avgRevenue}
              </div>
              <div className="text-sm font-semibold text-purple-700">
                Avg Revenue
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mt-2">
          <div className="flex justify-end">
            {/* Right side: Status Legend */}
            <div className="flex items-center gap-4 ">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  AI recommendations
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Accepted
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Rejected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Newly Added
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Episodes Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Episodes</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Episode ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Coding Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden">
                      Revenue Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden">
                      Doc Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardCases.map((episode, index) => {
                    return (
                      <tr key={episode.doc_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div className="text-sm font-semibold text-gray-900">
                              {episode.episode_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(episode.created_date)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {episode.review_status === "COMPLETED" ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                                  COMPLETED
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 text-orange-600" />
                                <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800">
                                  IN PROGRESS
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            {/* Remaining Count */}
                            <div className="flex items-center gap-1 min-w-[30px]">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                              <span className="text-sm font-bold text-indigo-600">
                                {episode.remaining_count}
                              </span>
                            </div>

                            {/* Accepted Count */}
                            <div className="flex items-center gap-1 min-w-[30px]">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-bold text-green-600">
                                {episode.accept_count}
                              </span>
                            </div>

                            {/* Rejected Count */}
                            <div className="flex items-center gap-1 min-w-[30px]">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm font-bold text-red-600">
                                {episode?.reject_count}
                              </span>
                            </div>

                            {/* Newly Added Count */}
                            <div className="flex items-center gap-1 min-w-[30px]">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-sm font-bold text-purple-600">
                                {episode?.newly_added_count}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Hidden Revenue Rate Column */}
                        <td className="px-6 py-4 whitespace-nowrap hidden">
                          <div className="text-sm font-bold text-gray-900">
                            {episode.revenueRate}
                          </div>
                        </td>
                        {/* Hidden Doc Status Column */}
                        <td className="px-6 py-4 whitespace-nowrap hidden">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                              episode.docStatus === "Complete"
                                ? "bg-green-100 text-green-800"
                                : episode.docStatus === "Inconsistent"
                                ? "bg-red-100 text-red-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {episode.docStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => onStartCoding(episode.doc_id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View Results
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Rows per page:</span>
            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Showing 1-{dashboardCases.length} of {dashboardCases.length}{" "}
            episodes
          </div>
        </div>
      </div>
    </div>
  );
};
