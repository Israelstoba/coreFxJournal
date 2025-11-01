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

        {/* 💼 Dashboard Pages (No Navbar + Footer) */}
        {/* Redirect journal and /dashboard → /dashboard/overview */}
        <Route
          path="/journal"
          element={<Navigate to="/dashboard/overview" replace />}
        />
        <Route
          path="/dashboard"
          element={<Navigate to="/dashboard/overview" replace />}
        />

        <Route
          path="/dashboard/overview"
          element={
            <DashboardLayout>
              <Overview />
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
