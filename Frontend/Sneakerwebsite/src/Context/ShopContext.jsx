import React, { createContext, useEffect, useState } from "react";

export const ShopContext = createContext(null);

const getDefaultCart = () => ({});
const getDefaultFavourite = () => ({});

const ShopContextProvider = (props) => {
  const [all_product, setAll_Product] = useState([]);
  const [cartItems, setCartItems] = useState(getDefaultCart());
  const [favouriteItems, setFavouriteItems] = useState(getDefaultFavourite());
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const resetState = () => {
    setCartItems(getDefaultCart());
    setFavouriteItems(getDefaultFavourite());
    setUserName("");
  };

  const initializeUserData = async (token) => {
    setIsLoading(true);
    try {
      // Fetch username
      const nameResponse = await fetch("http://localhost:5000/getusername", {
        method: "GET",
        headers: {
          "auth-token": token,
          "Content-Type": "application/json",
        },
      });
      const nameData = await nameResponse.json();
      if (nameData.success) {
        setUserName(nameData.name);
      }

      // Fetch cart data
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
      Object.keys(cartData).forEach((id) => {
        if (typeof cartData[id] === 'number') {
          updatedCart[id] = { quantity: cartData[id], size: 'N/A' };
        } else if (typeof cartData[id] === 'object') {
          updatedCart[id] = cartData[id];
        }
      });
      setCartItems(updatedCart);

      // Fetch favorite data
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
      Object.keys(favoriteData).forEach((id) => {
        if (typeof favoriteData[id] === 'number') {
          updatedFavourite[id] = { quantity: favoriteData[id], size: 'N/A' };
        } else if (typeof favoriteData[id] === 'object') {
          updatedFavourite[id] = favoriteData[id];
        }
      });
      setFavouriteItems(updatedFavourite);
    } catch (error) {
      console.error("Error initializing user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/allproducts");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setAll_Product(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const refreshProduct = async (productId) => {
    try {
      const response = await fetch(`http://localhost:5000/allproducts`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      
      // Find the updated product without changing the entire state
      const updatedProduct = data.find(p => p.id === productId);
      
      // Only update if there are actual changes
      if (updatedProduct) {
        setAll_Product(prevProducts => {
          // Check if the product has actually changed
          const currentProduct = prevProducts.find(p => p.id === productId);
          if (JSON.stringify(currentProduct) === JSON.stringify(updatedProduct)) {
            return prevProducts; // No changes, return the same array reference
          }
          
          // Only update the specific product
          return prevProducts.map(product => {
            if (product.id === productId) {
              return updatedProduct;
            }
            return product;
          });
        });
      }
    } catch (error) {
      console.error("Error refreshing product:", error);
    }
  };

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
      if (data.success) {
        setUserName(data.name);
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  useEffect(() => {
    fetchAllProducts();
    const authToken = localStorage.getItem("auth-token");
    
    if (!authToken) {
      resetState();
      setIsLoading(false);
      return;
    }

    initializeUserData(authToken);
  }, []);

  const addtoCart = (itemId, size) => {
    setCartItems((prev) => {
      // Initialize the cart item if it doesn't exist
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

  const removefromCart = (itemId) => {
    setCartItems((prev) => {
      if (!prev[itemId] || prev[itemId].quantity <= 0) return prev;
      const updatedCart = { ...prev };
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

  // New function to completely remove an item from cart
  const removeItemFromCart = (itemId) => {
    setCartItems((prev) => {
      const updatedCart = { ...prev };
      delete updatedCart[itemId];
      return updatedCart;
    });

    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      // Make multiple API calls to completely remove the item
      const quantity = cartItems[itemId]?.quantity || 0;
      const promises = [];
      
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
      
      Promise.all(promises)
        .then(() => console.log(`Item ${itemId} completely removed from cart`))
        .catch((error) => console.error("Error removing item from cart:", error));
    }
  };

  const decreaseCartItem = (itemId) => {
    removefromCart(itemId);
  };

  const increaseCartItem = (itemId, size) => {
    addtoCart(itemId, size);
  };

  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((sum, item) => {
      const quantity = typeof item === 'number' ? item : (item?.quantity || 0);
      return sum + quantity;
    }, 0);
  };

  const getTotalCartAmount = () => {
    return Object.entries(cartItems).reduce((total, [itemId, item]) => {
      const quantity = typeof item === 'number' ? item : (item?.quantity || 0);
      const product = all_product.find((p) => p.id.toString() === itemId);
      return product ? total + (product.new_price * quantity) : total;
    }, 0);
  };

  const addtoFavourite = (itemId, size) => {
    setFavouriteItems((prev) => ({
      ...prev,
      [itemId]: { 
        quantity: (prev[itemId]?.quantity || 0) + 1, 
        size: size || prev[itemId]?.size || 'N/A' 
      },
    }));
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

  const removefromFavourite = (itemId) => {
    setFavouriteItems((prev) => {
      if (!prev[itemId] || prev[itemId].quantity <= 0) return prev;
      const updatedFavourite = { ...prev };
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

  // New function to completely remove an item from favorites
  const removeItemFromFavourite = (itemId) => {
    setFavouriteItems((prev) => {
      const updatedFavourite = { ...prev };
      delete updatedFavourite[itemId];
      return updatedFavourite;
    });
    
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      // Make multiple API calls to completely remove the item
      const quantity = favouriteItems[itemId]?.quantity || 0;
      const promises = [];
      
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
      
      Promise.all(promises)
        .then(() => console.log(`Item ${itemId} completely removed from favourites`))
        .catch((error) => console.error("Error removing item from favourites:", error));
    }
  };

  const increaseFavouriteItem = (itemId) => {
    setFavouriteItems((prev) => ({
      ...prev,
      [itemId]: { 
        quantity: (prev[itemId]?.quantity || 0) + 1, 
        size: prev[itemId]?.size || 'N/A' 
      },
    }));
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

  const decreaseFavouriteItem = (itemId) => {
    removefromFavourite(itemId);
  };

  const getTotalFavouriteItems = () => {
    return Object.values(favouriteItems).reduce((sum, item) => {
      // Handle both number and object cases
      const quantity = typeof item === 'number' ? item : (item?.quantity || 0);
      return sum + quantity;
    }, 0);
  };

  const getTotalFavouriteAmount = () => {
    return Object.entries(favouriteItems).reduce((total, [itemId, item]) => {
      const quantity = typeof item === 'number' ? item : (item?.quantity || 0);
      const itemInfo = all_product.find((product) => product.id.toString() === itemId);
      return itemInfo ? total + (itemInfo.new_price * quantity) : total;
    }, 0);
  };

  const clearCart = () => {
    setCartItems(getDefaultCart());
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

  const clearFavourite = () => {
    setFavouriteItems(getDefaultFavourite());
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

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;