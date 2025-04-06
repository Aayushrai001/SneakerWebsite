import React, { useState } from 'react';
import './Reviews.css';

const Reviews = ({ reviews, productId }) => {
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [showMore, setShowMore] = useState(true);

  console.log('Reviews received in Reviews component:', reviews); // Debug log
  console.log('ProductId in Reviews component:', productId); // Debug log

  const toggleReviews = () => {
    if (showMore) {
      setVisibleReviews((prev) => prev + 2);
    } else {
      setVisibleReviews(3);
    }
    setShowMore(!showMore);
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className='Reviews'>
        <div className="Reviews-navigator">
          <div className="Reviews-nav-fade">Reviews (0)</div>
        </div>
        <p>No reviews yet for this product.</p>
      </div>
    );
  }

  return (
    <div className='Reviews'>
      <div className="Reviews-navigator">
        <div className="Reviews-nav-fade">Reviews ({reviews.length})</div>
      </div>
      <div className="Users-Reviews">
        {reviews.slice(0, visibleReviews).map((review) => (
          <div key={review._id} className="User-Review">
            <div className="User-Review-header">
              <span className="User-Review-user">{review.user?.name || 'Anonymous'}</span>
              <span className="User-Review-rating">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`star ${i < review.rating ? '' : 'empty'}`}>
                    {i < review.rating ? '★' : '☆'}
                  </span>
                ))}
              </span>
            </div>
            <p className="User-Review-text">{review.feedback || 'No feedback provided'}</p>
          </div>
        ))}
      </div>
      {reviews.length > 3 && (
        <div className="See-More-Container">
          <button className="See-More-Button" onClick={toggleReviews}>
            {showMore ? 'See More Reviews' : 'Show Less Reviews'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Reviews;