// src/pages/PaymentFailure.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PaymentFailure.css';

const PaymentFailure = () => {
  const location = useLocation();
  const [reason, setReason] = useState('');

  useEffect(() => {
    // Extract reason from the URL query parameters
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
      case 'insufficient_balance': // Handle insufficient balance case
        return 'Your Khalti wallet has insufficient balance. Please add funds and try again.';
      default:
        return 'An unknown error occurred. Please try again or contact support.';
    }
  };

  return (
    <div className="payment-failure">
      <h1>Payment Failed</h1>
      <p>We’re sorry, but your payment could not be processed.</p>
      <p><strong>Reason:</strong> {getReasonMessage(reason)}</p>
      <div className="payment-failure-actions">
        <a href="/cart" className="retry-btn">Retry Payment</a>
        <a href="/" className="home-btn">Return to Home</a>
      </div>
    </div>
  );
};

export default PaymentFailure;