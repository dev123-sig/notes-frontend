import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AcceptInvitation from './pages/AcceptInvitation';
import NotFound from './pages/NotFound';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen animated-gradient relative">
            <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
            <div className="relative z-10 min-h-screen">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/invite/:token" element={<AcceptInvitation />} />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
