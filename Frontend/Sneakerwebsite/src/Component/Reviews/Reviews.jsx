import React, { useState, useEffect } from 'react';
import './Reviews.css';

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
        alert('Review submitted successfully!');
      } else {
        alert(data.message);
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
        className={`page-number ${currentPage === i + 1 ? 'active' : ''}`}
        onClick={() => setPage(i + 1)}
      >
        {i + 1}
      </button>
    ));
  };

  return (
    <div className="reviews">
      <div className="tabs">
        <button
          className={`tab ${selectedTab === 'toBeReviewed' ? 'active' : ''}`}
          onClick={() => setSelectedTab('toBeReviewed')}
        >
          To Be Reviewed ({toBeReviewed.length})
        </button>
        <button
          className={`tab ${selectedTab === 'history' ? 'active' : ''}`}
          onClick={() => setSelectedTab('history')}
        >
          History ({reviews.length})
        </button>
      </div>

      <div className={`panel to-be-reviewed ${selectedTab === 'toBeReviewed' ? 'active' : ''}`}>
        {paginatedToBeReviewed.length > 0 ? (
          <>
            <ul>
              {paginatedToBeReviewed.map((order) => (
                <li key={order._id}>
                  <div className="order-info">
                    <img src={order.product.image} alt={order.product.name} className="review-image" />
                    <div className="details">
                      <p className="purchased-on">Purchased on</p>
                      <p className="product-name">{order.product.name}</p>
                      <p className="size">Size: {order.size || 'N/A'}</p>
                    </div>
                    <button className="toggle-review-button" onClick={() => toggleReviewForm(order._id)}>
                      {showReviewForm[order._id] ? 'Cancel' : 'Review'}
                    </button>
                  </div>

                  {showReviewForm[order._id] && (
                    <>
                      <div className="review-modal-overlay" onClick={() => toggleReviewForm(order._id)} />
                      <div className="review-modal">
                        <div className="form-group">
                          <label>Your product rating & review:</label>
                          <div className="rating-container">
                            <div className="rating-input">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`star ${ratings[order._id] >= star ? 'filled' : ''}`}
                                  onClick={() => handleStarClick(order._id, star)}
                                >
                                  ⭐
                                </span>
                              ))}
                            </div>
                            <span className="rating-text">
                              {ratings[order._id] || 0} {ratings[order._id] === 1 ? 'star' : 'stars'}
                            </span>
                          </div>
                          <textarea
                            id={`feedback-${order._id}`}
                            placeholder="Write your feedback here..."
                            className="feedback-textarea"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const rating = ratings[order._id] || 0;
                            const feedback = document.getElementById(`feedback-${order._id}`).value;
                            if (rating === 0) {
                              alert('Please select a rating!');
                              return;
                            }
                            handleReviewSubmit(order._id, rating, feedback);
                          }}
                          className="submit-button"
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
              <div className="pagination">
                {renderPaginationNumbers(toBeReviewedPage, totalToBeReviewedPages, setToBeReviewedPage)}
              </div>
            )}
          </>
        ) : (
          <p className="no-items">No orders available for review.</p>
        )}
      </div>

      <div className={`panel history ${selectedTab === 'history' ? 'active' : ''}`}>
        {paginatedHistory.length > 0 ? (
          <>
            <ul>
              {paginatedHistory.map((review) => (
                <li key={review._id}>
                  <div className="order-info">
                    <img src={review.product.image} alt={review.product.name} className="review-image" />
                    <div className="details">
                      <p className="purchased-on">Purchased on</p>
                      <p className="product-name">{review.product.name}</p>
                      <p className="size">Size: {review.size || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="review-details">
                    <div className="rating-container">
                      <p className="rating-display">{'⭐'.repeat(review.rating)}</p>
                      <span className="rating-text">
                        {review.rating} {review.rating === 1 ? 'star' : 'stars'}
                      </span>
                    </div>
                    <p>Feedback: {review.feedback}</p>
                  </div>
                </li>
              ))}
            </ul>
            {totalHistoryPages > 1 && (
              <div className="pagination">
                {renderPaginationNumbers(historyPage, totalHistoryPages, setHistoryPage)}
              </div>
            )}
          </>
        ) : (
          <p className="no-items">No reviews submitted yet.</p>
        )}
      </div>
    </div>
  );
};

export default Reviews;
