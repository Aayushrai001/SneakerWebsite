import React, { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi'; 
import { toast } from 'react-hot-toast'; 
import './Transaction.css';                

// Component to render the transaction table
const TransactionTable = ({ transactions, formatDate }) => {
  return (
    <div className="table-container">
      {transactions.length > 0 ? ( // Check if there are any transactions to display
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
              <tr key={transaction._id}> {/* Unique key for each row */}
                <td>{transaction._id.slice(-6)}</td> {/* Display last 6 characters of ID */}
                <td>
                  {transaction.user ? ( // Check if user exists
                    <>
                      {transaction.user.name} <br />
                      <small>{transaction.user.email}</small>
                    </>
                  ) : (
                    <span className="text-muted">User not found</span>
                  )}
                </td>
                <td>
                  {transaction.product ? ( // Check if product exists
                    transaction.product.name
                  ) : (
                    <span className="text-muted">Product not found</span>
                  )}
                </td>
                <td>
                  {transaction.productImage ? ( // Show product image if available
                    <img 
                      src={transaction.productImage} 
                      alt={transaction.product?.name || 'Product'} 
                      className="product-image"
                      onError={(e) => { // Fallback image on load error
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
                      }}
                    />
                  ) : (
                    <span className="text-muted">No image</span>
                  )}
                </td>
                <td>Rs. {transaction.amount / 100}</td> {/* Convert paisa to rupees */}
                <td>{transaction.paymentMethod}</td>
                <td>
                  <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                    {transaction.status}
                  </span>
                </td>
                <td>{formatDate(transaction.createdAt)}</td> {/* Format date */}
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
  );
};

// Main Transaction component
const Transaction = () => {
  // Define state variables
  const [transactions, setTransactions] = useState([]); // Store transactions
  const [currentPage, setCurrentPage] = useState(1);     // Current page number
  const [totalPages, setTotalPages] = useState(1);       // Total number of pages
  const [filter, setFilter] = useState('all');           // Current filter
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Filter dropdown toggle
  const [loading, setLoading] = useState(true);            // Loading state

  // Function to fetch transactions from backend API
  const fetchTransactions = async (page, currentFilter) => {
    try {
      setLoading(true); // Start loading
      const response = await fetch(`http://localhost:5000/admin/transactions?page=${page}&filter=${currentFilter}`, {
        headers: { 'auth-token': localStorage.getItem('admin-token') }, // Send auth token
      });
      const data = await response.json(); // Parse response
      if (data.success) {
        setTransactions(data.transactions); // Set transactions
        setTotalPages(data.totalPages);     // Set total pages for pagination
      }
    } catch (error) {
      console.error('Error fetching transactions:', error); // Log any errors
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Fetch transactions when page or filter changes
  useEffect(() => {
    fetchTransactions(currentPage, filter);
  }, [currentPage, filter]);

  // Handle change in filter value
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter); // Update filter
    setCurrentPage(1);    // Reset to first page
    setIsFilterOpen(false); // Close dropdown
  };

  // Handle page number change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage); // Set selected page
  };

  // Format date to readable string
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

  // Show loading message while data is being fetched
  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  // JSX structure for Transaction component
  return (
    <div className="transaction-container">
      {/* Header Section */}
      <div className="header">
        <h2>Transaction History</h2>
        <div className="filter-wrapper">
          {/* Filter button toggle */}
          <div className="filter-button" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <FiFilter />
            Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)} {/* Capitalize filter name */}
          </div>

          {/* Filter dropdown menu */}
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

      {/* Transaction Table Section */}
      <TransactionTable transactions={transactions} formatDate={formatDate} />

      {/* Pagination Section */}
      {totalPages > 1 && (
        <div className="pagination">
          {/* Previous Page Button */}
          <button
            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1; // If few pages, show all
              } else {
                if (currentPage <= 3) {
                  pageNum = i + 1; // Show first few pages
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i; // Show last few pages
                } else {
                  pageNum = currentPage - 2 + i; // Show around current page
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={currentPage === pageNum ? 'active' : ''}
                >
                  {pageNum}
                </button>
              );
            })}
            {/* Dots and last page button if many pages */}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span>...</span>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className={currentPage === totalPages ? 'active' : ''}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* Next Page Button */}
          <button
            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Transaction;
