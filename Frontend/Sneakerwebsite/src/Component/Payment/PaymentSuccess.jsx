import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
    const location = useLocation();
    const [transactionId, setTransactionId] = useState('');
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const transactionIdFromQuery = queryParams.get('transaction_id');
        setTransactionId(transactionIdFromQuery || 'N/A');

        const storedOrder = localStorage.getItem('lastOrder');
        if (storedOrder) {
            const parsedOrder = JSON.parse(storedOrder);
            setOrderDetails(Array.isArray(parsedOrder) ? parsedOrder : [parsedOrder]);
            localStorage.removeItem('lastOrder');
            setLoading(false);
        } else {
            fetchOrderDetails(transactionIdFromQuery);
        }
    }, [location]);

    const fetchOrderDetails = async (transactionId) => {
        if (!transactionId) {
            setError('No transaction ID provided');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/payments/${transactionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch order details');
            const data = await response.json();
            if (data.success) {
                setOrderDetails([data.orderDetails]); // Wrap in array for consistency
            } else {
                throw new Error(data.message || 'Failed to load order details');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-success">
            <h1>Payment Successful!</h1>
            <p>Thank you for your purchase.</p>
            <p><strong>Transaction ID:</strong> {transactionId}</p>
            <h2>Order Details</h2>
            {loading && <p>Loading order details...</p>}
            {error && <p className="error">Error: {error}</p>}

            {orderDetails && !loading && !error && (
                <div className="order-details-container">
                    {orderDetails.map((item, index) => (
                        <div key={index} className="order-details">
                            <div className="product-image-container">
                                {item.productImage ? (
                                    <img
                                        src={item.productImage}
                                        alt={item.productName || 'Product'}
                                        className="product-image"
                                        onError={(e) => (e.target.src = '/fallback-image.jpg')}
                                    />
                                ) : (
                                    <div className="no-image">No image available</div>
                                )}
                            </div>
                            <div className="product-details">
                                <p><strong>Product:</strong> {item.productName || 'N/A'}</p>
                                <p><strong>Quantity:</strong> {item.quantity || 'N/A'}</p>
                                {item.size && <p><strong>Size:</strong> {item.size}</p>}
                                <p><strong>Total Amount:</strong> Rs. {item.totalPrice || 'N/A'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p>Your order has been successfully placed. You will receive a confirmation email shortly.</p>
            <a href="/">Return to Home</a>
        </div>
    );
};

export default PaymentSuccess;