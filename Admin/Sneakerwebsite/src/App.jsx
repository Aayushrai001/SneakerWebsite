import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Components/Navbar/Navabr';
import Login from './Pages/Login/Login';
import Admin from './Pages/Admin/Admin';

// ProtectedRoute component to guard routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('auth-token');
  const location = useLocation();

  // If no token, redirect to login and preserve the intended destination
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const App = () => {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

export default App;