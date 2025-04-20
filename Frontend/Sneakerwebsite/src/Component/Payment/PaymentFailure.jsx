// src/pages/PaymentFailure.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaymentFailure.css';

const PaymentFailure = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if we have failure details in the location state
    if (location.state && location.state.reason) {
      setReason(location.state.reason);
      setMessage(location.state.message || '');
      return;
    }

    // Fallback to URL parameters for backward compatibility
    const queryParams = new URLSearchParams(location.search);
    const reasonFromQuery = queryParams.get('reason');
    setReason(reasonFromQuery || 'Unknown error');
  }, [location]);

  // Map the reason to a user-friendly message
  const getReasonMessage = (reason) => {
    switch (reason) {
      case 'verification_failed':
        return 'The payment could not be verified. Please try again.';
      case 'purchased_item_not_found_or_amount_mismatch':
        return 'There was an issue with your order details. Please contact support.';
      case 'server_error':
        return 'A server error occurred. Please try again later or contact support.';
      case 'insufficient_balance':
        return 'Your Khalti wallet has insufficient balance. Please add funds and try again.';
      case 'product_not_found':
        return 'The product you are trying to purchase is no longer available.';
      case 'size_not_found':
        return 'The selected size is not available for this product.';
      default:
        return message || 'An unknown error occurred. Please try again or contact support.';
    }
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="payment-failure">
      <h1>Payment Failed</h1>
      <p>We're sorry, but your payment could not be processed.</p>
      <p><strong>Reason:</strong> {getReasonMessage(reason)}</p>
      <div className="payment-failure-actions">
        <button onClick={handleReturnHome} className="home-btn">Return to Home</button>
      </div>
    </div>
  );
};

export default PaymentFailure;