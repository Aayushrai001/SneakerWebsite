import React from 'react';
import './Sidebar.css';
import { Link } from 'react-router-dom';
import overview_icon from '../../assets/overview.png';
import add_product_icon from '../../assets/Product_Cart.svg';
import list_product_icon from '../../assets/Product_list_icon.svg';
import ratingfeedback_icon from '../../assets/feedback.png';
import orders_icon from '../../assets/orders.png';
import Transaction_icon from '../../assets/transaction.png';
import dashboard_icon from '../../assets/dashboard.png';

const Sidebar = ({ onLogout }) => {
  return (
    <div className="sidebar">
      <div className="Dashboard"> {/* Fixed typo */}
        <h1>Dashboard</h1> {/* Fixed typo in text */}
        <img src={dashboard_icon} alt="Dashboard" />
      </div>
      <Link to="/admin/overview" style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={overview_icon} alt="Product List" />
          <p>Overview</p>
        </div>
      </Link>
      <Link to="/admin/addproduct" style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img 
            src={add_product_icon} 
            alt="Add Product" 
            onError={(e) => (e.target.style.display = 'none')} 
          />
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
          <img src={ratingfeedback_icon} alt="Rating Feedback" />
          <p>Reviews and Feedback</p>
        </div>
      </Link>
      <Link to="/admin/orders" style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={orders_icon} alt="Orders" />
          <p>Orders</p>
        </div>
      </Link>
      <Link to="/admin/transaction" style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={Transaction_icon} alt="Transaction" />
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