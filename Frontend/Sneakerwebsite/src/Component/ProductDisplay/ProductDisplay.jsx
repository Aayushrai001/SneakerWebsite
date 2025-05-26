import React, { useContext, useState, useEffect } from 'react';
import './ProductDisplay.css';
import star_icon from '../assets/star_icon.png';
import star_dull_icon from '../assets/star_dull_icon.png';
import khalti from '../assets/khalti.png';
import { ShopContext } from '../../Context/ShopContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Defining the ProductDisplay functional component that accepts a product prop
const ProductDisplay = ({ product }) => {
  // Accessing context methods and state for cart, favorites, and product refreshing
  const { addtoCart, addtoFavourite, cartItems, favouriteItems, refreshProduct } = useContext(ShopContext);
  // State to control the visibility of the checkout modal
  const [showCheckout, setShowCheckout] = useState(false);
  // State to store the selected size of the product
  const [selectedSize, setSelectedSize] = useState('');
  // State to manage the quantity of the product to add to cart or favorites
  const [quantity, setQuantity] = useState(1);
  // State to store the product reviews fetched from the server
  const [reviews, setReviews] = useState([]);
  // State to manage the current page for review pagination
  const [currentPage, setCurrentPage] = useState(1);
  // Constant defining the number of reviews to display per page
  const [reviewsPerPage] = useState(5);
  // State to store available sizes with stock for the product
  const [availableSizes, setAvailableSizes] = useState([]);
  // State to store the selected payment method (e.g., Khalti or COD)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  // State to control the visibility of the order confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Checking if the user is logged in by verifying the presence of an auth token in localStorage
  const isLoggedIn = !!localStorage.getItem('auth-token');
  // Initializing navigate hook for redirecting users to different routes
  const navigate = useNavigate();

  // Function to check if all sizes of the product are out of stock
  const isAllSizesOutOfStock = () => {
    // Return false if product or sizes are not available
    if (!product || !product.sizes) return false;
    // Check if every size has zero quantity
    return product.sizes.every(size => size.quantity === 0);
  };

  // useEffect hook to handle initial setup and polling for product updates
  useEffect(() => {
    // Check if product exists
    if (product) {
      // Update available sizes based on stock
      updateAvailableSizes();
      // Fetch product reviews
      fetchReviews();
      // Set up polling to refresh product data every 15 seconds
      const pollInterval = setInterval(async () => {
        try {
          if (product) {
            // Refresh product data using context method
            await refreshProduct(product.id);
          }
        } catch (error) {
          // Log error if refreshing fails
          console.error('Error refreshing product:', error);
        }
      }, 15000); 

      // Cleanup function to clear the polling interval when component unmounts
      return () => clearInterval(pollInterval);
    }
  }, [product?.id]); // Dependency: runs when product.id changes

  // useEffect hook to update available sizes when product.sizes changes
  useEffect(() => {
    if (product) {
      // Update available sizes based on the latest product sizes
      updateAvailableSizes();
    }
  }, [product?.sizes]); // Dependency: runs when product.sizes changes

  // Function to update the available sizes list based on stock
  const updateAvailableSizes = () => {
    // Return if product is not available
    if (!product) return;
    
    // Filter sizes with quantity > 0 and sort them
    const sizesWithStock = product.sizes
      .filter(size => size.quantity > 0)
      .sort((a, b) => {
        // Convert sizes to numbers if possible, otherwise treat as strings
        const sizeA = isNaN(a.size) ? a.size : parseFloat(a.size);
        const sizeB = isNaN(b.size) ? b.size : parseFloat(b.size);
        // Sort numerically if both are numbers, otherwise alphabetically
        if (typeof sizeA === 'number' && typeof sizeB === 'number') {
          return sizeA - sizeB;
        }
        return sizeA.localeCompare(sizeB);
      });
    
    // Update available sizes state
    setAvailableSizes(sizesWithStock);
    
    // Reset selected size and quantity if the selected size is no longer available
    if (selectedSize && !sizesWithStock.find(s => s.size === selectedSize)) {
      setSelectedSize('');
      setQuantity(1);
    }
  };

  // useEffect hook to log current reviews for debugging purposes
  useEffect(() => {
    if (reviews.length > 0) {
      console.log('Current reviews:', reviews.map(r => ({
        id: r._id,
        rating: r.rating,
        feedback: r.feedback
      })));
    }
  }, [reviews]); // Dependency: runs when reviews change

  // Function to fetch product reviews from the server
  const fetchReviews = async () => {
    try {
      // Get product ID
      const productId = product?._id;
      if (!productId) return;

      // Log the fetch attempt
      console.log('Fetching reviews for product:', productId);
      // Make API call to fetch reviews
      const response = await fetch(`http://localhost:5000/product/${productId}/reviews`);
      
      // Check if response is successful
      if (!response.ok) {
        console.error('Error response:', response.status, response.statusText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Parse response data
      const data = await response.json();
      console.log('Received reviews data:', data.reviews);
      
      // Update reviews state if API call is successful
      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        console.error('API returned success: false:', data.message);
        setReviews([]);
      }
    } catch (error) {
      // Log and handle errors by setting reviews to empty array
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  // Function to calculate the overall rating based on reviews
  const calculateOverallRating = () => {
    // Return 0 if no reviews are available
    if (!reviews || reviews.length === 0) return 0;
    // Filter valid reviews with numeric ratings
    const validReviews = reviews.filter(review => typeof review.rating === 'number');
    // Return 0 if no valid reviews
    if (validReviews.length === 0) return 0;
    // Calculate average rating
    const totalRating = validReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return (totalRating / validReviews.length).toFixed(1);
  };

  // Pagination calculations for reviews
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  // Handler for size selection change
  const handleSizeChange = (event) => {
    // Update selected size and reset quantity
    setSelectedSize(event.target.value);
    setQuantity(1);
  };

  // Handler for quantity input change
  const handleQuantityChange = (event) => {
    // Ensure a size is selected before changing quantity
    if (!selectedSize) {
      toast.error('Please select a size first');
      return;
    }
    // Parse and ensure quantity is at least 1
    const newQuantity = Math.max(1, parseInt(event.target.value) || 1);
    // Find size data for the selected size
    const sizeData = product?.sizes.find(s => s.size === selectedSize);
    // Check if requested quantity is available
    if (sizeData && newQuantity <= sizeData.quantity) {
      setQuantity(newQuantity);
    } else if (sizeData) {
      // Show error if quantity exceeds available stock
      toast.error(`Only ${sizeData.quantity} items available for size ${selectedSize}`);
      setQuantity(sizeData.quantity);
    }
  };

  // Handler to increase quantity
  const increaseQuantity = () => {
    // Ensure a size is selected
    if (!selectedSize) {
      toast.error('Please select a size first');
      return;
    }
    // Find size data for the selected size
    const sizeData = product?.sizes.find(s => s.size === selectedSize);
    // Increase quantity if within stock limits
    if (sizeData && quantity + 1 <= sizeData.quantity) {
      setQuantity(quantity + 1);
    } else if (sizeData) {
      // Show error if quantity exceeds available stock
      toast.error(`Only ${sizeData.quantity} items available for size ${selectedSize}`);
    }
  };

  // Handler to decrease quantity
  const decreaseQuantity = () => {
    // Decrease quantity but ensure it doesn't go below 1
    setQuantity(prev => Math.max(1, prev - 1));
  };

  // Handler for processing payments (Khalti or COD)
  const handlePayment = async (paymentMethod) => {
    try {
      // Ensure a size is selected
      if (!selectedSize) {
        toast.error('Please select a size first');
        return;
      }

      // Ensure user is logged in
      if (!localStorage.getItem('auth-token')) {
        toast.error('Please login to continue');
        return;
      }

      // Get auth token and prepare cart items for payment
      const token = localStorage.getItem('auth-token');
      const cartItems = [
        {
          productId: product._id,
          size: selectedSize,
          quantity: quantity
        }
      ];
      const totalPrice = product.new_price * quantity;

      // Make API call to initialize payment
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

      // Check if response is successful
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

      // Parse response data
      const data = await response.json();

      // Handle Cash on Delivery (COD) payment
      if (paymentMethod === 'COD') {
        setShowCheckout(false);
        // Navigate to redirect URL or payment success page
        if (data.redirect_url) {
          navigate(data.redirect_url.replace('http://localhost:5173', ''));
        } else if (data.transaction_id) {
          navigate(`/payment-success?transaction_id=${data.transaction_id}`);
        } else {
          toast.error('Missing redirect URL for COD success page');
        }
        // Clear cart after successful COD order
        await fetch('http://localhost:5000/clearcart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': localStorage.getItem('auth-token'),
          },
        });
        return;
      }

      // Handle Khalti payment by redirecting to payment URL
      if (paymentMethod === 'khalti' && data.payment?.payment_url) {
        window.location.href = data.payment.payment_url;
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error) {
      // Handle and display payment errors
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment');
    }
  };

  // Handler for adding items to the cart
  const handleAddToCart = () => {
    // Ensure user is logged in
    if (!isLoggedIn) {
      toast.error('Please log in to add items to your cart');
      return;
    }
    
    // Ensure a size is selected
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    // Check stock availability for the selected size
    const sizeData = product?.sizes.find(s => s.size === selectedSize);
    if (!sizeData || sizeData.quantity < quantity) {
      toast.error(`Only ${sizeData?.quantity || 0} items available for size ${selectedSize}`);
      return;
    }

    try {
      // Add the product to cart for each quantity unit
      for (let i = 0; i < quantity; i++) {
        addtoCart(product.id, selectedSize);
      }
      
      // Show success message and reset size and quantity
      toast.success('Added to cart successfully!');
      setQuantity(1);
      setSelectedSize('');
    } catch (error) {
      // Handle and display errors
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  // Handler for adding items to favorites
  const handleAddToFavourite = () => {
    // Ensure user is logged in
    if (!isLoggedIn) {
      toast.error('Please log in to add items to your favorites');
      return;
    }
    
    // Ensure a size is selected
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    // Check stock availability for the selected size
    const sizeData = product?.sizes.find(s => s.size === selectedSize);
    if (!sizeData || sizeData.quantity < quantity) {
      toast.error(`Only ${sizeData?.quantity || 0} items available for size ${selectedSize}`);
      return;
    }

    try {
      // Add the product to favorites for each quantity unit
      for (let i = 0; i < quantity; i++) {
        addtoFavourite(product.id, selectedSize);
      }
      
      // Show success message and reset size and quantity
      toast.success('Added to favorites successfully!');
      setQuantity(1);
      setSelectedSize('');
    } catch (error) {
      // Handle and display errors
      console.error('Error adding to favorites:', error);
      toast.error('Failed to add to favorites. Please try again.');
    }
  };

  // Calculate average rating for display
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Get current cart and favorite quantities for the product
  const cartQuantity = cartItems[product?.id]?.quantity || 0;
  const favouriteQuantity = favouriteItems[product?.id]?.quantity || 0;

  // Render loading state if product is not available
  if (!product) {
    return <div>Loading product...</div>;
  }

  // Main render block for the component
  return (
    // Container for the entire product display
    <div className="productdisplay">
      {/* Container for product image and details */}
      <div className="productdisplay-container">
        {/* Left section for product image */}
        <div className="productdisplay-left">
          <div className="productdisplay-img">
            {/* Main product image with fallback for error */}
            <img
              src={product.image}
              alt={product.name || 'Product'}
              className="productdisplay-main-img"
              onError={(e) => {
                // Fallback to placeholder image if main image fails to load
                e.target.src = 'http://localhost:5000/images/placeholder.jpg';
              }}
            />
          </div>
        </div>

        {/* Right section for product details and actions */}
        <div className="productdisplay-right">
          {/* Product name */}
          <h1>{product.name}</h1>
          {/* Container for overall rating display */}
          <div className="overall-rating-container">
            {/* Display numeric rating */}
            <div className="rating-number">
              <span className="big-rating">{calculateOverallRating()}</span>
              <span className="max-rating">/5</span>
            </div>
            {/* Display star rating */}
            <div className="rating-stars">
              {/* Map over 5 stars and show filled or empty stars based on rating */}
              {[1, 2, 3, 4, 5].map((star) => (
                <img
                  key={star}
                  src={star <= calculateOverallRating() ? star_icon : star_dull_icon}
                  alt="star"
                  className="star-icon"
                />
              ))}
              {/* Show number of reviews */}
              <span className="review-count">({reviews.length} reviews)</span>
            </div>
          </div>
          {/* Display product price */}
          <div className="productdisplay-right-prices">
            <div className="productdisplay-right-price-new">Rs.{product.new_price}</div>
          </div>
          {/* Display product description */}
          <div className="productdisplay-right-description">{product.description}</div>
          {/* Display product category and brand */}
          <div className="productdisplay-right-category">
            <p><span>Category:</span> {product.category}</p>
            <p><span>Brand:</span> {product.brand}</p>
          </div>
          {/* Size selection dropdown */}
          <div className="productdisplay-right-size">
            <h1>Select Size</h1>
            {availableSizes.length > 0 ? (
              // Show dropdown if sizes are available
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
            ) : (
              // Show message if no sizes are available
              <div className="no-size-available">
                <i className="fas fa-exclamation-circle"></i>
                No sizes available
              </div>
            )}
          </div>
          {/* Quantity selection controls */}
          <div className="productdisplay-right-quantity">
            <h1>Quantity</h1>
            <div className="productdisplay-right-quantity-container">
              {/* Decrease quantity button */}
              <button className="quantity-btn" onClick={decreaseQuantity}>-</button>
              {/* Quantity input field */}
              <input
                type="number"
                className="quantity-input"
                value={quantity}
                min="1"
                onChange={handleQuantityChange}
              />
              {/* Increase quantity button */}
              <button className="quantity-btn" onClick={increaseQuantity}>+</button>
            </div>
            {/* Show out-of-stock warning if all sizes are unavailable */}
            {isAllSizesOutOfStock() ? (
              <div className="out-of-stock-warning">
                <i className="fas fa-exclamation-circle"></i>
                Product is out of stock
              </div>
            ) : selectedSize && product?.sizes.find(s => s.size === selectedSize)?.quantity < 5 && (
              // Show low stock warning if selected size has less than 5 items
              <div className="low-stock-warning">
                <i className="fas fa-exclamation-triangle"></i>
                Low in Stock! Only {product.sizes.find(s => s.size === selectedSize).quantity} items left
              </div>
            )}
          </div>
          {/* Buttons for adding to cart and favorites */}
          <div className="productdisplay-right-buttons">
            {/* Add to cart button with cart quantity indicator */}
            <button className="productdisplay-right-cart" onClick={handleAddToCart}>
              ADD TO CART {cartQuantity > 0 && `(${cartQuantity})`}
            </button>
            {/* Add to favorites button with favorite quantity indicator */}
            <button 
              className={`productdisplay-right-favorite ${favouriteQuantity > 0 ? 'active' : ''}`} 
              onClick={handleAddToFavourite}
            >
              {favouriteQuantity > 0 ? 'IN FAVORITES' : 'ADD TO FAVORITES'} 
              {favouriteQuantity > 0 && `(${favouriteQuantity})`}
            </button>
          </div>
          {/* Checkout button to open checkout modal */}
          <button className="checkout" onClick={() => {
            // Redirect to login if user is not logged in
            if (!isLoggedIn) {
              toast.error('Please login to proceed with checkout');
              navigate('/login');
              return;
            }
            // Show checkout modal
            setShowCheckout(true);
          }}>CHECKOUT</button>

          {/* Checkout modal */}
          {showCheckout && (
            <>
              {/* Overlay to dim background when modal is open */}
              <div className="modal-overlay" onClick={() => setShowCheckout(false)} />
              {/* Checkout modal content */}
              <div className="checkout-container">
                {/* Close button for the modal */}
                <i className="fas fa-times checkout-close" onClick={() => setShowCheckout(false)} />
                <h2>Checkout</h2>
                
                {/* Warning if no size is selected */}
                {!selectedSize && (
                  <div className="checkout-warning">
                    Please select a size before proceeding with payment
                  </div>
                )}
                
                {/* Display product details */}
                <div className="checkout-info">
                  <h3>Product:</h3>
                  <p>{product.name}</p>
                </div>
                {/* Display selected size */}
                <div className="checkout-info">
                  <h3>Size:</h3>
                  <p>{selectedSize || 'Not selected'}</p>
                </div>
                {/* Display selected quantity */}
                <div className="checkout-info">
                  <h3>Quantity:</h3>
                  <p>{quantity}</p>
                </div>
                {/* Display total amount */}
                <div className="checkout-info total">
                  <h3>Total Amount:</h3>
                  <p>Rs. {product.new_price * quantity}</p>
                </div>
                
                {/* Payment method selection */}
                <div className="payment-options">
                  <h3>Select Payment Method</h3>
                  <div className="payment-buttons">
                    {/* Khalti payment button */}
                    <button
                      className={`payment-button ${selectedPaymentMethod === 'khalti' ? 'selected' : ''}`}
                      onClick={() => {
                        // Set payment method and process payment if conditions are met
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
                    {/* Cash on Delivery button */}
                    <button
                      className={`payment-button ${selectedPaymentMethod === 'COD' ? 'selected' : ''}`}
                      onClick={() => {
                        // Set payment method and show confirmation modal if conditions are met
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
                
                {/* Display warnings for login or size selection */}
                <div className="checkout-actions">
                  {!isLoggedIn ? (
                    // Show login prompt if user is not logged in
                    <div className="login-warning">
                      <p>Please log in to proceed with payment</p>
                      <button onClick={() => navigate('/login')}>Log In</button>
                    </div>
                  ) : !selectedSize ? (
                    // Show size selection warning if no size is selected
                    <div className="size-warning">
                      <p>Please select a size before proceeding with payment</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}

          {/* Confirmation modal for Cash on Delivery */}
          {showConfirmation && (
            <>
              {/* Overlay to dim background when confirmation modal is open */}
              <div className="modal-overlay" onClick={() => setShowConfirmation(false)} />
              {/* Confirmation modal content */}
              <div className="confirmation-modal">
                <h3>Confirm Your Order</h3>
                <p>Are you sure you want to place this order with Cash on Delivery?</p>
                {/* Display order summary */}
                <div className="order-summary">
                  <p><strong>Product:</strong> {product.name}</p>
                  <p><strong>Size:</strong> {selectedSize}</p>
                  <p><strong>Quantity:</strong> {quantity}</p>
                  <p><strong>Total Amount:</strong> Rs. {product.new_price * quantity}</p>
                </div>
                {/* Confirmation and cancel buttons */}
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

      {/* Customer reviews section */}
      <div className="reviews-section">
        <h2>Customer Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          // Show message if no reviews are available
          <p className="no-reviews">No reviews yet.</p>
        ) : (
          <>
            {/* List of reviews */}
            <div className="reviews-list">
              {currentReviews.map(review => (
                // Individual review item
                <div key={review._id} className="review-item">
                  {/* Review header with user info and date */}
                  <div className="review-header">
                    <div className="review-user-info">
                      {/* User avatar with fallback */}
                      <img
                        src={review.user.profileImage || 'http://localhost:5000/images/default-avatar.png'}
                        alt={review.user.name || 'User'}
                        className="review-user-avatar"
                        onError={(e) => {
                          // Fallback to default avatar if image fails to load
                          e.target.src = 'http://localhost:5000/images/default-avatar.png';
                        }}
                      />
                      {/* User details and rating */}
                      <div className="review-user-details">
                        <span className="review-username">
                          {review.user?.name || 'Anonymous'}
                        </span>
                        <div className="review-rating">
                          {/* Display star rating for the review */}
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
                    </div>
                    {/* Review date */}
                    <span className="review-date">
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Review content */}
                  <div className="review-content">
                    <p className="review-feedback">{review.feedback}</p>
                    {/* Display admin response if available */}
                    {review.adminFeedback && (
                      <div className="admin-feedback">
                        <div className="admin-feedback-header">
                          <span className="admin-label">
                            <i className="fas fa-shield-alt"></i> Sneaker.Np
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
            {/* Pagination controls for reviews */}
            <div className="pagination">
              {/* Previous page button */}
              <button 
                className="pagination-button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {/* Page information */}
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              {/* Next page button */}
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

// Export the component as default
export default ProductDisplay;