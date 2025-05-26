import React, { useContext, useState } from 'react'; // Import React hooks
import './FavouriteItems.css'; // Import component-specific styling
import { ShopContext } from '../../Context/ShopContext'; // Import context for global state
import remove_icon from '../assets/cart_cross_icon.png'; // Icon for removing items
import axios from 'axios'; // Axios for HTTP requests (not used here)
import khalti from '../assets/khalti.png'; // Khalti logo
import { Link, useNavigate } from 'react-router-dom'; // Navigation and routing
import toast from 'react-hot-toast'; // Notification system

const FavouriteItems = () => {
    // Extracting context values
    const {
        getTotalFavouriteAmount,
        all_product,
        favouriteItems,
        removefromFavourite,
        removeItemFromFavourite,
        addtoFavourite
    } = useContext(ShopContext);

    // Local state for showing checkout, selected payment method, confirmation modal, and selected items
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [selectedItems, setSelectedItems] = useState({});
    const navigate = useNavigate(); // Hook for navigation

    // Check if user is logged in
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

    // Decrease quantity of an item or remove if quantity becomes 0 or less
    const decreaseFavouriteItem = (itemId) => {
        const currentQuantity = favouriteItems[itemId]?.quantity || 0;
        if (currentQuantity <= 1) {
            removeItemFromFavourite(itemId);
            toast.success("Item removed from favourites");
        } else {
            removefromFavourite(itemId);
        }
    };

    // Increase item quantity, check stock availability for the selected size
    const increaseFavouriteItem = (itemId) => {
        const product = all_product.find(p => p.id === Number(itemId));
        if (!product) return;

        const size = favouriteItems[itemId]?.size;
        const sizeData = product.sizes.find(s => s.size === size);
        const currentQuantity = favouriteItems[itemId]?.quantity || 0;

        if (!sizeData || sizeData.quantity <= currentQuantity) {
            toast.error(`Only ${sizeData?.quantity || 0} items available for size ${size}`);
            return;
        }

        addtoFavourite(itemId, size);
    };

    // Toggle selection state for an item
    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    // Select or deselect all items
    const selectAllItems = () => {
        const allSelected = Object.keys(favouriteItems).every(id => selectedItems[id]);

        if (allSelected) {
            setSelectedItems({});
        } else {
            const newSelectedItems = {};
            Object.keys(favouriteItems).forEach(id => {
                newSelectedItems[id] = true;
            });
            setSelectedItems(newSelectedItems);
        }
    };

    // Calculate total price of selected items
    const getSelectedItemsTotal = () => {
        return Object.entries(favouriteItems).reduce((total, [id, item]) => {
            if (selectedItems[id]) {
                const product = all_product.find(p => p.id === Number(id));
                return total + (product ? product.new_price * item.quantity : 0);
            }
            return total;
        }, 0);
    };

    // Count selected items
    const getSelectedItemsCount = () => {
        return Object.keys(selectedItems).filter(id => selectedItems[id]).length;
    };

    // Handle payment based on selected payment method
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

            // Set purchase source for redirection tracking
            localStorage.setItem('purchaseSource', 'favorites');

            const token = localStorage.getItem('auth-token');

            // Filter only selected and valid items
            const favouriteProducts = all_product.filter(item => 
                favouriteItems[item.id]?.quantity > 0 && selectedItems[item.id]
            );

            if (favouriteProducts.length === 0) {
                toast.error('Your favourites list is empty');
                return;
            }

            // Construct order details
            const orderDetails = favouriteProducts.map(product => ({
                productId: product._id,
                productName: product.name,
                quantity: favouriteItems[product.id].quantity,
                size: favouriteItems[product.id].size || 'Not selected',
                totalPrice: product.new_price * favouriteItems[product.id].quantity,
                productImage: product.image,
            }));

            // Save order details locally
            localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

            // Make payment initialization request
            const response = await fetch('http://localhost:5000/initialize-khalti', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': token
                },
                body: JSON.stringify({
                    cartItems: Object.entries(favouriteItems)
                        .filter(([id, item]) => item.quantity > 0 && selectedItems[id])
                        .map(([id, item]) => {
                            const product = all_product.find(p => p.id === Number(id));
                            return {
                                productId: product._id,
                                quantity: item.quantity,
                                size: item.size || 'N/A'
                            };
                        }),
                    totalPrice: getSelectedItemsTotal(),
                    paymentMethod
                })
            });

            // Handle server errors
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

            // If COD, process and redirect
            if (paymentMethod === 'COD') {
                setShowCheckout(false);

                const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
                console.log('Removing selected items from favorites:', selectedIds);
                for (const id of selectedIds) {
                    removeItemFromFavourite(id);
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

            // If Khalti, redirect to payment URL
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
            {/* Header format */}
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
            
            {/* Render each favourite item */}
            {all_product.map((product) => (
                favouriteItems[product.id]?.quantity > 0 && (
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
                            <p>{favouriteItems[product.id]?.size || 'N/A'}</p>
                            <div className="cartitem-quantity-controls">
                                <button onClick={() => decreaseFavouriteItem(product.id)}>-</button>
                                <span>{favouriteItems[product.id].quantity}</span>
                                <button onClick={() => increaseFavouriteItem(product.id)}>+</button>
                            </div>
                            <p>Rs.{product.new_price * favouriteItems[product.id].quantity}</p>
                            <img
                                src={remove_icon}
                                onClick={() => {
                                    removefromFavourite(product.id);
                                    toast.success("Removed from Favourite");
                                }}
                                alt="Remove"
                                className="cartitems-remove-icon"
                            />
                        </div>
                        <hr />
                    </div>
                )
            ))}

            {/* Cart total and checkout section */}
            <div className="cartitems-down">
                <div className="cartitems-total">
                    {/* Select All Option */}
                    <div className="select-all-container">
                        <input 
                            type="checkbox" 
                            checked={Object.keys(favouriteItems).length > 0 && Object.keys(favouriteItems).every(id => selectedItems[id])}
                            onChange={selectAllItems}
                            className="select-all-checkbox"
                        />
                        <label>Select All Items</label>
                    </div>
                    <h1>Favourite Totals</h1>
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
                    {/* Checkout Button */}
                    <button 
                        className='checkout' 
                        onClick={() => setShowCheckout(true)}
                        disabled={getSelectedItemsCount() === 0}
                    >
                        CHECKOUT ({getSelectedItemsCount()} items)
                    </button>

                    {/* Checkout Modal */}
                    {showCheckout && (
                        <>
                            <div className="modal-overlay" onClick={() => setShowCheckout(false)} />
                            <div className="checkout-container">
                                <i className="fas fa-times checkout-close" onClick={() => setShowCheckout(false)} />
                                <h2>Checkout</h2>
                                
                                {/* Item Summary */}
                                {all_product.filter(item => 
                                    favouriteItems[item.id]?.quantity > 0 && selectedItems[item.id]
                                ).map(item => (
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
                                            <p>{favouriteItems[item.id]?.size || 'N/A'}</p>
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
                                
                                {/* Total Display */}
                                <div className="checkout-info">
                                    <h3>Total Amount:</h3>
                                    <h3>Rs. {getSelectedItemsTotal()}</h3>
                                </div>
                                
                                {/* Payment Method Buttons */}
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

                    {/* Confirmation Modal for COD */}
                    {showConfirmation && (
                        <>
                            <div className="modal-overlay" onClick={() => setShowConfirmation(false)} />
                            <div className="confirmation-modal">
                                <h3>Confirm Your Order</h3>
                                <p>Are you sure you want to place this order with Cash on Delivery?</p>
                                <div className="order-summary">
                                    {all_product.filter(item => 
                                        favouriteItems[item.id]?.quantity > 0 && selectedItems[item.id]
                                    ).map(item => (
                                        <div key={item.id}>
                                            <p><strong>Product:</strong> {item.name}</p>
                                            <p><strong>Size:</strong> {favouriteItems[item.id]?.size || 'N/A'}</p>
                                            <p><strong>Quantity:</strong> {favouriteItems[item.id].quantity}</p>
                                            <p><strong>Total:</strong> Rs.{item.new_price * favouriteItems[item.id].quantity}</p>
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

export default FavouriteItems; 
