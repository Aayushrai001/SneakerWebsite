import React, { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import './Transaction.css';

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const loadingToast = toast.loading('Loading transactions...');
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/admin/transactions?page=${currentPage}&filter=${filter}`, {
          headers: { 'auth-token': localStorage.getItem('admin-token') },
        });
        const data = await response.json();
        if (data.success) {
          setTransactions(data.transactions);
          setTotalPages(data.totalPages);
          toast.success('Transactions loaded successfully', { id: loadingToast });
        } else {
          toast.error(data.message || 'Failed to fetch transactions', { id: loadingToast });
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to fetch transactions', { id: loadingToast });
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [currentPage, filter]);

  const handleFilterChange = (newFilter) => {
    const loadingToast = toast.loading('Applying filter...');
    setFilter(newFilter);
    setCurrentPage(1);
    setIsFilterOpen(false);
    toast.success(`Filter changed to ${newFilter}`, { id: loadingToast });
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
    return <div className="loading">Loading transactions...</div>;
  }

  return (
    <div className="transaction-container">
      <div className="header">
        <h2>Transaction History</h2>
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
        {transactions.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Image</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{transaction._id.slice(-6)}</td>
                  <td>
                    {transaction.user ? (
                      <>
                        {transaction.user.name} <br />
                        <small>{transaction.user.email}</small>
                      </>
                    ) : (
                      <span className="text-muted">User not found</span>
                    )}
                  </td>
                  <td>
                    {transaction.product ? (
                      transaction.product.name
                    ) : (
                      <span className="text-muted">Product not found</span>
                    )}
                  </td>
                  <td>
                    {transaction.productImage ? (
                      <img 
                        src={transaction.productImage} 
                        alt={transaction.product?.name || 'Product'} 
                        className="product-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
                        }}
                      />
                    ) : (
                      <span className="text-muted">No image</span>
                    )}
                  </td>
                  <td>Rs. {transaction.amount / 100}</td>
                  <td>{transaction.paymentMethod}</td>
                  <td>
                    <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td>{formatDate(transaction.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-transactions-message">
            <p>No transactions found</p>
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

export default Transaction;