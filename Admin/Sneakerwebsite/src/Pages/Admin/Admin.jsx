import React, { useEffect } from 'react';
import './Admin.css';
import Sidebar from '../../Components/Sidebar/Sidebar';
import Navabr from '../../Components/Navbar/Navabr';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'; // Added Navigate
import AddProduct from '../../Components/AddProduct/AddProduct';
import ListProduct from '../../Components/ListProduct/ListProduct';
import ReviewsFeedback from '../../Components/ReviewsFeedback/ReviewsFeedback';
import Orders from '../../Components/Orders/Orders';
import Transaction from '../../Components/Transaction/Transaction';
import Overview from '../../Components/Overview/Overview';


const Admin = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          handleLogout();
          return;
        }

        const response = await fetch('http://localhost:5000/admin/check-session', {
          headers: {
            'auth-token': token
          }
        });

        if (!response.ok) {
          handleLogout();
        }
      } catch (error) {
        console.error('Session check error:', error);
        handleLogout();
      }
    };

    // Check session every minute
    const intervalId = setInterval(checkSession, 60000);

    // Initial check
    checkSession();

    return () => clearInterval(intervalId);
  }, [navigate]);

  return (
    <div className="admin">
      <Navabr />
      <Sidebar onLogout={handleLogout} />
      <div className="admin-content">
        <Routes>
          <Route path="/" element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="addproduct" element={<AddProduct />} />
          <Route path="listproduct" element={<ListProduct />} />
          <Route path="reviewsfeedback" element={<ReviewsFeedback />} />
          <Route path="orders" element={<Orders />} />
          <Route path="transaction" element={<Transaction />} />
        </Routes>
      </div>
    </div>
  );
};

export default Admin;