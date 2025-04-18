import React, { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`http://localhost:5000/admin/orders?page=${currentPage}&filter=${filter}`, {
          headers: { 'auth-token': localStorage.getItem('admin-token') },
        });
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to fetch orders');
      }
    };
    fetchOrders();
  }, [currentPage, filter]);

  const handleStatusChange = async (orderId, newPayment, newDelivery) => {
    try {
      const response = await fetch('http://localhost:5000/admin/update-order-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admin-token'),
        },
        body: JSON.stringify({ orderId, payment: newPayment, delivery: newDelivery }),
      });
      const data = await response.json();
      if (data.success) {
        if (newDelivery === 'delivered') {
          setOrders(orders.filter(order => order._id !== orderId));
        } else {
          setOrders(orders.map(order =>
            order._id === orderId ? { ...order, payment: newPayment, delivery: newDelivery } : order
          ));
        }
        toast.success('Order status updated successfully');
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating order status');
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

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

  return (
    <div className="orders-container">
      <div className="header">
        <h2>Order Management</h2>
        <div className="filter-wrapper">
          <div className="filter-button" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <FiFilter />
            Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </div>
          {isFilterOpen && (
            <div className="filter-dropdown">
              <button
                className={`filter-option ${filter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                All
              </button>
              <button
                className={`filter-option ${filter === 'today' ? 'active' : ''}`}
                onClick={() => handleFilterChange('today')}
              >
                Today
              </button>
              <button
                className={`filter-option ${filter === 'week' ? 'active' : ''}`}
                onClick={() => handleFilterChange('week')}
              >
                This Week
              </button>
              <button
                className={`filter-option ${filter === 'month' ? 'active' : ''}`}
                onClick={() => handleFilterChange('month')}
              >
                This Month
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="table-container">
        {orders.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Image</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Delivery</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id.slice(-6)}</td>
                  <td>
                    {order.user ? (
                      <>
                        {order.user.name} <br />
                        <small>{order.user.email}</small>
                      </>
                    ) : (
                      <span className="text-muted">User not found</span>
                    )}
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
                  <td>{formatDate(order.purchaseDate)}</td>
                  <td>
                    <select
                      value={order.payment}
                      onChange={(e) => handleStatusChange(order._id, e.target.value, order.delivery)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={order.delivery}
                      onChange={(e) => handleStatusChange(order._id, order.payment, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-orders-message">
            <p>No pending orders found</p>
          </div>
        )}
      </div>

      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            className={`pagination-button ${currentPage === page ? 'active' : ''}`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="pagination-button"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Orders;