import React, { useState, useEffect } from 'react';
import './Reviews.css';
import { toast } from 'react-hot-toast';

const Reviews = ({ reviews, orders, hasReview, fetchUserReviews }) => {
  const [selectedTab, setSelectedTab] = useState('toBeReviewed');
  const [toBeReviewedPage, setToBeReviewedPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState({});
  const [ratings, setRatings] = useState({});
  const reviewsPerPage = 5;

  const handleReviewSubmit = async (orderId, rating, feedback) => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('http://localhost:5000/user/review', {
        method: 'POST',
        headers: { 'auth-token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchasedItemId: orderId, rating, feedback }),
      });
      const data = await response.json();
      if (data.success) {
        fetchUserReviews();
        toggleReviewForm(orderId);
        setRatings((prev) => ({ ...prev, [orderId]: undefined }));
        toast.success('Review submitted successfully!');
      } else {
        toast(data.message);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const toggleReviewForm = (orderId) => {
    setShowReviewForm((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleStarClick = (orderId, star) => {
    setRatings((prev) => ({
      ...prev,
      [orderId]: star,
    }));
  };

  const toBeReviewed = orders.filter((order) => !hasReview(order._id));
  const paginatedToBeReviewed = toBeReviewed.slice(
    (toBeReviewedPage - 1) * reviewsPerPage,
    toBeReviewedPage * reviewsPerPage
  );
  const totalToBeReviewedPages = Math.ceil(toBeReviewed.length / reviewsPerPage);

  const paginatedHistory = reviews.slice(
    (historyPage - 1) * reviewsPerPage,
    historyPage * reviewsPerPage
  );
  const totalHistoryPages = Math.ceil(reviews.length / reviewsPerPage);

  const renderPaginationNumbers = (currentPage, totalPages, setPage) => {
    return Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i + 1}
        className={`reviews-page-btn ${currentPage === i + 1 ? 'reviews-page-btn-active' : ''}`}
        onClick={() => setPage(i + 1)}
      >
        {i + 1}
      </button>
    ));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="review-container">
      <h1>My Reviews</h1>
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

      <div className={`reviews-tab-content reviews-to-be-reviewed ${selectedTab === 'toBeReviewed' ? 'reviews-tab-content-active' : ''}`}>
        {paginatedToBeReviewed.length > 0 ? (
          <>
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
            {totalToBeReviewedPages > 1 && (
              <div className="reviews-pagination">
                {renderPaginationNumbers(toBeReviewedPage, totalToBeReviewedPages, setToBeReviewedPage)}
              </div>
            )}
          </>
        ) : (
          <p className="reviews-no-items">No orders available for review.</p>
        )}
      </div>

      <div className={`reviews-tab-content reviews-history ${selectedTab === 'history' ? 'reviews-tab-content-active' : ''}`}>
        {paginatedHistory.length > 0 ? (
          <>
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
            {totalHistoryPages > 1 && (
              <div className="reviews-pagination">
                {renderPaginationNumbers(historyPage, totalHistoryPages, setHistoryPage)}
              </div>
            )}
          </>
        ) : (
          <p className="reviews-no-items">No reviews submitted yet.</p>
        )}
      </div>
    </div>
  );
};

export default Reviews;