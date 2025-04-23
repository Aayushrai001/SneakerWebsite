import React, { useContext, useState } from 'react';
import './CartItems.css';
import { ShopContext } from '../../Context/ShopContext';
import remove_icon from '../assets/cart_cross_icon.png';
import axios from 'axios';
import khalti from '../assets/khalti.png';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CartItems = () => {
  const { getTotalCartAmount, all_product, cartItems, removefromCart, removeItemFromCart, addtoCart, decreaseCartItem } = useContext(ShopContext);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
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

  const increaseCartItem = (itemId) => {
    addtoCart(itemId, cartItems[itemId]?.size);
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const selectAllItems = () => {
    const allSelected = Object.keys(cartItems).every(id => selectedItems[id]);
    
    if (allSelected) {
      // If all are selected, deselect all
      setSelectedItems({});
    } else {
      // Otherwise, select all
      const newSelectedItems = {};
      Object.keys(cartItems).forEach(id => {
        newSelectedItems[id] = true;
      });
      setSelectedItems(newSelectedItems);
    }
  };

  const getSelectedItemsTotal = () => {
    return Object.entries(cartItems).reduce((total, [id, item]) => {
      if (selectedItems[id]) {
        const product = all_product.find(p => p.id === Number(id));
        return total + (product ? product.new_price * item.quantity : 0);
      }
      return total;
    }, 0);
  };

  const getSelectedItemsCount = () => {
    return Object.keys(selectedItems).filter(id => selectedItems[id]).length;
  };

  const handlePayment = async (paymentMethod) => {
    try {
      if (!localStorage.getItem('auth-token')) {
        toast.error('Please login to continue');
        return;
      }

      const selectedItemsCount = getSelectedItemsCount();
      if (selectedItemsCount === 0) {
        toast.error('Please select at least one item to purchase');
        return;
      }

      const token = localStorage.getItem('auth-token');
      const cartProducts = all_product.filter(product => 
        cartItems[product.id]?.quantity > 0 && selectedItems[product.id]
      );
      
      if (cartProducts.length === 0) {
        toast.error('Your cart is empty');
        return;
      }

      const orderDetails = cartProducts.map(product => ({
        productId: product._id,
        productName: product.name,
        quantity: cartItems[product.id].quantity,
        size: cartItems[product.id].size || 'Not selected',
        totalPrice: product.new_price * cartItems[product.id].quantity,
        productImage: product.image,
      }));

      localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

      const response = await fetch('http://localhost:5000/initialize-khalti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token
        },
        body: JSON.stringify({
          cartItems: Object.entries(cartItems)
            .filter(([id, item]) => item.quantity > 0 && selectedItems[id])
            .map(([id, item]) => ({
              productId: all_product.find(p => p.id === Number(id))?._id,
              quantity: item.quantity,
              totalPrice: all_product.find(p => p.id === Number(id)).new_price * item.quantity,
              size: item.size || 'N/A',
            })),
          totalPrice: getSelectedItemsTotal(),
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
        
        // Remove selected items from cart
        const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
        console.log('Removing selected items from cart:', selectedIds);
        for (const id of selectedIds) {
          removeItemFromCart(id);
        }
        
        if (data.redirect_url) {
          navigate(data.redirect_url.replace('http://localhost:5173', ''));
        } else if (data.transaction_id) {
          navigate(`/payment-success?transaction_id=${data.transaction_id}`);
        } else {
          toast.error('Missing redirect URL for COD success page');
        }
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

  return (
    <div className='cartitems'>
      <div className="cartitems-format-main">
        <p>Select</p>
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
              <input 
                type="checkbox" 
                checked={!!selectedItems[product.id]} 
                onChange={() => toggleItemSelection(product.id)}
                className="item-checkbox"
              />
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
          <div className="select-all-container">
            <input 
              type="checkbox" 
              checked={Object.keys(cartItems).length > 0 && Object.keys(cartItems).every(id => selectedItems[id])}
              onChange={selectAllItems}
              className="select-all-checkbox"
            />
            <label>Select All Items</label>
          </div>
          <h1>Cart Totals</h1>
          <div>
            <div className="cartitems-total-item">
              <p>Subtotal</p>
              <p>Rs.{getSelectedItemsTotal()}</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <p>Shipping Fee</p>
              <p>Free</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <h3>Total</h3>
              <h3>Rs.{getSelectedItemsTotal()}</h3>
            </div>
          </div>
          <button 
            className='checkout' 
            onClick={() => setShowCheckout(true)}
            disabled={getSelectedItemsCount() === 0}
          >
            CHECKOUT ({getSelectedItemsCount()} items)
          </button>
          {showCheckout && (
            <>
              <div className="modal-overlay" onClick={() => setShowCheckout(false)} />
              <div className="checkout-container">
                <i className="fas fa-times checkout-close" onClick={() => setShowCheckout(false)} />
                <h2>Checkout</h2>
                
                {all_product.filter(product => 
                  cartItems[product.id]?.quantity > 0 && selectedItems[product.id]
                ).map(product => (
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
                  <h3>Rs. {getSelectedItemsTotal()}</h3>
                </div>
                
                <div className="payment-options">
                  <h3>Select Payment Method</h3>
                  <div className="payment-buttons">
                    <button
                      className={`payment-button ${selectedPaymentMethod === 'khalti' ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPaymentMethod('khalti');
                        handlePayment('khalti');
                      }}
                    >
                      <img src={khalti} alt="Khalti" />
                      Pay with Khalti
                    </button>
                    <button
                      className={`payment-button ${selectedPaymentMethod === 'COD' ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPaymentMethod('COD');
                        setShowConfirmation(true);
                      }}
                    >
                      <i className="fas fa-money-bill-wave"></i>
                      Cash on Delivery
                    </button>
                  </div>
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
                  {all_product.filter(product => 
                    cartItems[product.id]?.quantity > 0 && selectedItems[product.id]
                  ).map(product => (
                    <div key={product.id}>
                      <p><strong>Product:</strong> {product.name}</p>
                      <p><strong>Size:</strong> {cartItems[product.id].size || 'N/A'}</p>
                      <p><strong>Quantity:</strong> {cartItems[product.id].quantity}</p>
                      <p><strong>Total:</strong> Rs.{product.new_price * cartItems[product.id].quantity}</p>
                    </div>
                  ))}
                  <p><strong>Total Amount:</strong> Rs. {getSelectedItemsTotal()}</p>
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
    </div>
  );
};

export default CartItems;