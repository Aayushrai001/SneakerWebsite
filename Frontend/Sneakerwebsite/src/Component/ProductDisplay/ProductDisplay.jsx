import React, { useContext, useState, useEffect } from 'react';
import './ProductDisplay.css';
import star_icon from '../assets/star_icon.png';
import star_dull_icon from '../assets/star_dull_icon.png';
import khalti from '../assets/khalti.png';
import { ShopContext } from '../../Context/ShopContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProductDisplay = ({ product }) => {
  const { addtoCart, addtoFavourite, cartItems, favouriteItems } = useContext(ShopContext);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewsPerPage] = useState(5);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isLoggedIn = !!localStorage.getItem('auth-token');
  const navigate = useNavigate();

  useEffect(() => {
    if (product) {
      const sizesWithStock = product.sizes
        .filter(size => size.quantity > 0)
        .sort((a, b) => {
          const sizeA = isNaN(a.size) ? a.size : parseFloat(a.size);
          const sizeB = isNaN(b.size) ? b.size : parseFloat(b.size);
          if (typeof sizeA === 'number' && typeof sizeB === 'number') {
            return sizeA - sizeB;
          }
          return sizeA.localeCompare(sizeB);
        });
      setAvailableSizes(sizesWithStock);
      fetchReviews();
    }
  }, [product]);

  useEffect(() => {
    if (reviews.length > 0) {
      console.log('Current reviews:', reviews.map(r => ({
        id: r._id,
        rating: r.rating,
        feedback: r.feedback
      })));
    }
  }, [reviews]);

  const fetchReviews = async () => {
    try {
      const productId = product?._id;
      if (!productId) return;

      console.log('Fetching reviews for product:', productId);
      const response = await fetch(`http://localhost:5000/product/${productId}/reviews`);
      
      if (!response.ok) {
        console.error('Error response:', response.status, response.statusText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received reviews data:', data.reviews);
      
      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        console.error('API returned success: false:', data.message);
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const calculateOverallRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const validReviews = reviews.filter(review => typeof review.rating === 'number');
    if (validReviews.length === 0) return 0;
    const totalRating = validReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return (totalRating / validReviews.length).toFixed(1);
  };

  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const handleSizeChange = (event) => {
    setSelectedSize(event.target.value);
  };

  const handleQuantityChange = (event) => {
    if (!selectedSize) {
      alert('Please select a size first');
      return;
    }
    const newQuantity = Math.max(1, parseInt(event.target.value) || 1);
    const sizeData = product?.sizes.find(s => s.size === selectedSize);
    if (sizeData && newQuantity <= sizeData.quantity) {
      setQuantity(newQuantity);
    } else {
      alert(`Only ${sizeData.quantity} items available for size ${selectedSize}`);
    }
  };

  const increaseQuantity = () => {
    if (!selectedSize) {
      alert('Please select a size first');
      return;
    }
    setQuantity(prev => {
      const sizeData = product?.sizes.find(s => s.size === selectedSize);
      if (sizeData && prev + 1 <= sizeData.quantity) {
        return prev + 1;
      }
      alert(`Only ${sizeData.quantity} items available for size ${selectedSize}`);
      return prev;
    });
  };

  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handlePayment = async (paymentMethod) => {
    try {
      if (!selectedSize) {
        toast.error('Please select a size first');
        return;
      }

      if (!localStorage.getItem('auth-token')) {
        toast.error('Please login to continue');
        return;
      }

      const token = localStorage.getItem('auth-token');
      const cartItems = [
        {
          productId: product._id,
          size: selectedSize,
          quantity: quantity
        }
      ];
      const totalPrice = product.new_price * quantity;

      const response = await fetch('http://localhost:5000/initialize-khalti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token
        },
        body: JSON.stringify({
          cartItems,
          totalPrice,
          paymentMethod
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server returned a non-JSON response');
        }
        const data = await response.json();
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (paymentMethod === 'COD') {
        toast.success('Order placed successfully with Cash on Delivery');
        setShowCheckout(false);
        if (data.redirect_url) {
          navigate(data.redirect_url.replace('http://localhost:5173', ''));
        } else if (data.transaction_id) {
          navigate(`/payment-success?transaction_id=${data.transaction_id}`);
        } else {
          toast.error('Missing redirect URL for COD success page');
        }
        // Clear the cart
        await fetch('http://localhost:5000/clearcart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': localStorage.getItem('auth-token'),
          },
        });
        return;
      }

      if (paymentMethod === 'khalti' && data.payment?.payment_url) {
        window.location.href = data.payment.payment_url;
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment');
    }
  };

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      toast.error('Please log in to add items to your cart');
      return;
    }
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    const sizeData = product?.sizes.find(s => s.size === selectedSize);
    if (!sizeData || sizeData.quantity < quantity) {
      alert(`Only ${sizeData?.quantity || 0} items available for size ${selectedSize}`);
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addtoCart(product.id, selectedSize);
    }
    setQuantity(1);
    setSelectedSize('');
  };

  const handleAddToFavourite = () => {
    if (!isLoggedIn) {
      toast.error('Please log in to add items to your favorites');
      return;
    }
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    addtoFavourite(product.id, selectedSize);
    setQuantity(1);
    setSelectedSize('');
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const cartQuantity = cartItems[product?.id]?.quantity || 0;
  const favouriteQuantity = favouriteItems[product?.id]?.quantity || 0;

  if (!product) {
    return <div>Loading product...</div>;
  }

  return (
    <div className="productdisplay">
      <div className="productdisplay-container">
        <div className="productdisplay-left">
          <div className="productdisplay-img">
            <img
              src={product.image}
              alt={product.name || 'Product'}
              className="productdisplay-main-img"
              onError={(e) => {
                e.target.src = 'http://localhost:5000/images/placeholder.jpg';
              }}
            />
          </div>
        </div>

        <div className="productdisplay-right">
          <h1>{product.name}</h1>
          <div className="overall-rating-container">
            <div className="rating-number">
              <span className="big-rating">{calculateOverallRating()}</span>
              <span className="max-rating">/5</span>
            </div>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <img
                  key={star}
                  src={star <= calculateOverallRating() ? star_icon : star_dull_icon}
                  alt="star"
                  className="star-icon"
                />
              ))}
              <span className="review-count">({reviews.length} reviews)</span>
            </div>
          </div>
          <div className="productdisplay-right-prices">
            <div className="productdisplay-right-price-new">Rs.{product.new_price}</div>
          </div>
          <div className="productdisplay-right-description">{product.description}</div>
          <div className="productdisplay-right-category">
            <p><span>Category:</span> {product.category}</p>
            <p><span>Brand:</span> {product.brand}</p>
          </div>
          <div className="productdisplay-right-size">
            <h1>Select Size</h1>
            <select
              value={selectedSize}
              onChange={handleSizeChange}
              className="productdisplay-right-size-select"
            >
              <option value="">Select a size</option>
              {availableSizes.map(size => (
                <option key={size.size} value={size.size}>
                  {size.size}
                </option>
              ))}
            </select>
          </div>
          <div className="productdisplay-right-quantity">
            <h1>Quantity</h1>
            <div className="productdisplay-right-quantity-container">
              <button className="quantity-btn" onClick={decreaseQuantity}>-</button>
              <input
                type="number"
                className="quantity-input"
                value={quantity}
                min="1"
                onChange={handleQuantityChange}
              />
              <button className="quantity-btn" onClick={increaseQuantity}>+</button>
            </div>
          </div>
          <div className="productdisplay-right-buttons">
            <button className="productdisplay-right-cart" onClick={handleAddToCart}>
              ADD TO CART {cartQuantity > 0 && `(${cartQuantity})`}
            </button>
            <button className="productdisplay-right-favorite" onClick={handleAddToFavourite}>
              ADD TO FAVORITE {favouriteQuantity > 0 && `(${favouriteQuantity})`}
            </button>
          </div>
          <button className="checkout" onClick={() => setShowCheckout(true)}>CHECKOUT</button>

          {showCheckout && (
            <>
              <div className="modal-overlay" onClick={() => setShowCheckout(false)} />
              <div className="checkout-container">
                <i className="fas fa-times checkout-close" onClick={() => setShowCheckout(false)} />
                <h2>Checkout</h2>
                
                {!selectedSize && (
                  <div className="checkout-warning">
                    Please select a size before proceeding with payment
                  </div>
                )}
                
                <div className="checkout-info">
                  <h3>Product:</h3>
                  <p>{product.name}</p>
                </div>
                <div className="checkout-info">
                  <h3>Size:</h3>
                  <p>{selectedSize || 'Not selected'}</p>
                </div>
                <div className="checkout-info">
                  <h3>Quantity:</h3>
                  <p>{quantity}</p>
                </div>
                <div className="checkout-info total">
                  <h3>Total Amount:</h3>
                  <p>Rs. {product.new_price * quantity}</p>
                </div>
                
                <div className="payment-options">
                  <h3>Select Payment Method</h3>
                  <div className="payment-buttons">
                    <button
                      className={`payment-button ${selectedPaymentMethod === 'khalti' ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPaymentMethod('khalti');
                        if (isLoggedIn && selectedSize) {
                          handlePayment('khalti');
                        } else if (!isLoggedIn) {
                          navigate('/login');
                        } else {
                          toast.error('Please select a size');
                        }
                      }}
                    >
                      <img src={khalti} alt="Khalti" />
                      Pay with Khalti
                    </button>
                    <button
                      className={`payment-button ${selectedPaymentMethod === 'COD' ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPaymentMethod('COD');
                        if (isLoggedIn && selectedSize) {
                          setShowConfirmation(true);
                        } else if (!isLoggedIn) {
                          navigate('/login');
                        } else {
                          toast.error('Please select a size');
                        }
                      }}
                    >
                      <i className="fas fa-money-bill-wave"></i>
                      Cash on Delivery
                    </button>
                  </div>
                </div>
                
                <div className="checkout-actions">
                  {!isLoggedIn ? (
                    <div className="login-warning">
                      <p>Please log in to proceed with payment</p>
                      <button onClick={() => navigate('/login')}>Log In</button>
                    </div>
                  ) : !selectedSize ? (
                    <div className="size-warning">
                      <p>Please select a size before proceeding with payment</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}

          {showConfirmation && (
            <>
              <div className="modal-overlay" onClick={() => setShowConfirmation(false)} />
              <div className="confirmation-modal">
                <h3>Confirm Your Order</h3>
                <p>Are you sure you want to place this order with Cash on Delivery?</p>
                <div className="order-summary">
                  <p><strong>Product:</strong> {product.name}</p>
                  <p><strong>Size:</strong> {selectedSize}</p>
                  <p><strong>Quantity:</strong> {quantity}</p>
                  <p><strong>Total Amount:</strong> Rs. {product.new_price * quantity}</p>
                </div>
                <div className="confirmation-actions">
                  <button className="confirm-btn" onClick={() => handlePayment('COD')}>
                    Confirm Order
                  </button>
                  <button 
                    className="cancel-confirm-btn" 
                    onClick={() => setShowConfirmation(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="reviews-section">
        <h2>Customer Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet.</p>
        ) : (
          <>
            <div className="reviews-list">
              {currentReviews.map(review => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <div className="review-user-info">
                      <span className="review-username">
                        {review.user?.name || 'Anonymous'}
                      </span>
                      <div className="review-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <img
                            key={star}
                            src={star <= (review.rating || 0) ? star_icon : star_dull_icon}
                            alt={`${star} star`}
                            className="star-icon"
                          />
                        ))}
                        <span className="rating-value">({review.rating || 0}/5)</span>
                      </div>
                    </div>
                    <span className="review-date">
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="review-content">
                    <p className="review-feedback">{review.feedback}</p>
                    {review.adminFeedback && (
                      <div className="admin-feedback">
                        <div className="admin-feedback-header">
                          <span className="admin-label">
                            <i className="fas fa-shield-alt"></i> Sneaker.Np Response
                          </span>
                          <span className="admin-response-date">
                            {review.adminFeedbackDate ? 
                              new Date(review.adminFeedbackDate).toLocaleDateString() : 
                              new Date().toLocaleDateString()}
                          </span>
                        </div>
                        <p className="admin-feedback-text">{review.adminFeedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="pagination">
              <button 
                className="pagination-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="pagination-button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDisplay;