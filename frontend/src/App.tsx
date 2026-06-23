import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";

// Pages
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const DocumentView = lazy(() => import("./pages/DocumentView"));
const ExamTaking = lazy(() => import("./pages/ExamTaking"));
const ExamResult = lazy(() => import("./pages/ExamResult"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const CreateExam = lazy(() => import("./pages/CreateExam"));
const CreatePractice = lazy(() => import("./pages/CreatePractice"));
const PracticeTaking = lazy(() => import("./pages/PracticeTaking"));
const ResultsDashboard = lazy(() => import("./pages/ResultsDashboard"));

const PageFallback = () => (
  <div className="min-h-[45vh] flex flex-col items-center justify-center p-8">
    <div className="w-9 h-9 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
    <p className="text-muted text-sm font-medium">Đang tải giao diện...</p>
  </div>
);

// Route Guard for Authenticated Users
const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen app-bg flex flex-col items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted font-medium">Đang tải...</p>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Route Guard for Administrators Only
const AdminRoute = () => {
  const { user } = useAuth();
  return user && user.role === "ADMIN" ? <Outlet /> : <Navigate to="/" replace />;
};

// Layout Shell holding the Sticky Navbar
const LayoutShell = () => {
  return (
    <div className="min-h-screen app-bg text-main flex flex-col">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-12">
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Secure Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<LayoutShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/courses/:id" element={<CourseDetail />} />
                <Route path="/documents/:id" element={<DocumentView />} />
                <Route path="/exams/:id" element={<ExamTaking />} />
                <Route path="/practice/:id" element={<PracticeTaking />} />
                <Route path="/results/:id" element={<ExamResult />} />
                <Route path="/results/me" element={<ResultsDashboard />} />
                <Route path="/results" element={<ResultsDashboard />} />

                {/* Admin-Only Secure Routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/courses/:id/exams/create" element={<CreateExam />} />
                  <Route path="/exams/manage/:examId/edit" element={<CreateExam />} />
                  <Route path="/courses/:id/practice/create" element={<CreatePractice />} />
                  <Route path="/practice/create" element={<CreatePractice />} />
                  <Route path="/practice/manage/:practiceId/edit" element={<CreatePractice />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all Wildcard redirects to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
};

export default App;
