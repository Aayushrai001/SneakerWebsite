import React, { useContext, useState } from 'react';
import './CartItems.css';
import { ShopContext } from '../../Context/ShopContext';
import remove_icon from '../assets/cart_cross_icon.png';
import axios from 'axios';
import khalti from '../assets/khalti.png';
import { Link } from 'react-router-dom';

const CartItems = () => {
  const { getTotalCartAmount, all_product, cartItems, removefromCart, addtoCart, decreaseCartItem } = useContext(ShopContext);
  const [showCheckout, setShowCheckout] = useState(false);

  const token = localStorage.getItem('auth-token');
  if (!token) {
    return (
      <div className="cartitems">
        <h2>Please log in first</h2>
        <p>You need to be logged in to view your cart.</p>
        <Link to="/login">Go to Login</Link>
      </div>
    );
  }

  const increaseCartItem = (itemId, size) => {
    addtoCart(itemId, size);
  };

  const handleKhaltiPayment = async () => {
    if (!token) {
      alert('Please log in to proceed with payment');
      return;
    }

    // Map cart items to match backend structure
    const cartProducts = all_product
      .filter((product) => cartItems[product.id.toString()] > 0)
      .map((product) => ({
        productId: product._id,
        quantity: cartItems[product.id.toString()] || 0,
        size: all_product.find(p => p.id === Number(product.id))?.sizes?.[0]?.size || 'N/A',
        totalPrice: (product.new_price || 0) * (cartItems[product.id.toString()] || 0),
      }));

    if (cartProducts.length === 0) {
      alert('Your cart is empty. Add items to proceed with payment.');
      return;
    }

    const orderDetails = cartProducts.map((item) => ({
      productId: item.productId,
      productName: all_product.find((p) => p._id === item.productId)?.name || 'Unknown',
      quantity: item.quantity,
      size: item.size,
      totalPrice: item.totalPrice,
      productImage: all_product.find((p) => p._id === item.productId)?.image || '',
    }));

    localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

    try {
      const response = await axios.post(
        'http://localhost:5000/initialize-khalti',
        {
          cartItems: cartProducts,
          totalPrice: getTotalCartAmount(),
        },
        { headers: { 'auth-token': token } }
      );

      if (response.data.success) {
        await axios.post('http://localhost:5000/clearcart', {}, { headers: { 'auth-token': token } });
        window.location.href = response.data.payment.payment_url;
      } else {
        alert('Failed to initialize payment: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      alert(`Payment Error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className='cartitems'>
      <div className="cartitems-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Price</p>
        <p>Size</p>
        <p>Quantity</p>
        <p>Total</p>
        <p>Remove</p>
      </div>
      <hr />
      {all_product.map((product) => (
        cartItems[product.id.toString()] > 0 && (
          <div key={product.id}>
            <div className="cartitems-format">
              <img src={product.image} alt={product.name} className='carticon-product-icon' />
              <p>{product.name}</p>
              <p>Rs.{product.new_price}</p>
              <p>{all_product.find(p => p.id === Number(product.id))?.sizes?.[0]?.size || 'N/A'}</p>
              <div className="cartitem-quantity-controls">
                <button onClick={() => decreaseCartItem(product.id)}>-</button>
                <span>{cartItems[product.id.toString()]}</span>
                <button onClick={() => increaseCartItem(product.id, all_product.find(p => p.id === Number(product.id))?.sizes?.[0]?.size)}>+</button>
              </div>
              <p>Rs.{(product.new_price || 0) * (cartItems[product.id.toString()] || 0)}</p>
              <img
                src={remove_icon}
                onClick={() => removefromCart(product.id)}
                alt="Remove"
                className="cartitems-remove-icon"
              />
            </div>
            <hr />
          </div>
        )
      ))}
      <div className="cartitems-down">
        <div className="cartitems-total">
          <h1>Cart Totals</h1>
          <div>
            <div className="cartitems-total-item">
              <p>Subtotal</p>
              <p>Rs.{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <p>Shipping Fee</p>
              <p>Free</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <h3>Total</h3>
              <h3>Rs.{getTotalCartAmount()}</h3>
            </div>
          </div>
          <button className='checkout' onClick={() => setShowCheckout(true)}>CHECKOUT</button>
          {showCheckout && (
            <div className="checkout-container">
              <h2>Checkout</h2>
              {all_product.filter(product => cartItems[product.id.toString()] > 0).map(product => (
                <div key={product.id} className="checkout-info">
                  <div>
                    <h3>Product:</h3>
                    <p>{product.name}</p>
                  </div>
                  <div>
                    <h3>Price:</h3>
                    <p>Rs.{product.new_price}</p>
                  </div>
                  <div>
                    <h3>Size:</h3>
                    <p>{all_product.find(p => p.id === Number(product.id))?.sizes?.[0]?.size || 'N/A'}</p>
                  </div>
                  <div>
                    <h3>Quantity:</h3>
                    <p>{cartItems[product.id.toString()]}</p>
                  </div>
                  <div>
                    <h3>Total:</h3>
                    <p>Rs.{(product.new_price || 0) * (cartItems[product.id.toString()] || 0)}</p>
                  </div>
                </div>
              ))}
              <div className="checkout-info">
                <h3>Total Amount:</h3>
                <h3>Rs. {getTotalCartAmount()}</h3>
              </div>
              <div className="checkout-method">
                <h2>Payment Method:</h2>
              </div>
              <button className="khalti-btn" onClick={handleKhaltiPayment}>
                Pay with Khalti <img src={khalti} alt="Khalti" className='khalti' />
              </button>
              <button onClick={() => setShowCheckout(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItems;