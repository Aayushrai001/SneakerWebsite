import React, { useState, useEffect } from 'react';
import './ReviewsFeedback.css';

const ReviewsFeedback = () => {
  const [reviews, setReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editedStatus, setEditedStatus] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('http://localhost:5000/admin/reviews');
        const data = await response.json();
        if (data.success) {
          setReviews(data.reviews);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    fetchReviews();
  }, []);

  const handleEdit = (review) => {
    setEditingReviewId(review._id);
    setEditedStatus(review.status);
  };

  const handleSaveEdit = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/admin/review/status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: editedStatus })
      });
      const data = await response.json();
      if (data.success) {
        setReviews(reviews.map(review => 
          review._id === id ? { ...review, status: editedStatus } : review
        ));
        setEditingReviewId(null);
      }
    } catch (error) {
      console.error('Error saving edited review:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
  };

  return (
    <div className="reviews-container">
      <h2>Admin Product Reviews & Feedback Approval</h2>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Product</th>
            <th>Image</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review._id}>
              <td>{review.user.name}</td>
              <td>{review.product.name}</td>
              <td>
                <img
                  src={review.product.image}
                  alt={review.product.name}
                  style={{ width: '50px' }}
                />
              </td>
              <td>{'⭐'.repeat(review.rating)}</td>
              <td>{review.feedback}</td>
              <td>
                {editingReviewId === review._id ? (
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Deleted">Deleted</option>
                  </select>
                ) : (
                  review.status
                )}
              </td>
              <td>
                {editingReviewId === review._id ? (
                  <>
                    <button
                      className="save-btn"
                      onClick={() => handleSaveEdit(review._id)}
                    >
                      Save
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                      style={{ marginLeft: '10px' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(review)}
                      style={{ marginLeft: '10px' }}
                    >
                      Edit
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewsFeedback;
