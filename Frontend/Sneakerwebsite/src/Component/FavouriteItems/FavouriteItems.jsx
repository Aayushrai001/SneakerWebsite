import React, { useContext } from 'react';
import './FavouriteItems.css';
import { ShopContext } from '../../Context/ShopContext';
import remove_icon from '../assets/cart_cross_icon.png';

const FavouriteItems = () => {
    const { getTotalFavouriteAmount, all_product, favouriteItems, removefromFavourite } = useContext(ShopContext);
    
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
            {all_product.filter(item => favouriteItems[item.id] > 0).map((e) => (
                <div key={e.id}>
                    <div className="cartitems-format">
                        <img src={e.image} alt={e.name} className='carticon-product-icon' />
                        <p>{e.name}</p>
                        <p>Rs.{e.new_price}</p>
                        <button className="cartitem-quantity">{favouriteItems[e.id]}</button>
                        <p>Rs.{e.new_price * favouriteItems[e.id]}</p>
                        <img 
                            src={remove_icon} 
                            onClick={() => removefromFavourite(e.id)} 
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
                    <button>CheckOut</button>
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