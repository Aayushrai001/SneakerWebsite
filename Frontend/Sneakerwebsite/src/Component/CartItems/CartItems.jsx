import React, { useContext, useState } from 'react';
import './CartItems.css';
import { ShopContext } from '../../Context/ShopContext';
import remove_icon from '../assets/cart_cross_icon.png';

const CartItems = () => {
    const { getTotalCartAmount, all_product, cartItems, removefromCart } = useContext(ShopContext);
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

            {all_product.map((product) => (
                cartItems[product.id] > 0 && (
                    <div key={product.id}>
                        <div className="cartitems-format">
                            <img src={product.image} alt="" className='carticon-product-icon' />
                            <p>{product.name}</p>
                            <p>Rs.{product.new_price}</p>
                            <button className="cartitem-quantity">{cartItems[product.id]}</button>
                            <p>Rs.{product.new_price * cartItems[product.id]}</p>
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
                            <div className="checkout-info">
                                <h3>Total Amount:</h3>
                                <h3>Rs. {getTotalCartAmount()}</h3>
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
}

export default CartItems
