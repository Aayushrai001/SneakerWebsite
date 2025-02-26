import React, { useContext, useState } from 'react';
import './FavouriteItems.css';
import { ShopContext } from '../../Context/ShopContext';
import remove_icon from '../assets/cart_cross_icon.png';

const FavouriteItems = () => {
    const { getTotalFavouriteAmount, all_product, favouriteItems, removefromFavourite } = useContext(ShopContext);
    const [showCheckout, setShowCheckout] = useState(false);

    return (
        <div className='cartitems'>
            <div className="cartitems-format-main">
                <p>Products</p>
                <p>Title</p>
                <p>Price</p>
                <p>Quantity</p>
                <p>Total</p>
                <p>Remove</p>
            </div>
            <hr />
            {all_product.filter(item => favouriteItems[item.id] > 0).map((item) => (
                <div key={item.id}>
                    <div className="cartitems-format">
                        <img src={item.image} alt={item.name} className='carticon-product-icon' />
                        <p>{item.name}</p>
                        <p>Rs.{item.new_price}</p>
                        <button className="cartitem-quantity">{favouriteItems[item.id]}</button>
                        <p>Rs.{item.new_price * favouriteItems[item.id]}</p>
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
                            <div className="checkout-info">
                                <h3>Total Amount:</h3>
                                <h3>Rs. {getTotalFavouriteAmount()}</h3>
                            </div>
                            <div className="checkout-method">
                                <h2>Payment Method:</h2>
                            </div>
                            <button>Pay with Khalti</button>
                            <button onClick={() => setShowCheckout(false)}>Payment Cancel</button>
                        </div>
                    )}
                </div>
                <div className="cartitems-promocode">
                    <p>If you have a promo code, enter it here:</p>
                    <div className="cartitems-promobox">
                        <input type="text" placeholder='Promo code' />
                        <button>Submit</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FavouriteItems;