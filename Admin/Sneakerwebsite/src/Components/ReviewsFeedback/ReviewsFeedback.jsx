import React, { useState } from 'react';
import './ReviewsFeedback.css';

const initialReviews = [
  {
    id: 1,
    productName: 'Wireless Headphones',
    user: 'John Doe',
    rating: 4,
    comment: 'Great sound quality!'
  },
  {
    id: 2,
    productName: 'Smart Watch',
    user: 'Jane Smith',
    rating: 5,
    comment: 'Very useful and stylish.'
  }
];

const ReviewsFeedback = () => {
  const [reviews, setReviews] = useState(initialReviews);
  const [newReview, setNewReview] = useState({ productName: '', user: '', rating: '', comment: '' });

  const handleChange = (e) => {
    setNewReview({ ...newReview, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newReview.productName && newReview.user && newReview.rating && newReview.comment) {
      setReviews([...reviews, { ...newReview, id: reviews.length + 1, rating: Number(newReview.rating) }]);
      setNewReview({ productName: '', user: '', rating: '', comment: '' });
    }
  };

  const handleDelete = (id) => {
    setReviews(reviews.filter(review => review.id !== id));
  };

  return (
    <div className="reviews-container">
      <h2>Product Reviews & Feedback</h2>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>User</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id}>
              <td>{review.productName}</td>
              <td>{review.user}</td>
              <td>{'⭐'.repeat(review.rating)}</td>
              <td>{review.comment}</td>
              <td>
                <button className="delete-btn" onClick={() => handleDelete(review.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewsFeedback;
