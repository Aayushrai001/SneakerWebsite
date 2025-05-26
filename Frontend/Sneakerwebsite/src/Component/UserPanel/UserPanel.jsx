import React, { useState, useEffect } from 'react';
import UserDetails from '../UserDetails/UserDetails';
import Orders from '../Orders/Orders';
import Reviews from '../Reviews/Reviews';
import './UserPanel.css';

// Main UserPanel component
const UserPanel = () => {
  // useState to track which tab is currently active
  const [activeTab, setActiveTab] = useState('details');
  // useState to hold the fetched user details
  const [userData, setUserData] = useState({});
  // useState to hold the list of user orders
  const [orders, setOrders] = useState([]);
  // useState to hold the list of user reviews
  const [reviews, setReviews] = useState([]);
  // useState to track whether user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // useEffect runs once when component mounts
  useEffect(() => {
    // Get auth token from local storage
    const token = localStorage.getItem('auth-token');
    if (!token) {
      // Redirect to login if token is missing
      window.location.href = '/login';
    } else {
      // Set authenticated flag to true
      setIsAuthenticated(true);
      // Fetch user details from backend
      fetchUserData();
      // Fetch user orders from backend
      fetchUserOrders();
      // Fetch user reviews from backend
      fetchUserReviews();  
    }
  }, []);

  // Function to fetch user details from backend
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('http://localhost:5000/user/details', {
        method: 'GET',
        headers: { 'auth-token': token },
      });
      const data = await response.json();
      if (data.success) {
        // Update userData state with response
        setUserData(data.user);
      } else {
        // If fetch fails or token invalid, clear token and redirect
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
      }
    } catch (error) {
      // Log error and redirect to login
      console.error('Error fetching user details:', error);
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
  };

  // Function to fetch user's orders
  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('http://localhost:5000/user/orders', {
        method: 'GET',
        headers: { 'auth-token': token },
      });
      const data = await response.json();
      if (data.success) {
        // Update orders state with response
        setOrders(data.orders);
      } else {
        // Log error message if request fails
        console.error('Failed to fetch orders:', data.message);
      }
    } catch (error) {
      // Log error on catch
      console.error('Error fetching orders:', error);
    }
  };

  // Function to fetch user's reviews
  const fetchUserReviews = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('http://localhost:5000/user/reviews', {
        method: 'GET',
        headers: { 'auth-token': token },
      });
      const data = await response.json();
      if (data.success) {
        // Update reviews state with response
        setReviews(data.reviews);
      } else {
        // Log error message if request fails
        console.error('Failed to fetch reviews:', data.message);
      }
    } catch (error) {
      // Log error on catch
      console.error('Error fetching reviews:', error);
    }
  };

  // Handle user logout
  const handleLogout = () => {
    // Clear auth token and redirect to login
    localStorage.removeItem('auth-token');
    window.location.href = '/login';
  };

  // Prevent component from rendering if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render the component if user is authenticated
  return (
    <div className="user-panel">
      {/* Sidebar section */}
      <aside className="sidebar">
        {/* Sidebar header with user name and email */}
        <div className="sidebar-header">
          <h2>{userData.name || 'User'}</h2>
          <p>{userData.email}</p>
        </div>

        {/* Navigation buttons to switch tabs */}
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

        {/* Logout button */}
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main content area depending on selected tab */}
      <main className="main-content">
        {/* Render UserDetails if 'details' tab is active */}
        {activeTab === 'details' && (
          <UserDetails userData={userData} setUserData={setUserData} />
        )}
        {/* Render Orders if 'orders' tab is active */}
        {activeTab === 'orders' && (
          <Orders
            orders={orders}
            // Check if review exists for each order
            hasReview={(orderId) =>
              reviews.some(
                (review) => review.purchasedItem.toString() === orderId.toString()
              )
            }
            setActiveTab={setActiveTab}
          />
        )}
        {/* Render Reviews if 'reviews' tab is active */}
        {activeTab === 'reviews' && (
          <Reviews
            reviews={reviews}
            orders={orders}
            // Check if review exists for order
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
