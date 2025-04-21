import React, { useContext, useState, useEffect } from 'react';
import './CartItems.css';
import { ShopContext } from '../../Context/ShopContext';
import remove_icon from '../assets/cart_cross_icon.png';
import axios from 'axios';
import khalti from '../assets/khalti.png';
import { Link, useNavigate } from 'react-router-dom';

const CartItems = () => {
  const { 
    getTotalCartAmount, 
    all_product, 
    cartItems, 
    removefromCart, 
    addtoCart, 
    decreaseCartItem,
    clearCart,
    fetchAllProducts
  } = useContext(ShopContext);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  // Fetch cart data on component mount
  useEffect(() => {
    fetchAllProducts();
  }, []);

  const increaseCartItem = (itemId) => {
    addtoCart(itemId, cartItems[itemId]?.size);
  };

  const handleKhaltiPayment = async () => {
    if (!token) {
        alert('Please log in to proceed with payment');
        return;
    }

    setLoading(true);
    try {
        const cartProducts = all_product.filter(product => cartItems[product.id]?.quantity > 0);
        const orderDetails = cartProducts.map(product => ({
            productId: product._id,
            productName: product.name,
            quantity: cartItems[product.id].quantity,
            size: cartItems[product.id].size || 'Not selected',
            totalPrice: product.new_price * cartItems[product.id].quantity,
            productImage: product.image,
        }));

        localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

        const response = await axios.post(
            'http://localhost:5000/initialize-khalti',
            {
                cartItems: Object.entries(cartItems)
                    .filter(([_, item]) => item.quantity > 0)
                    .map(([id, item]) => ({
                        productId: all_product.find(p => p.id === Number(id))?._id,
                        quantity: item.quantity,
                        totalPrice: all_product.find(p => p.id === Number(id)).new_price * item.quantity,
                        size: item.size || 'N/A',
                    })),
                totalPrice: getTotalCartAmount(),
            },
            { headers: { 'auth-token': token } }
        );

        if (response.data.success) {
            window.location.href = response.data.payment.payment_url;
        } else {
            alert('Failed to initialize payment: ' + (response.data.message || 'Unknown error'));
        }
    } catch (error) {
        alert(`Payment Error: ${error.response?.data?.message || error.message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleCODPayment = async () => {
    if (!token) {
        alert('Please log in to proceed with payment');
        return;
    }

    setLoading(true);
    try {
        const cartProducts = all_product.filter(product => cartItems[product.id]?.quantity > 0);
        const orderDetails = cartProducts.map(product => ({
            productId: product._id,
            productName: product.name,
            quantity: cartItems[product.id].quantity,
            size: cartItems[product.id].size || 'Not selected',
            totalPrice: product.new_price * cartItems[product.id].quantity,
            productImage: product.image,
        }));

        // Save order details to localStorage for payment success page
        localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

        // Create order in backend
        const response = await axios.post(
            'http://localhost:5000/create-order',
            {
                cartItems: Object.entries(cartItems)
                    .filter(([_, item]) => item.quantity > 0)
                    .map(([id, item]) => ({
                        productId: all_product.find(p => p.id === Number(id))?._id,
                        quantity: item.quantity,
                        totalPrice: all_product.find(p => p.id === Number(id)).new_price * item.quantity,
                        size: item.size || 'N/A',
                    })),
                totalPrice: getTotalCartAmount(),
                paymentMethod: 'COD'
            },
            { headers: { 'auth-token': token } }
        );

        if (response.data.success) {
            // Clear cart after successful order
            clearCart();
            // Navigate to payment success page
            navigate('/paymentsuccess');
        } else {
            alert('Failed to create order: ' + (response.data.message || 'Unknown error'));
        }
    } catch (error) {
        alert(`Order Error: ${error.response?.data?.message || error.message}`);
    } finally {
        setLoading(false);
    }
  };

  const handlePayment = () => {
    if (!paymentMethod) {
        alert('Please select a payment method');
        return;
    }

    if (paymentMethod === 'khalti') {
        handleKhaltiPayment();
    } else if (paymentMethod === 'cod') {
        handleCODPayment();
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
        cartItems[product.id]?.quantity > 0 && (
          <div key={product.id}>
            <div className="cartitems-format">
              <img src={product.image} alt={product.name} className='carticon-product-icon' />
              <p>{product.name}</p>
              <p>Rs.{product.new_price}</p>
              <p>{cartItems[product.id].size || 'N/A'}</p>
              <div className="cartitem-quantity-controls">
                <button onClick={() => decreaseCartItem(product.id)}>-</button>
                <span>{cartItems[product.id].quantity}</span>
                <button onClick={() => increaseCartItem(product.id)}>+</button>
              </div>
              <p>Rs.{product.new_price * cartItems[product.id].quantity}</p>
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
              {all_product.filter(product => cartItems[product.id]?.quantity > 0).map(product => (
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
                    <p>{cartItems[product.id].size || 'N/A'}</p>
                  </div>
                  <div>
                    <h3>Quantity:</h3>
                    <p>{cartItems[product.id].quantity}</p>
                  </div>
                  <div>
                    <h3>Total:</h3>
                    <p>Rs.{product.new_price * cartItems[product.id].quantity}</p>
                  </div>
                </div>
              ))}
              <div className="checkout-info">
                <h3>Total Amount:</h3>
                <h3>Rs. {getTotalCartAmount()}</h3>
              </div>
              <div className="checkout-method">
                <h2>Payment Method:</h2>
                <div className="payment-options">
                  <div className="payment-option">
                    <input 
                      type="radio" 
                      id="khalti" 
                      name="payment" 
                      value="khalti" 
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <label htmlFor="khalti">Khalti</label>
                  </div>
                  <div className="payment-option">
                    <input 
                      type="radio" 
                      id="cod" 
                      name="payment" 
                      value="cod" 
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <label htmlFor="cod">Cash on Delivery</label>
                  </div>
                </div>
              </div>
              {paymentMethod === 'khalti' && (
                <button className="khalti-btn" onClick={handlePayment} disabled={loading}>
                  {loading ? 'Processing...' : 'Pay with Khalti'} <img src={khalti} alt="Khalti" className='khalti' />
                </button>
              )}
              {paymentMethod === 'cod' && (
                <button className="cod-btn" onClick={handlePayment} disabled={loading}>
                  {loading ? 'Processing...' : 'Place Order (COD)'}
                </button>
              )}
              <button onClick={() => setShowCheckout(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItems;