// Importing necessary dependencies from React and other libraries
import React, { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast'; 
import './ReviewsFeedback.css'; 

// Defining the main ReviewsFeedback functional component
const ReviewsFeedback = () => {
  // State to store the list of reviews fetched from the server
  const [reviews, setReviews] = useState([]);
  // State to track the current page for pagination
  const [currentPage, setCurrentPage] = useState(1);
  // State to store the total number of pages for pagination
  const [totalPages, setTotalPages] = useState(1);
  // State to store the current filter (e.g., 'all', 'today', 'week', 'month')
  const [filter, setFilter] = useState('all');
  // State to track which review's feedback panel is expanded
  const [expandedRow, setExpandedRow] = useState(null);
  // State to store feedback input for each review (keyed by review ID)
  const [feedbackInput, setFeedbackInput] = useState({});
  // State to track which review's feedback form is open
  const [showFeedbackForm, setShowFeedbackForm] = useState(null);
  // State to manage delete confirmation for a specific review
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  // State to toggle the filter dropdown visibility
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // State to indicate whether data is being loaded
  const [loading, setLoading] = useState(true);

  // useEffect hook to fetch reviews from the backend when currentPage or filter changes
  useEffect(() => {
    // Async function to fetch reviews
    const fetchReviews = async () => {
      try {
        setLoading(true); // Sets loading state to true before fetching
        const token = localStorage.getItem('auth-token'); // Retrieves auth token from localStorage
        if (!token) { // Checks if user is authenticated
          toast.error('Authentication required'); // Shows error if no token
          setReviews([]); // Clears reviews if not authenticated
          return;
        }
        console.log(`Fetching reviews with filter: ${filter}, page: ${currentPage}`); // Logs the fetch parameters
        // Sends GET request to fetch reviews with pagination and filter
        const response = await fetch(`http://localhost:5000/admin/reviews?page=${currentPage}&filter=${filter}`, {
          headers: {
            'auth-token': token, // Includes auth token in headers
          },
        });
        const data = await response.json(); // Parses the JSON response
        if (data.success) { // Checks if the fetch was successful
          setReviews(data.reviews); // Updates reviews state
          setTotalPages(data.totalPages); // Updates total pages
          console.log('Reviews fetched:', data.reviews); // Logs the fetched reviews
        } else {
          console.error('Failed to fetch reviews:', data.message); // Logs error message
          setReviews([]); // Clears reviews on failure
          toast.error(data.message || 'Failed to fetch reviews'); // Shows error notification
        }
      } catch (error) {
        console.error('Error fetching reviews:', error); // Logs any fetch errors
        setReviews([]); // Clears reviews on error
        toast.error('Error fetching reviews'); // Shows generic error notification
      } finally {
        setLoading(false); // Sets loading state to false after fetch completes
      }
    };
    fetchReviews(); // Calls the fetch function
  }, [currentPage, filter]); // Dependencies ensure fetch runs when these change

  // Function to handle filter changes
  const handleFilterChange = (newFilter) => {
    const loadingToast = toast.loading('Applying filter...'); // Shows loading toast
    console.log('Filter changed to:', newFilter); // Logs the new filter
    setFilter(newFilter); // Updates the filter state
    setCurrentPage(1); // Resets to the first page
    setIsFilterOpen(false); // Closes the filter dropdown
    toast.success(`Filter changed to ${newFilter}`, { id: loadingToast }); // Updates toast to success
  };

  // Function to toggle the filter dropdown
  const toggleFilterDropdown = () => {
    setIsFilterOpen(prev => !prev); // Toggles the dropdown visibility
  };

  // Function to handle pagination page changes
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) { // Ensures the page is within valid range
      setCurrentPage(page); // Updates the current page
    }
  };

  // Function to handle review deletion with confirmation
  const handleDelete = async (reviewId) => {
    if (deleteConfirmation !== reviewId) { // Checks if this is the first click
      setDeleteConfirmation(reviewId); // Sets the review ID for confirmation
      toast('Click again to confirm deletion', { icon: '⚠️' }); // Prompts for confirmation
      return;
    }
    const loadingToast = toast.loading('Deleting review...'); // Shows loading toast
    try {
      const token = localStorage.getItem('auth-token'); // Retrieves auth token
      // Sends DELETE request to remove the review
      const response = await fetch(`http://localhost:5000/admin/review/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'auth-token': token, // Includes auth token
        },
      });
      const data = await response.json(); // Parses the response
      if (data.success) { // Checks if deletion was successful
        setReviews(reviews.filter(review => review._id !== reviewId)); // Removes the review from state
        setDeleteConfirmation(null); // Clears confirmation state
        toast.success('Review deleted successfully', { id: loadingToast }); // Shows success notification
      } else {
        toast.error(data.message || 'Failed to delete review', { id: loadingToast }); // Shows error notification
      }
    } catch (error) {
      console.error('Error deleting review:', error); // Logs the error
      toast.error('Error deleting review', { id: loadingToast }); // Shows generic error notification
    }
  };

  // Function to toggle the feedback panel visibility for a review
  const toggleFeedbackPanel = (reviewId) => {
    setExpandedRow(expandedRow === reviewId ? null : reviewId); // Toggles the panel
  };

  // Function to handle changes in the feedback input field
  const handleFeedbackChange = (reviewId, value) => {
    setFeedbackInput(prev => ({ ...prev, [reviewId]: value })); // Updates feedback input for the review
  };

  // Function to submit admin feedback for a review
  const handleFeedbackSubmit = async (reviewId) => {
    const feedback = feedbackInput[reviewId]?.trim(); // Gets and trims the feedback
    if (!feedback) { // Checks if feedback is empty
      toast.error('Feedback cannot be empty'); // Shows error if empty
      return;
    }
    const loadingToast = toast.loading('Submitting feedback...'); // Shows loading toast
    try {
      const token = localStorage.getItem('auth-token'); // Retrieves auth token
      // Sends PUT request to submit feedback
      const response = await fetch(`http://localhost:5000/admin/review/${reviewId}/feedback`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token, // Includes auth token
        },
        body: JSON.stringify({ adminFeedback: feedback }), // Sends feedback in the body
      });
      const data = await response.json(); // Parses the response
      if (data.success) { // Checks if submission was successful
        // Updates the review with the new feedback
        setReviews(reviews.map(review =>
          review._id === reviewId ? { ...review, adminFeedback: feedback } : review
        ));
        setShowFeedbackForm(null); // Closes the feedback form
        setFeedbackInput(prev => ({ ...prev, [reviewId]: '' })); // Clears the feedback input
        toast.success('Feedback submitted successfully', { id: loadingToast }); // Shows success notification
      } else {
        toast.error(data.message || 'Failed to submit feedback', { id: loadingToast }); // Shows error notification
      }
    } catch (error) {
      console.error('Error submitting feedback:', error); // Logs the error
      toast.error('Error submitting feedback', { id: loadingToast }); // Shows generic error notification
    }
  };

  // Function to cancel the feedback form
  const handleFeedbackCancel = (reviewId) => {
    setShowFeedbackForm(null); // Closes the feedback form
    setFeedbackInput(prev => ({ ...prev, [reviewId]: '' })); // Clears the feedback input
    toast.success('Feedback form cancelled'); // Shows cancellation notification
  };

  // Function to toggle the feedback form visibility
  const toggleFeedbackForm = (reviewId) => {
    setShowFeedbackForm(showFeedbackForm === reviewId ? null : reviewId); // Toggles the form
    if (showFeedbackForm !== reviewId) { // If opening the form
      toast.success('Feedback form opened'); // Shows notification
    }
  };

  // Function to render pagination buttons
  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) { // Loops through total pages
      pages.push(
        <button
          key={i}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button> // Creates a button for each page
      );
    }
    return pages; // Returns the array of pagination buttons
  };

  // Function to format date strings for display
  const formatDate = (dateString) => {
    const date = new Date(dateString); // Converts string to Date object
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }); // Formats date to a readable string
  };

  // Main render method for the ReviewsFeedback component
  return (
    <div className="reviews-container"> {/* Main container for the component */}
      <div className="header"> {/* Header section */}
        <h2>Reviews & Feedback</h2> {/* Page title */}
        <div className="filter-wrapper"> {/* Filter control wrapper */}
          <div className="filter-button" onClick={toggleFilterDropdown}> {/* Filter button */}
            <FiFilter /> {/* Filter icon */}
            Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)} {/* Displays current filter */}
          </div>
          {isFilterOpen && ( // Conditionally renders the filter dropdown
            <div className="filter-dropdown">
              <button
                className={`filter-option ${filter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                All
              </button> {/* Option to show all reviews */}
              <button
                className={`filter-option ${filter === 'today' ? 'active' : ''}`}
                onClick={() => handleFilterChange('today')}
              >
                Today
              </button> {/* Option to show today's reviews */}
              <button
                className={`filter-option ${filter === 'week' ? 'active' : ''}`}
                onClick={() => handleFilterChange('week')}
              >
                This Week
              </button> {/* Option to show this week's reviews */}
              <button
                className={`filter-option ${filter === 'month' ? 'active' : ''}`}
                onClick={() => handleFilterChange('month')}
              >
                This Month
              </button> {/* Option to show this month's reviews */}
            </div>
          )}
        </div>
      </div>

      <div className="table-container"> {/* Container for the reviews table */}
        {reviews.length === 0 ? ( // Checks if there are no reviews
          <p>No reviews found for the selected filter.</p> // Displays message if no reviews
        ) : (
          <table className="table"> {/* Reviews table */}
            <thead>
              <tr>
                <th>Product</th> {/* Column for product details */}
                <th>Customer</th> {/* Column for customer details */}
                <th>Rating</th> {/* Column for review rating */}
                <th>Comment</th> {/* Column for review comment */}
                <th>Date</th> {/* Column for review date */}
                <th>Actions</th> {/* Column for action buttons */}
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => ( // Maps reviews to table rows
                <React.Fragment key={review._id}> {/* Uses React.Fragment to group rows */}
                  <tr>
                    <td className="product-cell"> {/* Product column */}
                      <img
                        src={review.product.image}
                        alt={review.product.name}
                        className="product-image"
                      /> {/* Product image */}
                      {review.product.name} {/* Product name */}
                    </td>
                    <td> {/* Customer column */}
                      {review.user.name} <br /> {/* Customer name */}
                      <small>{review.user.email}</small> {/* Customer email */}
                    </td>
                    <td>{review.rating}/5</td> {/* Rating column */}
                    <td>{review.feedback}</td> {/* Comment column */}
                    <td>{formatDate(review.date)}</td> {/* Date column with formatted date */}
                    <td> {/* Actions column */}
                      <button
                        className="action-button delete-button"
                        onClick={() => handleDelete(review._id)}
                      >
                        {deleteConfirmation === review._id ? 'Confirm Delete' : 'Delete'} {/* Delete button with confirmation */}
                      </button>
                      <button
                        className="action-button feedback"
                        onClick={() => toggleFeedbackForm(review._id)}
                      >
                        {showFeedbackForm === review._id ? 'Close Form' : 'Feedback'} {/* Feedback form toggle button */}
                      </button>
                      {review.adminFeedback && ( // Conditionally shows view button if feedback exists
                        <button
                          className="action-button view"
                          onClick={() => toggleFeedbackPanel(review._id)}
                        >
                          {expandedRow === review._id ? 'Close' : 'View'} {/* View feedback toggle button */}
                        </button>
                      )}
                    </td>
                  </tr>
                  {showFeedbackForm === review._id && ( // Conditionally renders feedback form
                    <tr>
                      <td colSpan="6" className="feedback-panel"> {/* Feedback form row */}
                        <h4>Add Admin Feedback</h4> {/* Form title */}
                        <textarea
                          className="feedback-textarea"
                          value={feedbackInput[review._id] || ''}
                          onChange={(e) => handleFeedbackChange(review._id, e.target.value)}
                          placeholder="Enter your feedback here..."
                        /> {/* Feedback input textarea */}
                        <div className="feedback-buttons">
                          <button
                            className="submit-button"
                            onClick={() => handleFeedbackSubmit(review._id)}
                          >
                            Submit
                          </button> {/* Submit feedback button */}
                          <button
                            className="cancel-button"
                            onClick={() => handleFeedbackCancel(review._id)}
                          >
                            Cancel
                          </button> {/* Cancel feedback button */}
                        </div>
                      </td>
                    </tr>
                  )}
                  {expandedRow === review._id && review.adminFeedback && ( // Conditionally renders feedback panel
                    <tr>
                      <td colSpan="6" className="feedback-panel"> {/* Feedback display row */}
                        <h4>Admin Feedback</h4> {/* Panel title */}
                        <p className="feedback-previous">
                          <em>{review.adminFeedback}</em> {/* Displays existing admin feedback */}
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

      {reviews.length > 0 && ( // Conditionally renders pagination controls
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button> {/* Previous page button */}
          {renderPagination()} {/* Renders page number buttons */}
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button> {/* Next page button */}
        </div>
      )}
    </div>
  );
};

export default ReviewsFeedback;