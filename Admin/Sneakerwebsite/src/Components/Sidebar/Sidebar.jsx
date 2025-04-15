import React from 'react';
import './Sidebar.css';
import { Link } from 'react-router-dom';
import add_product_icon from '../../assets/Product_Cart.svg';
import list_product_icon from '../../assets/Product_list_icon.svg';

const Sidebar = ({ onLogout }) => {
  return (
    <div className="sidebar">
      <Link to="/admin/addproduct" style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={add_product_icon} alt="Add Product" />
          <p>Add Product</p>
        </div>
      </Link>
      <Link to="/admin/listproduct" style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={list_product_icon} alt="Product List" />
          <p>Product List</p>
        </div>
      </Link>
      <Link to="/admin/reviewsfeedback" style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <p>Reviews and Feedback</p>
        </div>
      </Link>
      <Link to="/admin/orders" style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <p>Orders</p>
        </div>
      </Link>
      <Link to="/admin/transaction" style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <p>Transaction</p>
        </div>
      </Link>
      <div className="sidebar-item logout">
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;