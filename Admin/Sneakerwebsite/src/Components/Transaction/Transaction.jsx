import React, { useEffect, useState } from 'react';
import './Transaction.css';
import axios from 'axios';

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Fetch all payments and populate necessary fields
        const response = await axios.get('http://localhost:5000/api/payments', {
          headers: {
            'auth-token': localStorage.getItem('auth-token'), // Assuming JWT is stored in localStorage
          },
        });
        setTransactions(response.data.payments || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch transactions');
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) return <div className="transaction-loading">Loading...</div>;
  if (error) return <div className="transaction-error">{error}</div>;

  return (
    <div className="transaction-container">
      <h2>Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Product Image</th>
              <th>Product Name</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction._id}>
                <td>{transaction.user?.name || 'Unknown'}</td>
                <td>
                  <img
                    src={transaction.productImage}
                    alt="Product"
                    className="transaction-product-image"
                  />
                </td>
                <td>{transaction.purchasedItemId?.product?.name || 'N/A'}</td>
                <td>Rs {(transaction.amount / 100).toFixed(2)}</td>
                <td>{transaction.paymentGateway}</td>
                <td
                  className={`transaction-status transaction-status-${transaction.status.toLowerCase()}`}
                >
                  {transaction.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Transaction;