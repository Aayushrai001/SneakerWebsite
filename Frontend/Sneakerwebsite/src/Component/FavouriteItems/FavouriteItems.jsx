import React, { useContext, useState } from 'react';
import './FavouriteItems.css';
import { ShopContext } from '../../Context/ShopContext';
import remove_icon from '../assets/cart_cross_icon.png';
import axios from 'axios';
import khalti from '../assets/khalti.png';
import { Link } from 'react-router-dom';

const FavouriteItems = () => {
  const { getTotalFavouriteAmount, all_product, favouriteItems, removefromFavourite, addtoFavourite } = useContext(ShopContext);
  const [showCheckout, setShowCheckout] = useState(false);

  const token = localStorage.getItem('auth-token');
  if (!token) {
    return (
      <div className="cartitems">
        <h2>Please log in first</h2>
        <p>You need to be logged in to view your favourites.</p>
        <Link to="/login">Go to Login</Link>
      </div>
    );
  }

  const increaseFavouriteItem = (itemId) => {
    addtoFavourite(itemId, favouriteItems[itemId]?.size);
  };

  const handleKhaltiPayment = async () => {
    if (!token) {
      alert("Please log in to proceed with payment");
      return;
    }

    const favouriteProducts = all_product.filter(item => favouriteItems[item.id] > 0);
    const orderDetails = favouriteProducts.map(product => ({
      productId: product._id,
      productName: product.name,
      quantity: favouriteItems[product.id],
      size: sizes[product.id] || "Not selected",
      totalPrice: product.new_price * favouriteItems[product.id],
      productImage: product.image,
    }));

    localStorage.setItem("lastOrder", JSON.stringify(orderDetails));

    try {
      const response = await axios.post(
        "http://localhost:5000/initialize-khalti",
        {
          cartItems: Object.entries(favouriteItems)
            .filter(([_, qty]) => qty > 0)
            .map(([id, quantity]) => ({
              productId: all_product.find(p => p.id === Number(id))?._id,
              quantity,
              totalPrice: all_product.find(p => p.id === Number(id)).new_price * quantity,
              size: sizes[id] || "N/A",
            })),
          totalPrice: getTotalFavouriteAmount(),
        },
        { headers: { "auth-token": token } }
      );

      if (response.data.success) {
        window.location.href = response.data.payment.payment_url;
      } else {
        alert("Failed to initialize payment: " + (response.data.message || "Unknown error"));
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
      {all_product.filter(item => favouriteItems[item.id]?.quantity > 0).map((item) => (
        <div key={item.id}>
          <div className="cartitems-format">
            <img src={item.image} alt={item.name} className='carticon-product-icon' />
            <p>{item.name}</p>
            <p>Rs.{item.new_price}</p>
            <p>{favouriteItems[item.id].size || 'N/A'}</p>
            <div className="cartitem-quantity-controls">
              <button onClick={() => removefromFavourite(item.id)}>-</button>
              <span>{favouriteItems[item.id].quantity}</span>
              <button onClick={() => increaseFavouriteItem(item.id)}>+</button>
            </div>
            <p>Rs.{item.new_price * favouriteItems[item.id].quantity}</p>
            <img
              src={remove_icon}
              onClick={() => removefromFavourite(item.id)}
              alt="Remove"
              className="cartitems-remove-icon"
            />
          </div>
          <hr />
        </div>
      ))}
      <div className="cartitems-down">
        <div className="cartitems-total">
          <h1>Favourite Totals</h1>
          <div>
            <div className="cartitems-total-item">
              <p>Subtotal</p>
              <p>Rs.{getTotalFavouriteAmount()}</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <p>Shipping Fee</p>
              <p>Free</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <h3>Total</h3>
              <h3>Rs.{getTotalFavouriteAmount()}</h3>
            </div>
          </div>
          <button className='checkout' onClick={() => setShowCheckout(true)}>CHECKOUT</button>
          {showCheckout && (
            <div className="checkout-container">
              <h2>Checkout</h2>
              {all_product.filter(item => favouriteItems[item.id]?.quantity > 0).map(item => (
                <div key={item.id} className="checkout-info">
                  <div>
                    <h3>Product:</h3>
                    <p>{item.name}</p>
                  </div>
                  <div>
                    <h3>Price:</h3>
                    <p>Rs.{item.new_price}</p>
                  </div>
                  <div>
                    <h3>Size:</h3>
                    <p>{favouriteItems[item.id].size || 'N/A'}</p>
                  </div>
                  <div>
                    <h3>Quantity:</h3>
                    <p>{favouriteItems[item.id].quantity}</p>
                  </div>
                  <div>
                    <h3>Total:</h3>
                    <p>Rs.{item.new_price * favouriteItems[item.id].quantity}</p>
                  </div>
                </div>
              ))}
              <div className="checkout-info">
                <h3>Total Amount:</h3>
                <h3>Rs. {getTotalFavouriteAmount()}</h3>
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

export default FavouriteItems;