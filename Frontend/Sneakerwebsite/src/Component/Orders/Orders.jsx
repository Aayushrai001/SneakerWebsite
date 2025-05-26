import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import './orders.css';

// Orders component that displays order history
const Orders = ({ orders, hasReview, setActiveTab }) => {
  // State for the current filter (all, pending, delivered)
  const [filterStatus, setFilterStatus] = useState('all');
  // State for current page in pagination
  const [currentPage, setCurrentPage] = useState(1);
  // Fixed number of orders to show per page
  const ordersPerPage = 5;

  // Filter orders based on selected delivery status
  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    return order.delivery.toLowerCase() === filterStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage); // Total number of pages
  const indexOfLastOrder = currentPage * ordersPerPage; // Index of last order on current page
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage; // Index of first order on current page
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder); // Slice array for current page

  // Function to change page
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="orders-container">
      {/* Header with filter dropdown */}
      <div className="orders-header">
        <h3>Order History</h3>
        <div className="filter-container">
          <span className="filter-icon">📦</span>
          {/* Dropdown to filter orders by delivery status */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value); // Update filter
              setCurrentPage(1); // Reset to first page
              // Show toast notification based on selection
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

      {/* Order List */}
      {currentOrders.length > 0 ? (
        <ul className="orders-list">
          {currentOrders.map((order) => (
            <li key={order._id} className="order-item">
              {/* Product Image */}
              <img
                src={order.product.image}
                alt={order.product.name}
                className="order-image"
              />
              {/* Order Details */}
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
              {/* Review Button if not already reviewed */}
              {!hasReview(order._id) && (
                <button onClick={() => setActiveTab('reviews')} className="review-button">
                  Leave a Review
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        // Message if no orders found after filtering
        <p className="no-orders">No orders found.</p>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="orders-pagination">
          {/* Show "Previous" button if not on first page */}
          {currentPage > 1 && (
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="page-button"
            >
              ←
            </button>
          )}
          
          {/* Dynamically render pagination numbers */}
          {(() => {
            const maxVisiblePages = 8; // Max number of page buttons to show
            const halfVisiblePages = Math.floor(maxVisiblePages / 2);
            
            // Calculate start and end page range
            let startPage = Math.max(currentPage - halfVisiblePages, 1);
            let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

            // Adjust start page if not enough pages at the end
            if (endPage - startPage + 1 < maxVisiblePages) {
              startPage = Math.max(endPage - maxVisiblePages + 1, 1);
            }

            // Render each page number as button
            const pages = [];
            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`page-button ${currentPage === i ? 'active' : ''}`}
                >
                  {i}
                </button>
              );
            }
            return pages;
          })()}

          {/* Show "Next" button if not on last page */}
          {currentPage < totalPages && (
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="page-button"
            >
              →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;