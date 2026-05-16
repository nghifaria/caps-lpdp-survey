import { Routes, Route, Navigate } from 'react-router-dom';

// auth pages
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';

import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';

// admin pages
import CreateSurvey from './pages/admin/CreateSurvey';
import ReportsPage from './pages/admin/ReportsPage';
import SurveyListPage from './pages/admin/SurveyListPage';
import SurveyDetailPage from './pages/admin/SurveyDetailPage';
import RespondentsPage from './pages/admin/RespondentsPage';
import RespondentsDetailPage from './pages/admin/RespondentsDetailPage';

// respondent pages
import RespLayout from './components/layout/RespLayout';
import HomePage from './pages/respondent/HomePage';
import FaqPage from './pages/respondent/FaqPage';
import GuidelinePage from './pages/respondent/GuidelinePage';
import SurveyPage from './pages/respondent/SurveyPage';

function App() {
  return (
    <div className="min-h-screen w-full">
      <Routes>
        {/* public & auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* respondent routes */}
        <Route element={<RespLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/guideline" element={<GuidelinePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/survey/:id" element={<SurveyPage />} />          
        </Route>

        {/* admin routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/surveys" element={<SurveyListPage />} />
          <Route path="/admin/surveys/create" element={<CreateSurvey />} />
          <Route path="/admin/surveys/:id" element={<SurveyDetailPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/respondents" element={<RespondentsPage />} />
          <Route path="/admin/respondents/:id" element={<RespondentsDetailPage />} />
        </Route>

        {/* 404 Not Found - Redirect ke Home */}
        {/*
        <Route path="*" element={<Navigate to="/" replace />} />
        */}
      </Routes>
    </div>
  );
}

export default App;