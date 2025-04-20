import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const location = useLocation();
  const [transactionId, setTransactionId] = useState('');
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const transactionIdFromQuery = queryParams.get('transaction_id');
    console.log('Transaction ID from query:', transactionIdFromQuery);

    setTransactionId(transactionIdFromQuery || 'N/A');

    if (transactionIdFromQuery) {
      fetchOrderDetails(transactionIdFromQuery);
    } else {
      setError('No transaction ID provided');
      setLoading(false);
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
      console.log('Fetching order details for transaction:', transactionId);
      
      const response = await fetch(`http://localhost:5000/api/payments/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`Failed to fetch order details: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received order details:', data);

      if (data.success) {
        setOrderDetails(data.orderDetails); // <-- updated to accept an array
      } else {
        throw new Error(data.message || 'Failed to load order details');
      }
    } catch (err) {
      console.error('Error in fetchOrderDetails:', err);
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

      {orderDetails.length > 0 && !loading && !error && (
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
                {item.paymentDate && (
                  <p><strong>Order Date:</strong> {new Date(item.paymentDate).toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p>Your order has been successfully placed. You will receive a confirmation email shortly.</p>
      <a href="/" className="Return">
        Return to Home
      </a>
    </div>
  );
};

export default PaymentSuccess;
