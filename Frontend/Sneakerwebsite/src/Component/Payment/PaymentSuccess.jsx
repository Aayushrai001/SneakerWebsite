import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaymentSuccess.css';
import { ShopContext } from '../../Context/ShopContext';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { removeItemFromCart, removeItemFromFavourite, all_product } = useContext(ShopContext);
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
      // Try to get order details from localStorage if no transaction ID
      const savedOrderDetails = localStorage.getItem('lastOrder');
      if (savedOrderDetails) {
        try {
          const parsedOrderDetails = JSON.parse(savedOrderDetails);
          setOrderDetails(parsedOrderDetails);
          setLoading(false);
          
          // Remove items from cart and favorites
          removePurchasedItems(parsedOrderDetails);
        } catch (err) {
          console.error('Error parsing saved order details:', err);
          setError('Failed to load order details');
          setLoading(false);
        }
      } else {
        setError('No transaction ID provided and no saved order details found');
        setLoading(false);
      }
    }
  }, [location]);

  const removePurchasedItems = (items) => {
    if (!items || !Array.isArray(items)) return;
    
    console.log('Removing purchased items:', items);
    
    items.forEach(item => {
      if (item.productId) {
        // Find the product ID in the all_product array
        const product = all_product.find(p => p._id === item.productId);
        if (product) {
          console.log(`Removing product ${product.id} from cart and favorites`);
          // Remove from cart
          removeItemFromCart(product.id);
          
          // Remove from favorites
          removeItemFromFavourite(product.id);
        } else {
          console.error(`Product with ID ${item.productId} not found in all_product`);
        }
      }
    });
    
    // Clear the saved order details from localStorage
    localStorage.removeItem('lastOrder');
    
    toast.success('Items have been removed from your cart and favorites');
  };

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
        setOrderDetails(data.orderDetails);
        
        // Remove items from cart and favorites
        removePurchasedItems(data.orderDetails);
      } else {
        throw new Error(data.message || 'Failed to load order details');
      }
    } catch (err) {
      console.error('Error in fetchOrderDetails:', err);
      setError(err.message);
      
      // Fallback to localStorage if API call fails
      const savedOrderDetails = localStorage.getItem('lastOrder');
      if (savedOrderDetails) {
        try {
          const parsedOrderDetails = JSON.parse(savedOrderDetails);
          setOrderDetails(parsedOrderDetails);
          
          // Remove items from cart and favorites
          removePurchasedItems(parsedOrderDetails);
        } catch (parseErr) {
          console.error('Error parsing saved order details:', parseErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    return orderDetails.reduce((total, item) => total + (item.totalPrice || 0), 0);
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
          <div className="order-total">
            <h3>Total Order Amount: Rs. {calculateTotalAmount()}</h3>
          </div>
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
