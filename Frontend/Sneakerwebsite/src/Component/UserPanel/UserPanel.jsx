import React, { useState, useEffect } from 'react';
import './UserPanel.css';

const UserPanel = () => {
    const [activeTab, setActiveTab] = useState('details');
    const [userData, setUserData] = useState({});
    const [orders, setOrders] = useState([]);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        fetchUserData();
        fetchUserOrders();
        fetchUserTransactions();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('auth-token');
            const response = await fetch('http://localhost:5000/user/details', {
                method: 'GET',
                headers: { 'auth-token': token },
            });
            const data = await response.json();
            if (data.success) setUserData(data.user);
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

    const fetchUserTransactions = async () => {
        try {
            const token = localStorage.getItem('auth-token');
            const response = await fetch('http://localhost:5000/user/transactions', {
                method: 'GET',
                headers: { 'auth-token': token },
            });
            const data = await response.json();
            if (data.success) setTransactions(data.transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    return (
        <div className="user-panel">
            {/* User Information */}
            <div className="user-info">
                <h2>Welcome, {userData.name}</h2>
                <p>Email: {userData.email}</p>
                <p>Joined: {new Date(userData.createdAt).toLocaleDateString()}</p>
            </div>

            {/* Navigation Tabs */}
            <div className="tabs">
                <button className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>
                    User Details
                </button>
                <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
                    Orders
                </button>
                <button className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>
                    Transactions
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'details' && (
                    <div className="user-details">
                        <h3>User Information</h3>
                        <p><strong>Name:</strong> {userData.name}</p>
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>Phone:</strong> {userData.phone || 'Not provided'}</p>
                        <p><strong>Address:</strong> {userData.address || 'Not provided'}</p>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="orders">
                        <h3>Order History</h3>
                        {orders.length > 0 ? (
                            <ul>
                                {orders.map(order => (
                                    <li key={order.id}>
                                        <p>Order ID: {order.id}</p>
                                        <p>Date: {new Date(order.date).toLocaleDateString()}</p>
                                        <p>Status: <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span></p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No orders found.</p>
                        )}
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="transactions">
                        <h3>Transaction History</h3>
                        {transactions.length > 0 ? (
                            <ul>
                                {transactions.map(txn => (
                                    <li key={txn.id}>
                                        <p>Transaction ID: {txn.id}</p>
                                        <p>Amount: ${txn.amount}</p>
                                        <p>Date: {new Date(txn.date).toLocaleDateString()}</p>
                                        <p>Status: <span className={`status ${txn.status.toLowerCase()}`}>{txn.status}</span></p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No transactions found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserPanel;
