import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaymentSuccess.css';
import { ShopContext } from '../../Context/ShopContext';

const PaymentSuccess = () => {
  // Access routing location and navigation utilities
  const location = useLocation();
  const navigate = useNavigate();

  // Access context values and functions
  const {
    removeItemFromCart,
    removeItemFromFavourite,
    all_product,
    setFavouriteItems,
    setCartItems
  } = useContext(ShopContext);

  // Component state
  const [transactionId, setTransactionId] = useState('');
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On component mount: extract transaction ID or fallback to localStorage
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const transactionIdFromQuery = queryParams.get('transaction_id');
    console.log('Transaction ID from query:', transactionIdFromQuery);

    setTransactionId(transactionIdFromQuery || 'N/A');

    if (transactionIdFromQuery) {
      // Fetch order details from server using transaction ID
      fetchOrderDetails(transactionIdFromQuery);
    } else {
      // Fallback to previously saved order details
      const savedOrderDetails = localStorage.getItem('lastOrder');
      if (savedOrderDetails) {
        try {
          const parsedOrderDetails = JSON.parse(savedOrderDetails);
          setOrderDetails(parsedOrderDetails);
          setLoading(false);
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

  // Function to remove purchased items from cart/favorites after payment
  const removePurchasedItems = async (items, retryCount = 0) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid items array for removal');
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      if (!token) throw new Error('No auth token found');

      // Backup order details
      localStorage.setItem('lastOrder', JSON.stringify(items));

      // Determine purchase source
      const purchaseSource = localStorage.getItem('purchaseSource') || 'cart';
      console.log('Purchase source:', purchaseSource);

      const removalPromises = [];

      // Create a set of purchased product IDs for quick reference
      const purchasedProductIds = new Set(
        items.map(item => {
          const product = all_product.find(p => p.name === item.productName);
          return product ? product.id.toString() : null;
        }).filter(Boolean)
      );

      console.log('Purchased product IDs:', Array.from(purchasedProductIds));

      // Loop through items to remove them appropriately
      for (const item of items) {
        const product = all_product.find(p => p.name === item.productName);
        if (!product) {
          console.warn(`Product with name ${item.productName} not found`);
          continue;
        }

        const itemId = product.id.toString();
        console.log(`Processing removal for product: ${product.name} (ID: ${itemId})`);

        // Remove from cart if source is cart
        if (purchaseSource === 'cart' && purchasedProductIds.has(itemId)) {
          removalPromises.push(
            fetch('http://localhost:5000/RemoveCart', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'auth-token': token
              },
              body: JSON.stringify({ itemId })
            }).then(async (response) => {
              if (!response.ok) throw new Error(`Failed to remove item ${itemId} from cart`);
              setCartItems(prev => {
                const updatedCart = { ...prev };
                delete updatedCart[itemId];
                return updatedCart;
              });
            })
          );
        }
        // Remove from favorites if source is favorites
        else if (purchaseSource === 'favorites' && purchasedProductIds.has(itemId)) {
          removalPromises.push(
            fetch('http://localhost:5000/RemoveFavourite', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'auth-token': token
              },
              body: JSON.stringify({ itemId })
            }).then(async (response) => {
              if (!response.ok) throw new Error(`Failed to remove item ${itemId} from favorites`);
              setFavouriteItems(prev => {
                const updatedFavourite = { ...prev };
                delete updatedFavourite[itemId];
                return updatedFavourite;
              });
            })
          );
        }
      }

      // Wait for all removals
      await Promise.all(removalPromises);

      // Refresh cart and favorites from backend
      await refreshUserData(token);

      // Cleanup
      localStorage.removeItem('lastOrder');
      localStorage.removeItem('purchaseSource');
    } catch (error) {
      console.error('Error removing purchased items:', error);
      if (retryCount < 2) {
        console.log(`Retrying removal (attempt ${retryCount + 2})...`);
        setTimeout(() => removePurchasedItems(items, retryCount + 1), 1000);
      } else {
        console.error('Error processing order. Some items may remain in cart or favorites.');
      }
    }
  };

  // Refresh user's cart and favorites from backend after order
  const refreshUserData = async (token) => {
    try {
      // Fetch updated cart
      const cartResponse = await fetch("http://localhost:5000/getcart", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const cartData = await cartResponse.json();
      setCartItems(prev => {
        const updatedCart = {};
        Object.keys(cartData).forEach((id) => {
          updatedCart[id] = typeof cartData[id] === 'object' 
            ? cartData[id] 
            : { quantity: cartData[id], size: 'N/A' };
        });
        return updatedCart;
      });

      // Fetch updated favorites
      const favoriteResponse = await fetch("http://localhost:5000/getfavourite", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const favoriteData = await favoriteResponse.json();
      setFavouriteItems(prev => {
        const updatedFavourite = {};
        Object.keys(favoriteData).forEach((id) => {
          updatedFavourite[id] = typeof favoriteData[id] === 'object' 
            ? favoriteData[id] 
            : { quantity: favoriteData[id], size: 'N/A' };
        });
        return updatedFavourite;
      });
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Fetch order details from backend based on transaction ID
  const fetchOrderDetails = async (transactionId, retryCount = 0) => {
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

      if (!response.ok) throw new Error(`Failed to fetch order details: ${response.status}`);

      const data = await response.json();
      console.log('Received order details:', data);

      if (data.success) {
        setOrderDetails(data.orderDetails);
        localStorage.setItem('lastOrder', JSON.stringify(data.orderDetails));
        await removePurchasedItems(data.orderDetails);
      } else {
        throw new Error(data.message || 'Failed to load order details');
      }
    } catch (err) {
      console.error('Error in fetchOrderDetails:', err);
      if (retryCount < 2) {
        console.log(`Retrying fetch (attempt ${retryCount + 2})...`);
        setTimeout(() => fetchOrderDetails(transactionId, retryCount + 1), 1000);
      } else {
        setError(err.message);
        const savedOrderDetails = localStorage.getItem('lastOrder');
        if (savedOrderDetails) {
          try {
            const parsedOrderDetails = JSON.parse(savedOrderDetails);
            setOrderDetails(parsedOrderDetails);
            await removePurchasedItems(parsedOrderDetails);
          } catch (parseErr) {
            console.error('Error parsing saved order details:', parseErr);
            setError('Failed to load order details');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate grand total of the order
  const calculateTotalAmount = () => {
    return orderDetails
      .reduce((total, item) => total + (item.totalPrice || 0), 0)
      .toFixed(2);
  };

  // Render component UI
  return (
    <div className="payment-success">
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

      <a href="/" className="Return">
        Return to Home
      </a>
    </div>
  );
};

export default PaymentSuccess;