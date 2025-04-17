import React, { useState, useEffect } from 'react';
import UserDetails from '../UserDetails/UserDetails';
import Orders from '../Orders/Orders';
import Reviews from '../Reviews/Reviews';
import './UserPanel.css';

const UserPanel = () => {
  const [activeTab, setActiveTab] = useState('details');
  const [userData, setUserData] = useState({});
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated by verifying the auth-token
    const token = localStorage.getItem('auth-token');
    if (!token) {
      // If no token, redirect to login page
      window.location.href = '/login';
    } else {
      setIsAuthenticated(true);
      // Fetch user data only if authenticated
      fetchUserData();
      fetchUserOrders();
      fetchUserReviews();
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('http://localhost:5000/user/details', {
        method: 'GET',
        headers: { 'auth-token': token },
      });
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
      } else {
        // If the token is invalid or user data fetch fails, redirect to login
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
  };

  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('http://localhost:5000/user/orders', {
        method: 'GET',
        headers: { 'auth-token': token },
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        console.error('Failed to fetch orders:', data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('http://localhost:5000/user/reviews', {
        method: 'GET',
        headers: { 'auth-token': token },
      });
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      } else {
        console.error('Failed to fetch reviews:', data.message);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    window.location.href = '/login'; // Redirect to login page
  };

  // If the user is not authenticated, return null to prevent rendering
  if (!isAuthenticated) {
    return null; // Rendering nothing while redirect happens
  }

  // Render the UserPanel only if authenticated
  return (
    <div className="user-panel">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>{userData.name || 'User'}</h2>
          <p>{userData.email}</p>
        </div>
        <nav className="sidebar-nav">
          <button
            className={activeTab === 'details' ? 'active' : ''}
            onClick={() => setActiveTab('details')}
          >
            User Details
          </button>
          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button
            className={activeTab === 'reviews' ? 'active' : ''}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
        </nav>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        {activeTab === 'details' && (
          <UserDetails userData={userData} setUserData={setUserData} />
        )}
        {activeTab === 'orders' && (
          <Orders
            orders={orders}
            hasReview={(orderId) =>
              reviews.some(
                (review) => review.purchasedItem.toString() === orderId.toString()
              )
            }
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'reviews' && (
          <Reviews
            reviews={reviews}
            orders={orders}
            hasReview={(orderId) =>
              reviews.some(
                (review) => review.purchasedItem.toString() === orderId.toString()
              )
            }
            fetchUserReviews={fetchUserReviews}
          />
        )}
      </main>
    </div>
  );
};

export default UserPanel;