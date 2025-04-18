import React, { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import './ReviewsFeedback.css';

const ReviewsFeedback = () => {
  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [expandedRow, setExpandedRow] = useState(null);
  const [feedbackInput, setFeedbackInput] = useState({});
  const [showFeedbackForm, setShowFeedbackForm] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Added for dropdown toggle
  const [loading, setLoading] = useState(true);

  // Fetch reviews from backend
  useEffect(() => {
    const fetchReviews = async () => {
      const loadingToast = toast.loading('Loading reviews...');
      try {
        setLoading(true);
        const token = localStorage.getItem('auth-token');
        if (!token) {
          toast.error('Authentication required', { id: loadingToast });
          setReviews([]); // Clear reviews if not authenticated
          return;
        }
        console.log(`Fetching reviews with filter: ${filter}, page: ${currentPage}`);
        const response = await fetch(`http://localhost:5000/admin/reviews?page=${currentPage}&filter=${filter}`, {
          headers: {
            'auth-token': token,
          },
        });
        const data = await response.json();
        if (data.success) {
          setReviews(data.reviews);
          setTotalPages(data.totalPages);
          console.log('Reviews fetched:', data.reviews);
          toast.success('Reviews loaded successfully', { id: loadingToast });
        } else {
          console.error('Failed to fetch reviews:', data.message);
          setReviews([]);
          toast.error(data.message || 'Failed to fetch reviews', { id: loadingToast });
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
        toast.error('Error fetching reviews', { id: loadingToast });
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [currentPage, filter]);

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    const loadingToast = toast.loading('Applying filter...');
    console.log('Filter changed to:', newFilter);
    setFilter(newFilter);
    setCurrentPage(1);
    setIsFilterOpen(false);
    toast.success(`Filter changed to ${newFilter}`, { id: loadingToast });
  };

  // Toggle filter dropdown
  const toggleFilterDropdown = () => {
    setIsFilterOpen(prev => !prev);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle delete review with confirmation
  const handleDelete = async (reviewId) => {
    if (deleteConfirmation !== reviewId) {
      setDeleteConfirmation(reviewId);
      toast('Click again to confirm deletion', { icon: '⚠️' });
      return;
    }
    const loadingToast = toast.loading('Deleting review...');
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`http://localhost:5000/admin/review/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'auth-token': token,
        },
      });
      const data = await response.json();
      if (data.success) {
        setReviews(reviews.filter(review => review._id !== reviewId));
        setDeleteConfirmation(null);
        toast.success('Review deleted successfully', { id: loadingToast });
      } else {
        toast.error(data.message || 'Failed to delete review', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Error deleting review', { id: loadingToast });
    }
  };

  // Toggle feedback panel
  const toggleFeedbackPanel = (reviewId) => {
    setExpandedRow(expandedRow === reviewId ? null : reviewId);
  };

  // Handle feedback input change
  const handleFeedbackChange = (reviewId, value) => {
    setFeedbackInput(prev => ({ ...prev, [reviewId]: value }));
  };

  // Submit admin feedback
  const handleFeedbackSubmit = async (reviewId) => {
    const feedback = feedbackInput[reviewId]?.trim();
    if (!feedback) {
      toast.error('Feedback cannot be empty');
      return;
    }
    const loadingToast = toast.loading('Submitting feedback...');
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`http://localhost:5000/admin/review/${reviewId}/feedback`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token,
        },
        body: JSON.stringify({ adminFeedback: feedback }),
      });
      const data = await response.json();
      if (data.success) {
        setReviews(reviews.map(review =>
          review._id === reviewId ? { ...review, adminFeedback: feedback } : review
        ));
        setShowFeedbackForm(null);
        setFeedbackInput(prev => ({ ...prev, [reviewId]: '' }));
        toast.success('Feedback submitted successfully', { id: loadingToast });
      } else {
        toast.error(data.message || 'Failed to submit feedback', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error submitting feedback', { id: loadingToast });
    }
  };

  // Cancel feedback form
  const handleFeedbackCancel = (reviewId) => {
    setShowFeedbackForm(null);
    setFeedbackInput(prev => ({ ...prev, [reviewId]: '' }));
    toast.success('Feedback form cancelled');
  };

  // Toggle feedback form
  const toggleFeedbackForm = (reviewId) => {
    setShowFeedbackForm(showFeedbackForm === reviewId ? null : reviewId);
    if (showFeedbackForm !== reviewId) {
      toast.success('Feedback form opened');
    }
  };

  // Render pagination buttons
  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  // Format date function
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
    <div className="reviews-container">
      <div className="header">
        <h2>Reviews & Feedback</h2>
        <div className="filter-wrapper">
          <div className="filter-button" onClick={toggleFilterDropdown}>
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
        {reviews.length === 0 ? (
          <p>No reviews found for the selected filter.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <React.Fragment key={review._id}>
                  <tr>
                    <td className="product-cell">
                      <img
                        src={review.product.image}
                        alt={review.product.name}
                        className="product-image"
                      />
                      {review.product.name}
                    </td>
                    <td>
                      {review.user.name} <br />
                      <small>{review.user.email}</small>
                    </td>
                    <td>{review.rating}/5</td>
                    <td>{review.feedback}</td>
                    <td>{formatDate(review.date)}</td>
                    <td>
                      <button
                        className="action-button delete-button"
                        onClick={() => handleDelete(review._id)}
                      >
                        {deleteConfirmation === review._id ? 'Confirm Delete' : 'Delete'}
                      </button>
                      <button
                        className="action-button"
                        onClick={() => toggleFeedbackForm(review._id)}
                      >
                        {showFeedbackForm === review._id ? 'Close Form' : 'Add Feedback'}
                      </button>
                      {review.adminFeedback && (
                        <button
                          className="action-button"
                          onClick={() => toggleFeedbackPanel(review._id)}
                        >
                          {expandedRow === review._id ? 'Close' : 'View Feedback'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {showFeedbackForm === review._id && (
                    <tr>
                      <td colSpan="6" className="feedback-panel">
                        <h4>Add Admin Feedback</h4>
                        <textarea
                          className="feedback-textarea"
                          value={feedbackInput[review._id] || ''}
                          onChange={(e) => handleFeedbackChange(review._id, e.target.value)}
                          placeholder="Enter your feedback here..."
                        />
                        <div className="feedback-buttons">
                          <button
                            className="submit-button"
                            onClick={() => handleFeedbackSubmit(review._id)}
                          >
                            Submit
                          </button>
                          <button
                            className="cancel-button"
                            onClick={() => handleFeedbackCancel(review._id)}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {expandedRow === review._id && review.adminFeedback && (
                    <tr>
                      <td colSpan="6" className="feedback-panel">
                        <h4>Admin Feedback</h4>
                        <p className="feedback-previous">
                          <em>{review.adminFeedback}</em>
                        </p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {renderPagination()}
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsFeedback;