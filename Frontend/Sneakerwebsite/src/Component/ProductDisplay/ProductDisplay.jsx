import React, { useContext, useState } from 'react';
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

    if (!product) {
        return <div>Loading...</div>;
    }

    const handleSizeChange = (event) => {
        setSelectedSize(event.target.value);
    };

    const handleQuantityChange = (event) => {
        const value = Math.max(1, parseInt(event.target.value) || 1);
        setQuantity(value);
    };

    const increaseQuantity = () => {
        setQuantity(prevQuantity => prevQuantity + 1);
    };

    const decreaseQuantity = () => {
        setQuantity(prevQuantity => Math.max(1, prevQuantity - 1));
    };

    const handleKhaltiPayment = async () => {
        if (!selectedSize) {
            alert('Please select a size');
            return;
        }
        if (quantity < 1) {
            alert('Quantity must be at least 1');
            return;
        }
        const token = localStorage.getItem('auth-token');
        if (!token) {
            alert('Please log in to proceed with payment');
            return;
        }

        try {
            console.log('Initiating Khalti payment...');
            console.log('Auth Token:', token);
            console.log('Product ID:', product._id);

            const cartItems = [{
                productId: product._id,
                quantity: quantity,
                totalPrice: product.new_price * quantity,
                size: selectedSize,
            }];
            const totalPrice = product.new_price * quantity;

            console.log('Request Payload:', { cartItems, totalPrice });

            const orderDetails = {
                productId: product._id,
                productName: product.name,
                quantity,
                size: selectedSize,
                totalPrice,
                productImage: product.image,
            };
            localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

            const response = await axios.post(
                'http://localhost:5000/initialize-khalti',
                {
                    cartItems,
                    totalPrice,
                },
                { headers: { 'auth-token': token } }
            );

            console.log('Khalti Initialize Response:', response.data);

            if (response.data.success) {
                console.log('Redirecting to Khalti payment URL:', response.data.payment.payment_url);
                window.location.href = response.data.payment.payment_url;
            } else {
                console.error('Failed to initialize payment:', response.data.message);
                alert('Failed to initialize payment: ' + (response.data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error initiating Khalti payment:', error);
            let errorMessage = 'An error occurred while processing your payment';

            if (error.response) {
                errorMessage = error.response.data.message || errorMessage;
                if (error.response.status === 401) {
                    errorMessage = 'Authentication failed. Please log in again.';
                    localStorage.removeItem('auth-token');
                } else if (error.response.status === 404) {
                    errorMessage = 'Product not found. Please try again.';
                } else if (error.response.status === 502) {
                    errorMessage = `${error.response.data.message || 'Payment gateway error: Unable to connect to Khalti.'} Please try again later or contact support.`;
                } else if (error.response.status === 500) {
                    errorMessage = `Server error: ${error.response.data.error || 'Please try again later.'}`;
                }
            } else if (error.request) {
                errorMessage = 'No response from server. Please check your network connection.';
            } else {
                errorMessage = error.message;
            }

            alert(`Payment Error: ${errorMessage}`);
        }
    };

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
                    <img src={star_icon} alt="star" />
                    <img src={star_icon} alt="star" />
                    <img src={star_icon} alt="star" />
                    <img src={star_icon} alt="star" />
                    <img src={star_dull_icon} alt="star" />
                    <p>(122)</p>
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
                        {[...Array(41)].map((_, i) => (
                            <option key={i} value={i + 4}>{i + 4}</option>
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
                    <button
                        className="productdisplay-right-cart"
                        onClick={() => addtoCart(product.id, quantity)}
                    >
                        ADD TO CART
                    </button>
                    <button
                        className="productdisplay-right-favorite"
                        onClick={() => addtoFavourite(product.id)}
                    >
                        ADD TO FAVORITE
                    </button>
                </div>
                <button className="checkout" onClick={() => setShowCheckout(true)}>
                    CHECKOUT
                </button>
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
                            <h3>Selected Size:</h3>
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
                            <h1>Payment Method:</h1>
                        </div>
                        <button className="khalti-btn" onClick={handleKhaltiPayment}>
                            Pay with Khalti <img src={khalti} alt="Khalti" className='khalti' />
                        </button>
                        <button onClick={() => setShowCheckout(false)}>Cancel</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDisplay;