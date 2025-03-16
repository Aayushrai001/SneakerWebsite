import React, { useState } from 'react';
import './Orders.css';

const initialOrders = [
  {
    id: 1,
    productName: 'Wireless Headphones',
    image: 'https://via.placeholder.com/50',
    price: 50,
    quantity: 2,
    amount: 100,
    paymentMethod: 'Khalti',
    status: 'Deliveryed'
  },
  {
    id: 2,
    productName: 'Smart Watch',
    image: 'https://via.placeholder.com/50',
    price: 80,
    quantity: 1,
    amount: 80,
    paymentMethod: 'Khalti',
    status: 'Pending'
  }
];

const Orders = () => {
  const [orders, setOrders] = useState(initialOrders);

  const handleStatusChange = (id, newStatus) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ));
  };

  return (
    <div className="orders-container">
      <h2>Order Management</h2>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Image</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total Amount</th>
            <th>Payment Method</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.productName}</td>
              <td><img src={order.image} alt={order.productName} /></td>
              <td>Rs.{order.price}</td>
              <td>{order.quantity}</td>
              <td>Rs.{order.amount}</td>
              <td>{order.paymentMethod}</td>
              <td>
                <select 
                  value={order.status} 
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleStatusChange(order.id, order.status)}>Update</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;
