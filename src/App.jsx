// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Calculator from './components/Calculator';
import Footer from './components/Footer';
import CfxFlip from './components/CfxFlip';

// ✅ Dashboard imports
import DashboardLayout from './components/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Journal from './pages/dashboard/Journal';
import Playbooks from './pages/dashboard/Playbooks';
import CfxBot from './pages/dashboard/CfxBot';
import Settings from './pages/dashboard/Settings';
import Profile from './pages/dashboard/Profile';

function App() {
  return (
    <Router>
      <Routes>
        {/* 🌍 Public Pages (With Navbar + Footer) */}
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

        {/* 💼 Dashboard Section (No Navbar or Footer) */}
        <Route
          path="/dashboard"
          element={<Navigate to="/dashboard/overview" replace />}
        />

        {/* 🧭 Nested Dashboard Routes */}
        <Route path="/dashboard/*" element={<DashboardLayout />}>
          <Route path="overview" element={<Overview />} />
          <Route path="journal" element={<Journal />} />
          <Route path="playbooks" element={<Playbooks />} />
          <Route path="bots" element={<CfxBot />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Route>

        {/* 🎯 Direct shortcut to Journal */}
        <Route
          path="/journal"
          element={<Navigate to="/dashboard/journal" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
