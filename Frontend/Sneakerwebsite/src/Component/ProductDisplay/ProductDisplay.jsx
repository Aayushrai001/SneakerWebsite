import React, { useContext, useState, useEffect } from 'react';
import './ProductDisplay.css';
import star_icon from '../assets/star_icon.png';
import star_dull_icon from '../assets/star_dull_icon.png';
import khalti from '../assets/khalti.png';
import { ShopContext } from '../../Context/ShopContext';
import axios from 'axios';

const ProductDisplay = ({ product }) => {
  const { addtoCart, addtoFavourite, cartItems, favouriteItems } = useContext(ShopContext);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [showMore, setShowMore] = useState(true);
  const [availableSizes, setAvailableSizes] = useState([]);

  const isLoggedIn = !!localStorage.getItem('auth-token');

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

  const fetchReviews = async () => {
    try {
      const productId = product?._id;
      if (!productId) return;
      const response = await fetch(`http://localhost:5000/product/${productId}/reviews`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        setReviews([]);
      }
    } catch (error) {
      setReviews([]);
    }
  };

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

  const handleKhaltiPayment = async () => {
    if (!isLoggedIn) {
      alert('Please log in to proceed with payment');
      return;
    }
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    if (quantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }
    const productId = product?._id;
    if (!productId) {
      alert('Invalid product ID');
      return;
    }

    const orderDetails = [{
      productId,
      productName: product.name,
      quantity,
      size: selectedSize,
      totalPrice: product.new_price * quantity,
      productImage: product.image,
    }];

    try {
      const response = await axios.post(
        'http://localhost:5000/initialize-khalti',
        {
          cartItems: [{
            productId,
            quantity,
            totalPrice: product.new_price * quantity,
            size: selectedSize,
          }],
          totalPrice: product.new_price * quantity,
          orderDetails, // Include orderDetails in payload
        },
        { headers: { 'auth-token': localStorage.getItem('auth-token') } }
      );

      if (response.data.success) {
        window.location.href = response.data.payment.payment_url;
      } else {
        alert(`Failed to initialize payment: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Payment Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      alert('Please log in to add items to your cart');
      return;
    }
    if (!selectedSize) {
      alert('Please select a size');
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
      alert('Please log in to add items to your favorites');
      return;
    }
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    addtoFavourite(product.id, selectedSize);
    setQuantity(1);
    setSelectedSize('');
  };

  const toggleReviews = () => {
    setShowMore(prev => !prev);
    setVisibleReviews(showMore ? reviews.length : 3);
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
          <div className="overall-rating">
            <div className="productdisplay-right-star">
              {[...Array(5)].map((_, i) => (
                <img
                  key={i}
                  src={i < averageRating ? star_icon : star_dull_icon}
                  alt="star"
                />
              ))}
            </div>
            <p>{averageRating} ({reviews.length} reviews)</p>
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
            <div className="checkout-container">
              <h2>Checkout</h2>
              <div className="checkout-info">
                <h3>Product:</h3>
                <p>{product.name}</p>
              </div>
              <div className="checkout-info">
                <h3>Price:</h3>
                <p>Rs. {product.new_price}</p>
              </div>
              <div className="checkout-info">
                <h3>Size:</h3>
                <p>{selectedSize || 'Not selected'}</p>
              </div>
              <div className="checkout-info">
                <h3>Quantity:</h3>
                <p>{quantity}</p>
              </div>
              <div className="checkout-info">
                <h3>Total Amount:</h3>
                <h3>Rs. {product.new_price * quantity}</h3>
              </div>
              <div className="checkout-method">
                <h2>Payment Method:</h2>
              </div>
              <button className="khalti-btn" onClick={handleKhaltiPayment}>
                Pay with Khalti <img src={khalti} alt="Khalti" className="khalti" />
              </button>
              <button onClick={() => setShowCheckout(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      <div className="reviews-section">
        <h2>Customer Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="no-reviews">No approved reviews yet.</p>
        ) : (
          <div className="reviews-list">
            {reviews.slice(0, visibleReviews).map(review => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <span className="review-username">
                    {review.user?.name || 'Anonymous'}
                  </span>
                  <span className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <img
                        key={i}
                        src={i < review.rating ? star_icon : star_dull_icon}
                        alt="star"
                      />
                    ))}
                  </span>
                </div>
                <p className="review-feedback">
                  {review.feedback || 'No feedback provided'}
                </p>
              </div>
            ))}
          </div>
        )}
        {reviews.length > 3 && (
          <div className="reviews-more">
            <button className="reviews-toggle-btn" onClick={toggleReviews}>
              {showMore ? 'See More Reviews' : 'Show Less Reviews'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDisplay;