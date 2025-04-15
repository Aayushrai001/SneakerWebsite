import React from 'react';
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
import Custom from '../../Components/Custom/Custom'

const Admin = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    navigate('/login', { replace: true });
  };

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
          <Route path="custom" element={<Custom />} />
        </Routes>
      </div>
    </div>
  );
};

export default Admin;