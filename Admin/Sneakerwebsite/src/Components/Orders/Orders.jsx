// Importing necessary dependencies and components
import React, { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi'; 
import { toast } from 'react-hot-toast';  
import './Orders.css'; 

// Functional component definition
const Orders = () => {
  // Define state variables
  const [orders, setOrders] = useState([]);             // Holds list of orders
  const [currentPage, setCurrentPage] = useState(1);    // Current page number for pagination
  const [totalPages, setTotalPages] = useState(1);      // Total pages from backend
  const [filter, setFilter] = useState('all');          // Filter value (all, today, week, month)
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Toggle for filter dropdown
  const [loading, setLoading] = useState(true);         // Loading state while fetching data
  const [activeTab, setActiveTab] = useState('pending'); // Tabs for pending/delivered orders

  // Fetch orders on initial render or when currentPage, filter or activeTab changes
  useEffect(() => {
    fetchOrders();
  }, [currentPage, filter, activeTab]);

  // Function to fetch orders from backend
  const fetchOrders = async () => {
    try {
      const response = await fetch(`http://localhost:5000/admin/orders?page=${currentPage}&filter=${filter}&status=${activeTab}`, {
        headers: { 'auth-token': localStorage.getItem('admin-token') }, // Sending token for authentication
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);           // Update orders array
        setTotalPages(data.totalPages);   // Update total number of pages
      } else {
        console.log('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false); // Stop loading once fetching is done
    }
  };

  // Update payment or delivery status of a specific order
  const handleStatusChange = async (orderId, field, value) => {
    try {
      const response = await fetch('http://localhost:5000/admin/update-order-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admin-token'),
        },
        body: JSON.stringify({
          orderId,
          [field]: value // Dynamic field update (payment or delivery)
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchOrders(); // Refetch updated orders
        toast.success('Order status updated successfully'); // Show success toast
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
    }
  };

  // Handle filter change (all/today/week/month)
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page
    setIsFilterOpen(false); // Close filter dropdown
  };

  // Handle tab switch (Pending or Delivered)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset page on tab change
  };

  // Format date into readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Display loading text while data is being fetched
  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="orders-container">
      {/* Header section with tab buttons and filter */}
      <div className="orders-header">
        <h2>Orders</h2>
        <div className="header-right">
          {/* Tab buttons for switching between pending and delivered */}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => handleTabChange('pending')}
            >
              Pending Orders
            </button>
            <button
              className={`tab-button ${activeTab === 'delivered' ? 'active' : ''}`}
              onClick={() => handleTabChange('delivered')}
            >
              Delivered Orders
            </button>
          </div>

          {/* Filter button and dropdown */}
          <div className="filter-container">
            <button 
              className="filter-button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FiFilter /> Filter
            </button>
            {isFilterOpen && (
              <div className="filter-dropdown">
                {/* Filter options */}
                <div 
                  className={`filter-option ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All
                </div>
                <div 
                  className={`filter-option ${filter === 'today' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('today')}
                >
                  Today
                </div>
                <div 
                  className={`filter-option ${filter === 'week' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('week')}
                >
                  This Week
                </div>
                <div 
                  className={`filter-option ${filter === 'month' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('month')}
                >
                  This Month
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table section for displaying orders */}
      <div className="table-container">
        {orders.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Details</th>
                <th>Product</th>
                <th>Image</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Payment Status</th>
                {activeTab === 'pending' && <th>Delivery Status</th>}
              </tr>
            </thead>
            <tbody>
              {/* Render each order in a row */}
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id.slice(-6)}</td>
                  <td>
                    <div className="customer-info">
                      {order.user ? (
                        <>
                          <span className="customer-name">{order.user.name}</span>
                          <span className="customer-email">{order.user.email}</span>
                          <span className="customer-address">{order.user.address || 'No address provided'}</span>
                        </>
                      ) : (
                        <span className="text-muted">User not found</span>
                      )}
                    </div>
                  </td>
                  <td>{order.product?.name || 'Product not found'}</td>
                  <td>
                    {order.productImage ? (
                      <img src={order.productImage} alt={order.product?.name || 'Product'} className="product-image" />
                    ) : (
                      <span className="text-muted">No image</span>
                    )}
                  </td>
                  <td>{order.quantity}</td>
                  <td>Rs. {order.totalPrice / 100}</td>
                  <td>{order.paymentMethod || 'N/A'}</td>
                  <td>{formatDate(order.purchaseDate)}</td>
                  <td>
                    {/* Payment status (editable in pending tab) */}
                    {activeTab === 'delivered' ? (
                      <span className={`status-badge ${order.payment}`}>
                        {order.payment.charAt(0).toUpperCase() + order.payment.slice(1)}
                      </span>
                    ) : (
                      <select
                        className="status-select"
                        value={order.payment}
                        onChange={(e) => handleStatusChange(order._id, 'payment', e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    )}
                  </td>
                  {activeTab === 'pending' && (
                    <td>
                      {/* Delivery status (editable in pending tab) */}
                      <select
                        className="status-select"
                        value={order.delivery}
                        onChange={(e) => handleStatusChange(order._id, 'delivery', e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // Message when no orders found
          <div className="no-orders-message">
            <p>No {activeTab} orders found</p>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="page-numbers">
            {/* Dynamically generate page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else {
                if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={currentPage === pageNum ? 'active' : ''}
                >
                  {pageNum}
                </button>
              );
            })}
            {/* Show ellipsis and last page when needed */}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span>...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={currentPage === totalPages ? 'active' : ''}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Orders;
