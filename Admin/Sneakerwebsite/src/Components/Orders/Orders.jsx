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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filter]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`http://localhost:5000/admin/orders?page=${currentPage}&filter=${filter}`, {
        headers: { 'auth-token': localStorage.getItem('admin-token') },
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        toast.success('Orders loaded successfully');
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

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
          [field]: value
        })
      });
      const data = await response.json();
      if (data.success) {
        if (field === 'delivery' && value === 'delivered') {
          setOrders(orders.filter(order => order._id !== orderId));
          toast.success('Order marked as delivered');
        } else {
          setOrders(orders.map(order => 
            order._id === orderId ? { ...order, [field]: value } : order
          ));
          toast.success('Order status updated successfully');
        }
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
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

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>Orders</h2>
        <div className="filter-container">
          <button 
            className="filter-button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <FiFilter /> Filter
          </button>
          {isFilterOpen && (
            <div className="filter-dropdown">
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
                      className="status-select"
                      value={order.payment}
                      onChange={(e) => handleStatusChange(order._id, 'payment', e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={order.delivery}
                      onChange={(e) => handleStatusChange(order._id, 'delivery', e.target.value)}
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
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <div className="page-numbers">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? 'active' : ''}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Orders;