import React from 'react';
import './Admin.css';
import Sidebar from '../../Components/Sidebar/Sidebar';
import Navabr from '../../Components/Navbar/Navabr';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AddProduct from '../../Components/AddProduct/AddProduct';
import ListProduct from '../../Components/ListProduct/ListProduct';
import ReviewsFeedback from '../../Components/ReviewsFeedback/ReviewsFeedback';
import Orders from '../../Components/Orders/Orders';
import Transaction from '../../Components/Transaction/Transaction';

const Admin = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin">
      <Navabr /> {/* Add the Navbar here */}
      <Sidebar onLogout={handleLogout} />
      <div className="admin-content">
        <Routes>
          <Route index element={<h2>Welcome to Admin Panel</h2>} />
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