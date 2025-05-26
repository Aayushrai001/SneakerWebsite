import React, { useState, useEffect } from 'react';
import './Reviews.css';
import { toast } from 'react-hot-toast';

// Define the Reviews component, receiving props from the parent
const Reviews = ({ reviews, orders, hasReview, fetchUserReviews }) => {
  // State for tab switching between "To Be Reviewed" and "History"
  const [selectedTab, setSelectedTab] = useState('toBeReviewed');

  // Pagination state for both tabs
  const [toBeReviewedPage, setToBeReviewedPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // State to toggle visibility of the review form for each order
  const [showReviewForm, setShowReviewForm] = useState({});

  // State to store selected ratings for each order
  const [ratings, setRatings] = useState({});

  // Define number of reviews to show per page
  const reviewsPerPage = 5;

  // Function to handle review form submission
  const handleReviewSubmit = async (orderId, rating, feedback) => {
    try {
      const token = localStorage.getItem('auth-token'); // Retrieve auth token
      const response = await fetch('http://localhost:5000/user/review', {
        method: 'POST',
        headers: { 'auth-token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchasedItemId: orderId, rating, feedback }),
      });
      const data = await response.json();

      if (data.success) {
        fetchUserReviews(); // Refresh the reviews list
        toggleReviewForm(orderId); // Close the form
        setRatings((prev) => ({ ...prev, [orderId]: undefined })); // Reset rating state
        toast.success('Review submitted successfully!'); // Show success message
      } else {
        toast(data.message); // Show error message
      }
    } catch (error) {
      console.error('Error submitting review:', error); // Log errors
    }
  };

  // Function to toggle the visibility of the review form for an order
  const toggleReviewForm = (orderId) => {
    setShowReviewForm((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Function to handle star click for rating selection
  const handleStarClick = (orderId, star) => {
    setRatings((prev) => ({
      ...prev,
      [orderId]: star,
    }));
  };

  // Filter out orders that have already been reviewed
  const toBeReviewed = orders.filter((order) => !hasReview(order._id));

  // Paginate to-be-reviewed orders
  const paginatedToBeReviewed = toBeReviewed.slice(
    (toBeReviewedPage - 1) * reviewsPerPage,
    toBeReviewedPage * reviewsPerPage
  );

  // Calculate total pages for to-be-reviewed
  const totalToBeReviewedPages = Math.ceil(toBeReviewed.length / reviewsPerPage);

  // Paginate review history
  const paginatedHistory = reviews.slice(
    (historyPage - 1) * reviewsPerPage,
    historyPage * reviewsPerPage
  );

  // Calculate total pages for history
  const totalHistoryPages = Math.ceil(reviews.length / reviewsPerPage);

  // Function to render pagination buttons
  const renderPaginationNumbers = (currentPage, totalPages, setPage) => {
    const maxVisiblePages = 8;
    const halfVisiblePages = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(currentPage - halfVisiblePages, 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    const pages = [];

    // Add previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          className="reviews-page-btn"
          onClick={() => setPage(currentPage - 1)}
        >
          ←
        </button>
      );
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`reviews-page-btn ${currentPage === i ? 'reviews-page-btn-active' : ''}`}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }

    // Add next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          className="reviews-page-btn"
          onClick={() => setPage(currentPage + 1)}
        >
          →
        </button>
      );
    }

    return pages;
  };

  // Format a given date into a readable string
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="review-container">
      {/* Title */}
      <h1>My Reviews</h1>

      {/* Tab Navigation */}
      <div className="reviews-tab-nav">
        <button
          className={`reviews-tab-btn ${selectedTab === 'toBeReviewed' ? 'reviews-tab-active' : ''}`}
          onClick={() => setSelectedTab('toBeReviewed')}
        >
          To Be Reviewed ({toBeReviewed.length})
        </button>
        <button
          className={`reviews-tab-btn ${selectedTab === 'history' ? 'reviews-tab-active' : ''}`}
          onClick={() => setSelectedTab('history')}
        >
          History ({reviews.length})
        </button>
      </div>

      {/* To Be Reviewed Section */}
      <div className={`reviews-tab-content reviews-to-be-reviewed ${selectedTab === 'toBeReviewed' ? 'reviews-tab-content-active' : ''}`}>
        {paginatedToBeReviewed.length > 0 ? (
          <>
            {/* List of orders to be reviewed */}
            <ul className="reviews-list">
              {paginatedToBeReviewed.map((order) => (
                <li key={order._id} className="reviews-item">
                  <div className="reviews-order-details">
                    <img src={order.product.image} alt={order.product.name} className="reviews-image" />
                    <div className="reviews-product-info">
                      <p className="reviews-purchased-on">Purchased on {formatDate(order.purchaseDate)}</p>
                      <p className="reviews-product-name">{order.product.name}</p>
                      <p className="reviews-size">Size: {order.size || 'N/A'}</p>
                    </div>
                    <button className="reviews-action-btn" onClick={() => toggleReviewForm(order._id)}>
                      {showReviewForm[order._id] ? 'Cancel' : 'Review'}
                    </button>
                  </div>

                  {/* Review Form Modal */}
                  {showReviewForm[order._id] && (
                    <>
                      <div className="reviews-modal-overlay" onClick={() => toggleReviewForm(order._id)} />
                      <div className="reviews-modal-content">
                        <div className="reviews-form-group">
                          <label className="reviews-form-label">Your product rating & review:</label>
                          <div className="reviews-rating-section">
                            <div className="reviews-star-rating">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`reviews-star ${ratings[order._id] >= star ? 'reviews-star-filled' : ''}`}
                                  onClick={() => handleStarClick(order._id, star)}
                                >
                                  ⭐
                                </span>
                              ))}
                            </div>
                            <span className="reviews-rating-label">
                              {ratings[order._id] || 0} {ratings[order._id] === 1 ? 'star' : 'stars'}
                            </span>
                          </div>
                          <textarea
                            id={`feedback-${order._id}`}
                            placeholder="Write your feedback here..."
                            className="reviews-feedback-input"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const rating = ratings[order._id] || 0;
                            const feedback = document.getElementById(`feedback-${order._id}`).value;
                            if (rating === 0) {
                              toast('Please select a rating!');
                              return;
                            }
                            handleReviewSubmit(order._id, rating, feedback);
                          }}
                          className="reviews-submit-btn"
                        >
                          Submit Review
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {/* Pagination for to-be-reviewed */}
            {totalToBeReviewedPages > 1 && (
              <div className="reviews-pagination">
                {renderPaginationNumbers(toBeReviewedPage, totalToBeReviewedPages, setToBeReviewedPage)}
              </div>
            )}
          </>
        ) : (
          // Message if there are no orders to review
          <p className="reviews-no-items">No orders available for review.</p>
        )}
      </div>

      {/* Review History Section */}
      <div className={`reviews-tab-content reviews-history ${selectedTab === 'history' ? 'reviews-tab-content-active' : ''}`}>
        {paginatedHistory.length > 0 ? (
          <>
            {/* List of submitted reviews */}
            <ul className="reviews-list">
              {paginatedHistory.map((review) => {
                const correspondingOrder = orders.find(order => order._id.toString() === review.purchasedItem.toString());
                return (
                  <li key={review._id} className="reviews-item">
                    <div className="reviews-order-details">
                      <img src={review.product.image} alt={review.product.name} className="reviews-image" />
                      <div className="reviews-product-info">
                        <p className="reviews-purchased-on">
                          Purchased on {correspondingOrder ? formatDate(correspondingOrder.purchaseDate) : 'Unknown Date'}
                        </p>
                        <p className="reviews-product-name">{review.product.name}</p>
                      </div>
                    </div>
                    <div className="reviews-feedback">
                      <div className="reviews-rating-section">
                        <p className="reviews-rating-display">{'⭐'.repeat(review.rating)}</p>
                        <span className="reviews-rating-label">
                          {review.rating} {review.rating === 1 ? 'star' : 'stars'}
                        </span>
                      </div>
                      <p className="reviews-feedback-text">Feedback: {review.feedback}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Pagination for review history */}
            {totalHistoryPages > 1 && (
              <div className="reviews-pagination">
                {renderPaginationNumbers(historyPage, totalHistoryPages, setHistoryPage)}
              </div>
            )}
          </>
        ) : (
          // Message if there are no submitted reviews
          <p className="reviews-no-items">No reviews submitted yet.</p>
        )}
      </div>
    </div>
  );
};

export default Reviews;
