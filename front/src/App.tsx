import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login';

// Pages
import Home from './pages/Home';
import { AuthProvider, useAuth } from './context/AuthContext';

//Protected route component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requireAuth?: boolean;
}> = ({ children, requireAuth = true }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login/" />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />

      {/*Auth routes (only for non-authenticated users)*/}
      <Route
        path="/login/"
        element={
          <ProtectedRoute requireAuth={false}>
            <Login />
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/users/register/"
        element={
          <ProtectedRoute requireAuth={false}>
            <Register />
          </ProtectedRoute>
        }
      /> */}

    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App;