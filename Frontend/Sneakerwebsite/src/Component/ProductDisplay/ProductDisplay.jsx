import React, { useContext, useState } from 'react';
import './ProductDisplay.css';
import star_icon from '../assets/star_icon.png';
import star_dull_icon from '../assets/star_dull_icon.png';
import { ShopContext } from '../../Context/ShopContext';

const ProductDisplay = (props) => {
    const { product } = props;
    const { addtoCart, addtoFavourite } = useContext(ShopContext);
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedSize, setSelectedSize] = useState('');

    const handleSizeChange = (event) => {
        setSelectedSize(event.target.value);
    };

    return (
        <div className="productdisplay">
            <div className="productdisplay-left">
                <div className="productdisplay-img-list">
                    <img src={product.image} alt="" />
                    <img src={product.image} alt="" />
                    <img src={product.image} alt="" />
                    <img src={product.image} alt="" />
                </div>
                <div className="productdisplay-img">
                    <img src={product.image} alt="" className="productdisplay-main-img" />
                </div>
            </div>
            <div className="productdisplay-right">
                <h1>{product.name}</h1>
                <div className="productdisplay-right-star">
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_dull_icon} alt="" />
                    <p>(122)</p>
                </div>
                <div className="productdisplay-right-prices">
                    <div className="productdisplay-right-price-new">Rs.{product.new_price}</div>
                </div>
                <div className="productdisplay-right-description">
                    One of the most popular sneakers available in markets.
                </div>
                <div className="productdisplay-right-size">
                    <h1>Select Size</h1>
                    <select value={selectedSize} onChange={handleSizeChange} className="productdisplay-right-size-select">
                        <option value="">Select a size</option>
                        {Array.from({ length: 25 }, (_, i) => 20 + i).map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="productdisplay-right-buttons">
                    <button className='productdisplay-right-cart' onClick={() => { addtoCart(product.id) }}>ADD TO CART</button>
                    <button className='productdisplay-right-favorite' onClick={() => { addtoFavourite(product.id) }}>ADD TO FAVORITE</button>
                </div>
                <p className='productdisplay-right-category'><span>Category :</span> Mens and Women</p>
                <p className='productdisplay-right-category'><span>Tags :</span> Modern, Latest</p>
                <button className='checkout' onClick={() => setShowCheckout(true)}>CHECKOUT</button>
                {showCheckout && (
                    <div className="checkout-container">
                        <h2>Checkout</h2>
                        <div className="checkout-info">
                            <h3>Total Amount:</h3>
                            <h3>Rs. {product.new_price}</h3>
                        </div>
                        <div className="checkout-method">
                            <h2>Payment Method:</h2>
                        </div>
                        <button>Pay with Khalti</button>
                        <button onClick={() => setShowCheckout(false)}>Payment Cancel</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDisplay;
