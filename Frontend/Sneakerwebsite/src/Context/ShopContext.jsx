import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Creating a React context to share state across components
export const ShopContext = createContext(null);

// Function to initialize an empty cart object
const getDefaultCart = () => ({});

// Function to initialize an empty favorites object
const getDefaultFavourite = () => ({});

// ShopContextProvider component to manage and provide global state
const ShopContextProvider = (props) => {
  // State to store all products fetched from the backend
  const [all_product, setAll_Product] = useState([]);
  // State to manage cart items
  const [cartItems, setCartItems] = useState(getDefaultCart());
  // State to manage favorite items
  const [favouriteItems, setFavouriteItems] = useState(getDefaultFavourite());
  // State to store the authenticated user's name
  const [userName, setUserName] = useState("");
  // State to track loading status during data initialization
  const [isLoading, setIsLoading] = useState(true);
  // Hook to programmatically navigate to different routes
  const navigate = useNavigate();

  // Function to reset cart, favorites, and username states
  const resetState = () => {
    setCartItems(getDefaultCart());
    setFavouriteItems(getDefaultFavourite());
    setUserName("");
  };

  // Function to initialize user data (username, cart, favorites) using an auth token
  const initializeUserData = async (token) => {
    // Set loading state to true
    setIsLoading(true);
    try {
      // Fetch username from the backend
      const nameResponse = await fetch("http://localhost:5000/getusername", {
        method: "GET",
        headers: {
          "auth-token": token,
          "Content-Type": "application/json",
        },
      });
      const nameData = await nameResponse.json();
      // Update username state if fetch is successful
      if (nameData.success) {
        setUserName(nameData.name);
      }

      // Fetch cart data from the backend
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
      const updatedCart = {};
      // Normalize cart data to ensure consistent format (quantity and size)
      Object.keys(cartData).forEach((id) => {
        if (typeof cartData[id] === 'number') {
          updatedCart[id] = { quantity: cartData[id], size: 'N/A' };
        } else if (typeof cartData[id] === 'object') {
          updatedCart[id] = cartData[id];
        }
      });
      // Update cart items state
      setCartItems(updatedCart);

      // Fetch favorite items from the backend
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
      const updatedFavourite = {};
      const removePromises = [];
      // Process favorite items and check stock availability
      Object.keys(favoriteData).forEach((id) => {
        let item = favoriteData[id];
        // Normalize favorite item format
        if (typeof item === 'number') {
          item = { quantity: item, size: 'N/A' };
        }
        // Check if product and size exist and are in stock
        const product = all_product.find(p => p.id.toString() === id);
        const sizeData = product?.sizes?.find(s => s.size === item.size);
        if (!sizeData || sizeData.quantity === 0) {
          // If out of stock, prepare to remove from backend
          const authToken = localStorage.getItem("auth-token");
          if (authToken) {
            removePromises.push(
              fetch("http://localhost:5000/RemoveFavourite", {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "auth-token": authToken,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ itemId: id }),
              })
            );
          }
        } else {
          // Add valid favorite item to updated favorites
          updatedFavourite[id] = item;
        }
      });
      // Update favorite items state
      setFavouriteItems(updatedFavourite);
      // Execute removal of out-of-stock favorites
      if (removePromises.length > 0) {
        Promise.all(removePromises).then(() => console.log("Removed out-of-stock favorites"));
      }
    } catch (error) {
      // Log errors during user data initialization
      console.error("Error initializing user data:", error);
    } finally {
      // Set loading state to false when done
      setIsLoading(false);
    }
  };

  // Function to fetch all products from the backend
  const fetchAllProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/allproducts");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      // Update products state with fetched data
      setAll_Product(data);
    } catch (error) {
      // Log errors during product fetch
      console.error("Error fetching data:", error);
    }
  };

  // Function to refresh a single product's data
  const refreshProduct = async (productId) => {
    try {
      const response = await fetch(`http://localhost:5000/allproducts`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      
      // Find the updated product data
      const updatedProduct = data.find(p => p.id === productId);
      
      // Update product state only if there are changes
      if (updatedProduct) {
        setAll_Product(prevProducts => {
          // Check if product data has changed
          const currentProduct = prevProducts.find(p => p.id === productId);
          if (JSON.stringify(currentProduct) === JSON.stringify(updatedProduct)) {
            return prevProducts; // No changes, return same array
          }
          
          // Update only the specific product
          return prevProducts.map(product => {
            if (product.id === productId) {
              return updatedProduct;
            }
            return product;
          });
        });
      }
    } catch (error) {
      // Log errors during product refresh
      console.error("Error refreshing product:", error);
    }
  };

  // Function to fetch username using auth token
  const fetchUserName = async (token) => {
    try {
      const response = await fetch("http://localhost:5000/getusername", {
        method: "GET",
        headers: {
          "auth-token": token,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      // Update username state if fetch is successful
      if (data.success) {
        setUserName(data.name);
      }
    } catch (error) {
      // Log errors during username fetch
      console.error("Error fetching user name:", error);
    }
  };

  // useEffect to initialize products and user data on component mount
  useEffect(() => {
    // Fetch all products
    fetchAllProducts();
    // Check for auth token in localStorage
    const authToken = localStorage.getItem("auth-token");
    
    // If no token, reset state and stop loading
    if (!authToken) {
      resetState();
      setIsLoading(false);
      return;
    }

    // Initialize user data if token exists
    initializeUserData(authToken);
  }, []); // Empty dependency array to run once on mount

  // useEffect to periodically check session validity
  useEffect(() => {
    // Function to check session status
    const checkSession = async () => {
      const token = localStorage.getItem('auth-token');
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/check-session', {
            headers: {
              'auth-token': token
            }
          });
          // If session is invalid, clear token and reset state
          if (!response.ok) {
            localStorage.removeItem('auth-token');
            setUserName('');
            resetState();
            navigate('/');
          }
        } catch (error) {
          // Handle errors by clearing token and resetting state
          console.error('Error checking session:', error);
          localStorage.removeItem('auth-token');
          setUserName('');
          resetState();
          navigate('/');
        }
      }
    };

    // Set interval to check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    checkSession(); // Initial session check

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [navigate]); // Dependency on navigate to ensure latest navigate function

  // Function to add an item to the cart
  const addtoCart = (itemId, size) => {
    // Find product in all_products
    const product = all_product.find(p => p.id === Number(itemId));
    if (!product) return;

    // Check size availability
    const sizeData = product.sizes.find(s => s.size === size);
    const currentQuantity = cartItems[itemId]?.quantity || 0;

    // Prevent adding if stock is insufficient
    if (!sizeData || sizeData.quantity <= currentQuantity) {
      toast.error(`Only ${sizeData?.quantity || 0} items available for size ${size}`);
      return;
    }

    // Update cart items state
    setCartItems((prev) => {
      // Initialize cart item if it doesn't exist
      if (!prev[itemId]) {
        prev[itemId] = { quantity: 0, size: size || 'N/A' };
      }
      return {
        ...prev,
        [itemId]: {
          quantity: prev[itemId].quantity + 1,
          size: size || prev[itemId].size
        }
      };
    });

    // Update cart in backend if user is authenticated
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("http://localhost:5000/AddToCart", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId: itemId.toString(), size }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Cart updated:", data))
        .catch((error) => console.error("Error adding to cart:", error));
    }
  };

  // Function to remove one instance of an item from the cart
  const removefromCart = (itemId) => {
    // Update cart items state
    setCartItems((prev) => {
      if (!prev[itemId] || prev[itemId].quantity <= 0) return prev;
      const updatedCart = { ...prev };
      // Remove item if quantity is 1, otherwise decrease quantity
      if (prev[itemId].quantity === 1) {
        delete updatedCart[itemId];
      } else {
        updatedCart[itemId] = {
          ...updatedCart[itemId],
          quantity: updatedCart[itemId].quantity - 1
        };
      }
      return updatedCart;
    });

    // Update backend cart if user is authenticated
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("http://localhost:5000/RemoveCart", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId: itemId.toString() }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Item removed from cart:", data))
        .catch((error) => console.error("Error removing from cart:", error));
    }
  };

  // Function to completely remove an item from the cart
  const removeItemFromCart = (itemId) => {
    // Update cart items state by removing the item
    setCartItems((prev) => {
      const updatedCart = { ...prev };
      delete updatedCart[itemId];
      return updatedCart;
    });

    // Update backend by making multiple API calls to remove all instances
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      const quantity = cartItems[itemId]?.quantity || 0;
      const promises = [];
      
      // Create a promise for each removal
      for (let i = 0; i < quantity; i++) {
        promises.push(
          fetch("http://localhost:5000/RemoveCart", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "auth-token": authToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ itemId: itemId.toString() }),
          })
        );
      }
      
      // Execute all removal promises
      Promise.all(promises)
        .then(() => console.log(`Item ${itemId} completely removed from cart`))
        .catch((error) => console.error("Error removing item from cart:", error));
    }
  };

  // Function to decrease cart item quantity (alias for removefromCart)
  const decreaseCartItem = (itemId) => {
    removefromCart(itemId);
  };

  // Function to increase cart item quantity (alias for addtoCart)
  const increaseCartItem = (itemId, size) => {
    addtoCart(itemId, size);
  };

  // Function to calculate total number of items in the cart
  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((sum, item) => {
      // Handle both number and object formats for backward compatibility
      const quantity = typeof item === 'number' ? item : (item?.quantity || 0);
      return sum + quantity;
    }, 0);
  };

  // Function to calculate total cart amount
  const getTotalCartAmount = () => {
    return Object.entries(cartItems).reduce((total, [itemId, item]) => {
      // Handle both number and object formats
      const quantity = typeof item === 'number' ? item : (item?.quantity || 0);
      const product = all_product.find((p) => p.id.toString() === itemId);
      // Add price * quantity to total if product exists
      return product ? total + (product.new_price * quantity) : total;
    }, 0);
  };

  // Function to add an item to favorites
  const addtoFavourite = (itemId, size) => {
    // Find product in all_products
    const product = all_product.find(p => p.id === Number(itemId));
    if (!product) return;

    // Check size availability
    const sizeData = product.sizes.find(s => s.size === size);
    const currentQuantity = favouriteItems[itemId]?.quantity || 0;

    // Prevent adding if stock is insufficient
    if (!sizeData || sizeData.quantity <= currentQuantity) {
      toast.error(`Only ${sizeData?.quantity || 0} items available for size ${size}`);
      return;
    }

    // Update favorite items state
    setFavouriteItems((prev) => ({
      ...prev,
      [itemId]: { 
        quantity: (prev[itemId]?.quantity || 0) + 1, 
        size: size || prev[itemId]?.size || 'N/A' 
      },
    }));

    // Update backend favorites if user is authenticated
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("http://localhost:5000/AddToFavourite", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId: itemId.toString(), size }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Added to Favourite:", data))
        .catch((error) => console.error("Error adding to favourite:", error));
    }
  };

  // Function to remove one instance of an item from favorites
  const removefromFavourite = (itemId) => {
    // Update favorite items state
    setFavouriteItems((prev) => {
      if (!prev[itemId] || prev[itemId].quantity <= 0) return prev;
      const updatedFavourite = { ...prev };
      // Remove item if quantity is 1, otherwise decrease quantity
      if (prev[itemId].quantity === 1) {
        delete updatedFavourite[itemId];
      } else {
        updatedFavourite[itemId] = { 
          ...updatedFavourite[itemId], 
          quantity: updatedFavourite[itemId].quantity - 1 
        };
      }
      return updatedFavourite;
    });

    // Update backend favorites if user is authenticated
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("http://localhost:5000/RemoveFavourite", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId: itemId.toString() }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Removed from Favourite:", data))
        .catch((error) => console.error("Error removing from favourite:", error));
    }
  };

  // Function to completely remove an item from favorites
  const removeItemFromFavourite = (itemId) => {
    // Update favorite items state by removing the item
    setFavouriteItems((prev) => {
      const updatedFavourite = { ...prev };
      delete updatedFavourite[itemId];
      return updatedFavourite;
    });
    
    // Update backend by making multiple API calls to remove all instances
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      const quantity = favouriteItems[itemId]?.quantity || 0;
      const promises = [];
      
      // Create a promise for each removal
      for (let i = 0; i < quantity; i++) {
        promises.push(
          fetch("http://localhost:5000/RemoveFavourite", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "auth-token": authToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ itemId: itemId.toString() }),
          })
        );
      }
      
      // Execute all removal promises
      Promise.all(promises)
        .then(() => console.log(`Item ${itemId} completely removed from favourites`))
        .catch((error) => console.error("Error removing item from favourites:", error));
    }
  };

  // Function to increase favorite item quantity
  const increaseFavouriteItem = (itemId) => {
    // Update favorite items state
    setFavouriteItems((prev) => ({
      ...prev,
      [itemId]: { 
        quantity: (prev[itemId]?.quantity || 0) + 1, 
        size: prev[itemId]?.size || 'N/A' 
      },
    }));

    // Update backend favorites if user is authenticated
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("http://localhost:5000/AddToFavourite", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, size: favouriteItems[itemId]?.size || 'N/A' }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Favourite updated:", data))
        .catch((error) => console.error("Error adding to favourite:", error));
    }
  };

  // Function to decrease favorite item quantity (alias for removefromFavourite)
  const decreaseFavouriteItem = (itemId) => {
    removefromFavourite(itemId);
  };

  // Function to calculate total number of favorite items
  const getTotalFavouriteItems = () => {
    return Object.values(favouriteItems).reduce((sum, item) => {
      // Handle both number and object formats
      const quantity = typeof item === 'number' ? item : (item?.quantity || 0);
      return sum + quantity;
    }, 0);
  };

  // Function to calculate total favorite items amount
  const getTotalFavouriteAmount = () => {
    return Object.entries(favouriteItems).reduce((total, [itemId, item]) => {
      // Handle both number and object formats
      const quantity = typeof item === 'number' ? item : (item?.quantity || 0);
      const itemInfo = all_product.find((product) => product.id.toString() === itemId);
      // Add price * quantity to total if product exists
      return itemInfo ? total + (itemInfo.new_price * quantity) : total;
    }, 0);
  };

  // Function to clear all cart items
  const clearCart = () => {
    // Reset cart items state
    setCartItems(getDefaultCart());
    // Clear cart in backend if user is authenticated
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("http://localhost:5000/clearcart", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
        .then((response) => response.json())
        .then((data) => console.log("Cart cleared:", data))
        .catch((error) => console.error("Error clearing cart:", error));
    }
  };

  // Function to clear all favorite items
  const clearFavourite = () => {
    // Reset favorite items state
    setFavouriteItems(getDefaultFavourite());
    // Clear favorites in backend if user is authenticated
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("http://localhost:5000/clearfavourite", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
        .then((response) => response.json())
        .then((data) => console.log("Favourites cleared:", data))
        .catch((error) => console.error("Error clearing favourites:", error));
    }
  };

  // Object containing all context values to be shared with child components
  const contextValue = {
    all_product,
    cartItems,
    favouriteItems,
    addtoCart,
    removefromCart,
    removeItemFromCart,
    addtoFavourite,
    removefromFavourite,
    removeItemFromFavourite,
    getTotalCartAmount,
    getTotalCartItems,
    getTotalFavouriteItems,
    getTotalFavouriteAmount,
    decreaseCartItem,
    increaseCartItem,
    increaseFavouriteItem,
    decreaseFavouriteItem,
    clearCart,
    clearFavourite,
    fetchAllProducts,
    refreshProduct,
    userName,
    setUserName,
    fetchUserName,
    resetState,
    initializeUserData,
    isLoading
  };

  // Provide context values to child components
  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;