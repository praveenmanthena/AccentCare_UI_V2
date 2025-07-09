import { AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { LoginPage } from "./components/auth/LoginPage";
import { CodingInterface } from "./components/coding-interface/CodingInterface";
import { DashboardView } from "./components/dashboard/DashboardView";
import { useAuth } from "./hooks/useAuth";
import { useCodingResultsApi } from "./hooks/useCodingResultsApi";
import { useDocumentApi } from "./hooks/useDocumentApi";

const HomeHealthCodingInterface = () => {
  // Core state management hooks
  const auth = useAuth();

  // Local component state
  const [showDashboard, setShowDashboard] = useState(true); // Start with dashboard after login
  const [selectedEpisodeDocId, setSelectedEpisodeDocId] = useState<
    string | null
  >(null);

  // API hooks
  const {
    documents,
    documentContent,
    loading: documentsLoading,
    error: documentsError,
  } = useDocumentApi(selectedEpisodeDocId);
  const {
    primarySuggestions,
    secondarySuggestions,
    reviewStats,
    comments,
    loading: codingLoading,
    error: codingError,
  } = useCodingResultsApi(selectedEpisodeDocId);

  // Event handlers
  const startCoding = (docId: string) => {
    setSelectedEpisodeDocId(docId);
    setShowDashboard(false);
  };

  const returnToDashboard = () => {
    setShowDashboard(true);
    setSelectedEpisodeDocId(null);
  };

  const handleLogout = () => {
    // Properly logout: clear token, reset state, and redirect to login
    auth.logout(); // This clears the token and sets isLoggedIn to false
    setShowDashboard(true);
    setSelectedEpisodeDocId(null);
    window.location.reload();
  };

  // Render different views based on state
  if (!auth.isLoggedIn) {
    return (
      <LoginPage
        credentials={auth.credentials}
        setCredentials={auth.setCredentials}
        onLogin={auth.login}
        isLoggingIn={auth.isLoggingIn}
        loginError={auth.loginError}
      />
    );
  }

  if (showDashboard) {
    return (
      <DashboardView onStartCoding={startCoding} onLogout={handleLogout} />
    );
  }

  // Show loading state while documents or coding results are being fetched
  if (documentsLoading || codingLoading) {
    return (
      <div className="flex h-screen bg-gray-50 font-sans items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-semibold text-gray-700">
            {documentsLoading
              ? "Loading documents..."
              : "Loading coding results..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if documents or coding results failed to load
  if (documentsError || codingError) {
    return (
      <div className="flex h-screen bg-gray-50 font-sans items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Data
          </h2>
          <p className="text-gray-600 mb-4">{documentsError || codingError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={returnToDashboard}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main coding interface
  return (
    <CodingInterface
      selectedEpisodeDocId={selectedEpisodeDocId!}
      documents={documents}
      documentContent={documentContent}
      primarySuggestions={primarySuggestions}
      secondarySuggestions={secondarySuggestions}
      reviewStats={reviewStats}
      comments={comments}
      onReturnToDashboard={returnToDashboard}
      onLogout={handleLogout}
    />
  );
};

export default HomeHealthCodingInterface;
