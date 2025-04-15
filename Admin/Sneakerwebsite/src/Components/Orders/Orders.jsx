import React, { useState, useEffect } from 'react';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:5000/admin/orders', {
          headers: { 'auth-token': localStorage.getItem('admin-token') },
        });
        const data = await response.json();
        if (data.success) setOrders(data.orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (id, newPayment, newDelivery) => {
    try {
      const response = await fetch('http://localhost:5000/admin/update-order-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('admin-token'),
        },
        body: JSON.stringify({ orderId: id, payment: newPayment, delivery: newDelivery }),
      });
      const data = await response.json();
      if (data.success) {
        setOrders(orders.map(order =>
          order._id === id ? { ...order, payment: newPayment, delivery: newDelivery } : order
        ));
        setMessage('Order status updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update order status');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage('Error updating order status');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="orders-container">
      <h2>Admin Order Management</h2>
      {message && <div className="update-message">{message}</div>}
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Product</th>
            <th>Image</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total Amount</th>
            <th>Payment Method</th>
            <th>Payment</th>
            <th>Delivery</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order.user.name}</td>
              <td>{order.product.name}</td>
              <td><img src={order.productImage} alt={order.product.name} style={{ width: '50px' }} /></td>
              <td>Rs.{order.totalPrice / 100}</td>
              <td>{order.quantity}</td>
              <td>Rs.{(order.totalPrice / 100) * order.quantity}</td>
              <td>{order.paymentMethod}</td>
              <td>
                <select
                  value={order.payment}
                  onChange={(e) => {
                    const newPayment = e.target.value;
                    handleStatusChange(order._id, newPayment, order.delivery);
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </td>
              <td>
                <select
                  value={order.delivery}
                  onChange={(e) => {
                    const newDelivery = e.target.value;
                    handleStatusChange(order._id, order.payment, newDelivery);
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;