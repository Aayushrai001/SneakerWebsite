import React, { useState } from 'react';
import './Reviews.css';


const Reviews = () => {
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [showMore, setShowMore] = useState(true);

  const toggleReviews = () => {
    if (showMore) {
      setVisibleReviews((prev) => prev + 2);
    } else {
      setVisibleReviews(3);
    }
    setShowMore(!showMore);
  };

  return (
    <div className='Reviews'>
      <div className="Reviews-navigator">
        <div className="Reviews-nav-fade">Reviews (122)</div>
      </div>
      <div className="Users-Reviews">
        {reviewsData.slice(0, visibleReviews).map((review) => (
          <div key={review.id} className="User-Review">
            <div className="User-Review-header">
              <span className="User-Review-user">{review.user}</span>
              <span className="User-Review-rating">
                {[...Array(review.rating)].map((_, i) => (
                  <span key={i} className="star">&#9733;</span>
                ))}
                {[...Array(5 - review.rating)].map((_, i) => (
                  <span key={i} className="star empty">&#9734;</span>
                ))}
              </span>
            </div>
            <p className="User-Review-text">{review.review}</p>
          </div>
        ))}
      </div>
      <div className="See-More-Container">
        <button className="See-More-Button" onClick={toggleReviews}>
          {showMore ? 'See More Reviews' : 'Show Less Reviews'}
        </button>
      </div>
    </div>
  );
};

export default Reviews;
