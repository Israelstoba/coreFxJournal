// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoadingScreen = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background:
        'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: 'white',
      fontSize: '1.2rem',
    }}
  >
    Loading...
  </div>
);

// requireVerified defaults true — every dashboard route checks verification
const ProtectedRoute = ({ children, requireVerified = true }) => {
  const { user, loading, isEmailVerified } = useAuth();

  if (loading) return <LoadingScreen />;

  // Not logged in → auth page
  if (!user) return <Navigate to="/auth" replace />;

  // Logged in but email not verified → hold at verify page
  if (requireVerified && !isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

export default ProtectedRoute;
