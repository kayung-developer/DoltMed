import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './i18n';
import './index.css';

// --- Lazy Loading ALL Components for Performance ---

// Public Pages & Layout
const PublicLayout = lazy(() => import('./layouts/PublicLayout'));
const Homepage = lazy(() => import('./pages/public/Homepage'));
const AboutUsPage = lazy(() => import('./pages/public/AboutUsPage'));
const FeaturesPage = lazy(() => import('./pages/public/FeaturesPage'));
const PricingPage = lazy(() => import('./pages/public/PricingPage'));
const GlobalNetworkPage = lazy(() => import('./pages/public/GlobalNetworkPage'));
const BlogPage = lazy(() => import('./pages/public/BlogPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const CareersPage = lazy(() => import('./pages/public/CareersPage'));
const PressPage = lazy(() => import('./pages/public/PressPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/public/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/public/TermsOfServicePage'));
const PhysicianResourcesPage = lazy(() => import('./pages/public/PhysicianResourcesPage'));
const HipaaNoticePage = lazy(() => import('./pages/public/HipaaNoticePage'));


// Standalone Auth & System Pages
const SplashScreen = lazy(() => import('./pages/public/SplashScreen'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterSelection = lazy(() => import('./pages/auth/RegisterSelection'));
const PatientRegister = lazy(() => import('./pages/auth/PatientRegister'));
const PhysicianRegister = lazy(() => import('./pages/auth/PhysicianRegister'));
const PaymentStatusPage = lazy(() => import('./pages/shared/PaymentStatusPage'));
const SettingsPage = lazy(() => import('./pages/shared/SettingsPage'));
const ConsultationPage = lazy(() => import('./pages/shared/ConsultationPage'));
const ChatPage = lazy(() => import('./pages/shared/ChatPage'));
const DrugInteractionPage = lazy(() => import('./pages/shared/DrugInteractionPage'));
const MedicalTipsPage = lazy(() => import('./pages/shared/MedicalTipsPage'));
const SubscriptionPage = lazy(() => import('./pages/shared/SubscriptionPage'));
const MyVitalsPage = lazy(() => import('./pages/patient/MyVitalsPage'));


// Main Dashboard Layout
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));

// Patient Pages
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const MedicalRecords = lazy(() => import('./pages/patient/MedicalRecords'));
const MyAppointmentsPage = lazy(() => import('./pages/patient/MyAppointmentsPage'));
const PhysicianSearchPage = lazy(() => import('./pages/patient/PhysicianSearchPage'));
const HospitalDirectoryPage = lazy(() => import('./pages/patient/HospitalDirectoryPage'));
const MyWellnessPlanPage = lazy(() => import('./pages/patient/MyWellnessPlanPage'));
const FinancialsPage = lazy(() => import('./pages/patient/FinancialsPage'));


// Physician Pages
const PhysicianDashboard = lazy(() => import('./pages/physician/PhysicianDashboard'));
const ScheduleManagement = lazy(() => import('./pages/physician/ScheduleManagement'));
const MyPatientsPage = lazy(() => import('./pages/physician/MyPatientsPage'));
const PatientDetailPage = lazy(() => import('./pages/physician/PatientDetailPage'));
const AIDiagnosisPage = lazy(() => import('./pages/physician/AIDiagnosisPage'));
const CommunicationHubPage = lazy(() => import('./pages/physician/CommunicationHubPage'));
const ProfessionalDevelopmentPage = lazy(() => import('./pages/physician/ProfessionalDevelopmentPage'));

// Admin Pages
const AdminMasterDashboard = lazy(() => import('./pages/admin/AdminMasterDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const PhysicianVerification = lazy(() => import('./pages/admin/PhysicianVerification'));
const AuditTrailPage = lazy(() => import('./pages/admin/AuditTrailPage'));
const FeatureFlagsPage = lazy(() => import('./pages/admin/FeatureFlagsPage'));
const SubscriptionManagementPage = lazy(() => import('./pages/admin/SubscriptionManagementPage'));
const ContentManagementPage = lazy(() => import('./pages/admin/ContentManagementPage'));


// Loading Spinner Component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-dortmed-50 dark:bg-gray-900">
    <div className="w-16 h-16 border-4 border-dortmed-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{ duration: 4000, className: 'dark:bg-gray-800 dark:text-white' }} />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* --- Public Routes with Header/Footer --- */}
              <Route element={<PublicLayout />}>
                  <Route path="/" element={<Homepage />} />
                  <Route path="/about" element={<AboutUsPage />} />
                  <Route path="/features" element={<FeaturesPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/network" element={<GlobalNetworkPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/contact" element={<ContactPage />} />


                  <Route path="/careers" element={<CareersPage />} />
                   <Route path="/press" element={<PressPage />} />
                    {/* We can use the Physician and HIPAA pages as placeholders for now if you wish, or create full content like above */}
                     <Route path="/physician-resources" element={<PhysicianResourcesPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsOfServicePage />} />
                    <Route path="/hipaa" element={<HipaaNoticePage />} />
              </Route>

              {/* --- Standalone Routes without Main Layout --- */}
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterSelection />} />
              <Route path="/register/patient" element={<PatientRegister />} />
              <Route path="/register/physician" element={<PhysicianRegister />} />
              <Route path="/payment-status" element={<PaymentStatusPage />} />
              <Route path="/unauthorized" element={<div className="p-10 text-center text-2xl text-danger">Access Denied</div>} />

              {/* --- Shared Protected Routes --- */}
              <Route path="/subscriptions" element={<ProtectedRoute allowedRoles={['patient', 'physician']}><SubscriptionPage /></ProtectedRoute>} />
              <Route path="/consultation/:appointmentId" element={<ProtectedRoute allowedRoles={['patient', 'physician']}><ConsultationPage /></ProtectedRoute>} />
              <Route path="/chat/:conversationId" element={<ProtectedRoute allowedRoles={['patient', 'physician']}><ChatPage /></ProtectedRoute>} />

              {/* --- Patient Routes (Wrapped in DashboardLayout & ProtectedRoute) --- */}
              <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><DashboardLayout role="patient" /></ProtectedRoute>}>
                <Route index element={<PatientDashboard />} />
                <Route path="records" element={<MedicalRecords />} />
                <Route path="appointments" element={<MyAppointmentsPage />} />
                <Route path="find-doctor" element={<PhysicianSearchPage />} />
                <Route path="hospitals" element={<HospitalDirectoryPage />} />
                <Route path="wellness" element={<MyWellnessPlanPage />} />
                <Route path="financials" element={<FinancialsPage />} />
                <Route path="drug-interactions" element={<DrugInteractionPage />} />
                <Route path="medical-tips" element={<MedicalTipsPage />} />
                <Route path="vitals" element={<MyVitalsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* --- Physician Routes --- */}
              <Route path="/physician" element={<ProtectedRoute allowedRoles={['physician']}><DashboardLayout role="physician" /></ProtectedRoute>}>
                <Route index element={<PhysicianDashboard />} />
                <Route path="schedule" element={<ScheduleManagement />} />
                <Route path="patients" element={<MyPatientsPage />} />
                <Route path="patients/:patientId" element={<PatientDetailPage />} />
                <Route path="ai-diagnosis" element={<AIDiagnosisPage />} />
                <Route path="messages" element={<CommunicationHubPage />} />
                <Route path="development" element={<ProfessionalDevelopmentPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* --- Superuser Routes --- */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['superuser']}><DashboardLayout role="superuser" /></ProtectedRoute>}>
                <Route index element={<AdminMasterDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="verify" element={<PhysicianVerification />} />
                <Route path="audit-trail" element={<AuditTrailPage />} />
                <Route path="feature-flags" element={<FeatureFlagsPage />} />
                <Route path="subscriptions" element={<SubscriptionManagementPage />} />
                <Route path="cms" element={<ContentManagementPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* --- Catch-all redirects to homepage --- */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;