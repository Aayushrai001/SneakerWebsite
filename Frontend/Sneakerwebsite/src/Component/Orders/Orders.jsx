import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import './orders.css';

const Orders = ({ orders, hasReview, setActiveTab }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    return order.delivery.toLowerCase() === filterStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h3>Order History</h3>
        <div className="filter-container">
          <span className="filter-icon">📦</span>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1); // Reset to page 1 when filter changes
              if (e.target.value === 'all') {
                toast.success('Showing all orders');
              } else {
                toast.success(`Showing ${e.target.value} orders`);
              }
            }}
            className="filter-dropdown"
          >
            <option value="all">All Deliveries</option>
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>
      {currentOrders.length > 0 ? (
        <ul className="orders-list">
          {currentOrders.map((order) => (
            <li key={order._id} className="order-item">
              <img
                src={order.product.image}
                alt={order.product.name}
                className="order-image"
              />
              <div className="order-details">
                <p><strong>Product:</strong> {order.product.name}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>
                <p><strong>Total:</strong> Rs.{order.totalPrice / 100}</p>
                <p>
                  <strong>Payment:</strong>{' '}
                  <span className={`status payment-${order.payment}`}>
                    {order.payment}
                  </span>
                </p>
                <p>
                  <strong>Delivery:</strong>{' '}
                  <span className={`status delivery-${order.delivery}`}>
                    {order.delivery}
                  </span>
                </p>
              </div>
              {!hasReview(order._id) && (
                <button onClick={() => setActiveTab('reviews')} className="review-button">
                  Leave a Review
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-orders">No orders found.</p>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="orders-pagination">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;