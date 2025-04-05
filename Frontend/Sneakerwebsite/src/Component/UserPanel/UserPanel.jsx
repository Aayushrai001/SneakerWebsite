import React, { useState, useEffect } from 'react';
import './UserPanel.css';

const UserPanel = () => {
  const [activeTab, setActiveTab] = useState('details');
  const [userData, setUserData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchUserData();
    fetchUserOrders();
    fetchUserReviews();
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
        setFormData({ name: data.user.name || '', phone: data.user.phone || '', address: data.user.address || '' });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
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
      if (data.success) setOrders(data.orders);
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
      if (data.success) setReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('http://localhost:5000/user/update', {
        method: 'PUT',
        headers: { 'auth-token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating user details:', error);
    }
  };

  const handleReviewSubmit = async (orderId, rating, feedback) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('http://localhost:5000/user/review', {
        method: 'POST',
        headers: { 'auth-token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchasedItemId: orderId, rating, feedback }),
      });
      const data = await response.json();
      if (data.success) {
        fetchUserReviews();
        alert('Review submitted successfully!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const hasReview = (orderId) => {
    return reviews.some(review => review.purchasedItem.toString() === orderId.toString());
  };

  return (
    <div className="user-panel">
      <div className="user-info">
        <h2>Welcome, {userData.name}</h2>
        <p>Email: {userData.email}</p>
      </div>

      <div className="tabs">
        <button className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>
          User Details
        </button>
        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
          Orders
        </button>
        <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>
          Reviews
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'details' && (
          <div className="user-details">
            <h3>User Information</h3>
            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Name:</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input type="email" value={userData.email} disabled />
                </div>
                <div className="form-group">
                  <label>Phone:</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Address:</label>
                  <textarea name="address" value={formData.address} onChange={handleInputChange} />
                </div>
                <div className="form-buttons">
                  <button onClick={handleUpdate}>Save</button>
                  <button onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p><strong>Name:</strong> {userData.name}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                <p><strong>Phone:</strong> {userData.phone || 'Not provided'}</p>
                <p><strong>Address:</strong> {userData.address || 'Not provided'}</p>
                <button className="edit-button" onClick={() => setIsEditing(true)}>
                  Edit Details
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders">
            <h3>Order History</h3>
            {orders.length > 0 ? (
              <ul>
                {orders.map((order) => (
                  <li key={order._id}>
                    <p>Product: {order.product.name}</p>
                    <img src={order.product.image} alt={order.product.name} style={{ width: '50px' }} />
                    <p>Quantity: {order.quantity}</p>
                    <p>Total: Rs.{order.totalPrice / 100}</p>
                    <p>Payment: <span className={`status ${order.payment}`}>{order.payment}</span></p>
                    <p>Delivery: <span className={`status ${order.delivery}`}>{order.delivery}</span></p>
                    {!hasReview(order._id) && (
                      <button onClick={() => setActiveTab('reviews')}>Leave a Review</button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No orders found.</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews">
            <h3>Your Reviews</h3>
            {reviews.length > 0 ? (
              <ul>
                {reviews.map((review) => (
                  <li key={review._id}>
                    <p>Product: {review.product.name}</p>
                    <img src={review.product.image} alt={review.product.name} style={{ width: '50px' }} />
                    <p>Rating: {'⭐'.repeat(review.rating)}</p>
                    <p>Feedback: {review.feedback}</p>
                    <p>Status: {review.status}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No reviews submitted yet.</p>
            )}
            <h4>Submit a New Review</h4>
            {orders.filter(order => !hasReview(order._id)).length > 0 ? (
              orders.filter(order => !hasReview(order._id)).map((order) => (
                <div key={order._id} className="review-form">
                  <p>Product: {order.product.name}</p>
                  <img src={order.product.image} alt={order.product.name} style={{ width: '50px' }} />
                  <div className="form-group">
                    <label>Rating (1-5):</label>
                    <input type="number" min="1" max="5" id={`rating-${order._id}`} />
                  </div>
                  <div className="form-group">
                    <label>Feedback:</label>
                    <textarea id={`feedback-${order._id}`} />
                  </div>
                  <button
                    onClick={() => {
                      const rating = document.getElementById(`rating-${order._id}`).value;
                      const feedback = document.getElementById(`feedback-${order._id}`).value;
                      handleReviewSubmit(order._id, rating, feedback);
                    }}
                  >
                    Submit Review
                  </button>
                </div>
              ))
            ) : (
              <p>No orders available for review.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPanel;