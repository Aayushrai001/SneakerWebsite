import React, { useContext, useState, useEffect } from 'react';
import './ProductDisplay.css';
import star_icon from '../assets/star_icon.png';
import star_dull_icon from '../assets/star_dull_icon.png';
import khalti from '../assets/khalti.png';
import { ShopContext } from '../../Context/ShopContext';
import axios from 'axios';

const ProductDisplay = ({ product }) => {
  const { addtoCart, addtoFavourite } = useContext(ShopContext);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (product) {
      fetchReviews();
    }
  }, [product]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:5000/product/${product._id}/reviews`);
      const data = await response.json();
      if (data.success) setReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSizeChange = (event) => setSelectedSize(event.target.value);
  const handleQuantityChange = (event) => setQuantity(Math.max(1, parseInt(event.target.value) || 1));
  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleKhaltiPayment = async () => {
    if (!selectedSize) return alert('Please select a size');
    if (quantity < 1) return alert('Quantity must be at least 1');
    const token = localStorage.getItem('auth-token');
    if (!token) return alert('Please log in to proceed with payment');

    try {
      const cartItems = [{ productId: product._id, quantity, totalPrice: product.new_price * quantity, size: selectedSize }];
      const totalPrice = product.new_price * quantity;
      const orderDetails = { productId: product._id, productName: product.name, quantity, size: selectedSize, totalPrice, productImage: product.image };
      localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

      const response = await axios.post(
        'http://localhost:5000/initialize-khalti',
        { cartItems, totalPrice },
        { headers: { 'auth-token': token } }
      );

      if (response.data.success) window.location.href = response.data.payment.payment_url;
      else alert('Failed to initialize payment: ' + (response.data.message || 'Unknown error'));
    } catch (error) {
      console.error('Error initiating Khalti payment:', error);
      alert(`Payment Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const averageRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="productdisplay">
      <div className="productdisplay-left">
        <div className="productdisplay-img-list">
          <img src={product.image} alt="Product" />
          <img src={product.image} alt="Product" />
          <img src={product.image} alt="Product" />
          <img src={product.image} alt="Product" />
        </div>
        <div className="productdisplay-img">
          <img src={product.image} alt="Product" className="productdisplay-main-img" />
        </div>
      </div>
      <div className="productdisplay-right">
        <h1>{product.name}</h1>
        <div className="productdisplay-right-star">
          {[...Array(5)].map((_, i) => (
            <img key={i} src={i < averageRating ? star_icon : star_dull_icon} alt="star" />
          ))}
          <p>({reviews.length} reviews)</p>
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
          <select value={selectedSize} onChange={handleSizeChange} className="productdisplay-right-size-select">
            <option value="">Select a size</option>
            {[...Array(41)].map((_, i) => (
              <option key={i} value={i + 4}>{i + 4}</option>
            ))}
          </select>
        </div>
        <div className="productdisplay-right-quantity">
          <h1>Quantity</h1>
          <div className="productdisplay-right-quantity-container">
            <button className="quantity-btn" onClick={decreaseQuantity}>-</button>
            <input type="number" className="quantity-input" value={quantity} min="1" onChange={handleQuantityChange} />
            <button className="quantity-btn" onClick={increaseQuantity}>+</button>
          </div>
        </div>
        <div className="productdisplay-right-buttons">
          <button className="productdisplay-right-cart" onClick={() => addtoCart(product.id, quantity)}>
            ADD TO CART
          </button>
          <button className="productdisplay-right-favorite" onClick={() => addtoFavourite(product.id)}>
            ADD TO FAVORITE
          </button>
        </div>
        <button className="checkout" onClick={() => setShowCheckout(true)}>CHECKOUT</button>
        {showCheckout && (
          <div className="checkout-container">
            <h2>Checkout</h2>
            <div className="checkout-info"><h3>Product:</h3><p>{product.name}</p></div>
            <div className="checkout-info"><h3>Price:</h3><p>Rs. {product.new_price}</p></div>
            <div className="checkout-info"><h3>Selected Size:</h3><p>{selectedSize || 'Not selected'}</p></div>
            <div className="checkout-info"><h3>Quantity:</h3><p>{quantity}</p></div>
            <div className="checkout-info"><h3>Total Amount:</h3><h3>Rs. {product.new_price * quantity}</h3></div>
            <div className="checkout-method"><h1>Payment Method:</h1></div>
            <button className="khalti-btn" onClick={handleKhaltiPayment}>
              Pay with Khalti <img src={khalti} alt="Khalti" className="khalti" />
            </button>
            <button onClick={() => setShowCheckout(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDisplay;