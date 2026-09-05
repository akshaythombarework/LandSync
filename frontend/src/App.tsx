import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { CitizenOnboardingPage } from './pages/CitizenOnboardingPage';
import { CitizenRequestsPage } from './pages/CitizenRequestsPage';
import { CitizenMutationPage } from './pages/CitizenMutationPage';
import { CitizenAccountPage } from './pages/CitizenAccountPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { UploadPage } from './pages/UploadPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { VerificationQueuePage } from './pages/VerificationQueuePage';
import { HumanReviewPage } from './pages/HumanReviewPage';
import { RecordsPage } from './pages/RecordsPage';
import { RecordDetailPage } from './pages/RecordDetailPage';
import { GisMapPage } from './pages/GisMapPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Application Shell */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/citizen-dashboard" element={<CitizenDashboardPage />} />
            <Route path="/citizen/onboarding" element={<CitizenOnboardingPage />} />
            <Route path="/citizen/requests" element={<CitizenRequestsPage />} />
            <Route path="/citizen/mutations" element={<CitizenMutationPage />} />
            <Route path="/citizen/account" element={<CitizenAccountPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/upload" element={<UploadPage />} />
            <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
            <Route path="/documents/:documentId/processing" element={<ProcessingPage />} />
            <Route path="/verification" element={<VerificationQueuePage />} />
            <Route path="/verification/:recordId" element={<HumanReviewPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/records/:recordId" element={<RecordDetailPage />} />
            <Route path="/map" element={<GisMapPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
