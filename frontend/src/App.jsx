import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/Protectedroutes";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CheckEmailPage from "./components/CheckMail";
import verifySuccess from "./components/EmailSuccess";
import Dashboard from "./pages/Dashboard";
import InterviewQuestionCard from "./pages/InterviewSession";
import PracticeFeedback from "./pages/Feedback";
import FinalReport from "./pages/FinalReport";
import EmailReady from "./components/CheckMail";
import VerifyEmailPage from "./components/EmailSuccess";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import ActivityHistory from "./components/Activityhistory";
import AnalyticsPage from "./pages/AnalyticsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 🌍 Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/check-email" element={<EmailReady />} />
          {/* <Route path="/verify-email" element={<verifySuccess />} /> */}
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          {/* <Route path="/verify-email" element={<verifySuccess />} */}
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* 🔐 Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/interview" element={<InterviewQuestionCard />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/summary/:sessionId" element={<PracticeFeedback />} />
            <Route path="/report/:sessionId" element={<FinalReport />} />
            <Route path="/activity" element={<ActivityHistory />} />

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
