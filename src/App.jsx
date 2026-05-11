import { Routes, Route, Navigate } from 'react-router-dom';

// auth pages
{/* import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
*/}

{/*
// admin pages
import DashboardPage from './pages/admin/DashboardPage';
import CreateSurvey from './pages/admin/CreateSurvey';
import ReportsPage from './pages/admin/ReportsPage';
import SurveyListPage from './pages/admin/SurveyListPage';
import SurveyDetailPage from './pages/admin/SurveyDetailPage';
import RespondentsPage from './pages/admin/RespondentsPage';
import RespondentsDetailPage from './pages/admin/RespondentsDetailPage';
*/}

import HomePage from './pages/respondent/HomePage';
import RespLayout from './components/layout/RespLayout';

{/*}
// respondent pages
import HomePage from './pages/respondent/HomePage';
import SurveyPage from './pages/respondent/SurveyPage';
import GuidelinePage from './pages/respondent/GuidelinePage';
import FaqPage from './pages/respondent/FaqPage';
*/}

function App() {
  return (
    <div className="min-h-screen w-full">
      <Routes>
        {/* public & auth routes */}
        {/*
        <Route path="/auth">
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignUpPage />} />
        </Route>
        */}

        {/* respondent routes */}
        <Route element={<RespLayout />}>
          <Route path="/" element={<HomePage />} />
          {/*
          <Route path="/survey/:id" element={<SurveyPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/guideline" element={<GuidelinePage />} />
          */}
        </Route>

        {/* admin routes */}
        {/*
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="surveys" element={<SurveyListPage />} />
          <Route path="surveys/create" element={<CreateSurvey />} />
          <Route path="surveys/:id" element={<SurveyDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="respondents" element={<RespondentsPage />} />
          <Route path="respondents/:id" element={<RespondentsDetailPage />} />
        </Route>
        */}

        {/* 404 Not Found - Redirect ke Home */}
        {/*
        <Route path="*" element={<Navigate to="/" replace />} />
        */}
      </Routes>
    </div>
  );
}

export default App;