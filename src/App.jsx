// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import LearnForex from './pages/LearnForex';
import Calculator from './components/Calculator';
import Footer from './components/Footer';
import CfxFlip from './components/CfxFlip';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import ResetPassword from './pages/ResetPassword';

// Admin Dashboard Imports
import AdminLogin from './components/admin/AdminLogin';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';

// Account creation and email verification imports
import VerifyEmail from './pages/VerifyEmail';

// User Dashboard imports
import DashboardLayout from './components/dashboard/DashboardLayout';
import Journal from './pages/dashboard/Journal';
import Playbooks from './pages/dashboard/Playbooks';
import CfxBot from './pages/dashboard/CfxBot';
import Settings from './pages/dashboard/Settings';
import Profile from './pages/dashboard/Profile';
import StreakSimulator from '@/pages/dashboard/StreakSimulator';

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public pages (with Navbar + Footer) ── */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Landing />
              <Footer />
            </>
          }
        />
        <Route
          path="/LearnForex"
          element={
            <>
              <Navbar />
              <LearnForex />
              <Footer />
            </>
          }
        />
        <Route
          path="/calculator"
          element={
            <>
              <Navbar />
              <Calculator />
              <Footer />
            </>
          }
        />
        <Route
          path="/playbooks"
          element={
            <>
              <Navbar />
              <div className="page-coming-soon">
                <h2>Playbooks (Coming Soon)</h2>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/cfx-flip"
          element={
            <>
              <Navbar />
              <CfxFlip />
              <Footer />
            </>
          }
        />

        {/* ── User auth (no Navbar/Footer) ── */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        {/* ── User dashboard (protected by user auth) ── */}
        <Route
          path="/dashboard"
          element={<Navigate to="/dashboard/journal" replace />}
        />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="journal" element={<Journal />} />
          <Route path="playbooks" element={<Playbooks />} />
          <Route path="bots" element={<CfxBot />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="streak-simulator" element={<StreakSimulator />} />
          <Route path="*" element={<Navigate to="journal" replace />} />
        </Route>

        {/* Shortcut */}
        <Route
          path="/journal"
          element={<Navigate to="/dashboard/journal" replace />}
        />

        {/* ── Admin auth (completely independent from user auth) ── */}
        {/* /admin and /admin/login both go to the admin login page  */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin dashboard — protected by ProtectedAdminRoute (NOT ProtectedRoute) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        {/* Catch-all admin sub-routes */}
        <Route
          path="/admin/*"
          element={<Navigate to="/admin/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
