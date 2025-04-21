import React, { createContext, useEffect, useState } from "react";

export const ShopContext = createContext(null);

const getDefaultCart = () => ({});
const getDefaultFavourite = () => ({});

const ShopContextProvider = (props) => {
  const [all_product, setAll_Product] = useState([]);
  const [cartItems, setCartItems] = useState(getDefaultCart());
  const [favouriteItems, setFavouriteItems] = useState(getDefaultFavourite());
  const [userName, setUserName] = useState("");

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

  // Fetch cart and favorite data on component mount
  const fetchCartAndFavorites = async (token) => {
    try {
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
      
      if (cartResponse.ok) {
        const cartData = await cartResponse.json();
        const updatedCart = {};
        Object.keys(cartData).forEach((id) => {
          updatedCart[id] = cartData[id];
        });
        setCartItems(updatedCart);
      }

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
      
      if (favoriteResponse.ok) {
        const favoriteData = await favoriteResponse.json();
        const updatedFavourite = {};
        Object.keys(favoriteData).forEach((id) => {
          updatedFavourite[id] = { quantity: favoriteData[id], size: "N/A" }; // Normalize to object with default size
        });
        setFavouriteItems(updatedFavourite);
      }
    } catch (error) {
      console.error("Error fetching cart and favorite data:", error);
    }
  };

  useEffect(() => {
    fetchAllProducts();

    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetchUserName(authToken);
      fetchCartAndFavorites(authToken);
    }
  }, []);

  const addtoCart = (itemId, size) => {
    setCartItems((prev) => {
      const currentQuantity = prev[itemId.toString()]?.quantity || 0;
      return {
        ...prev,
        [itemId.toString()]: { quantity: currentQuantity + 1, size },
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
      const currentQuantity = prev[itemId.toString()]?.quantity || 0;
      if (currentQuantity <= 0) return prev;
      const updatedCart = { ...prev };
      updatedCart[itemId.toString()] = { 
        ...updatedCart[itemId.toString()], 
        quantity: currentQuantity - 1 
      };
      if (updatedCart[itemId.toString()].quantity === 0) delete updatedCart[itemId.toString()];
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

  const decreaseCartItem = (itemId) => {
    removefromCart(itemId);
  };

  const increaseCartItem = (itemId, size) => {
    addtoCart(itemId, size);
  };

  const getTotalCartAmount = () => {
    return Object.entries(cartItems).reduce((total, [itemId, item]) => {
      const quantity = item?.quantity || 0;
      const product = all_product.find((p) => p.id.toString() === itemId);
      return product ? total + (product.new_price * quantity) : total;
    }, 0);
  };

  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((sum, item) => sum + (item?.quantity || 0), 0);
  };

  const addtoFavourite = (itemId, size) => {
    setFavouriteItems((prev) => ({
      ...prev,
      [itemId]: { quantity: (prev[itemId]?.quantity || 0) + 1, size },
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
        body: JSON.stringify({ itemId, size }),
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
      updatedFavourite[itemId] = { ...updatedFavourite[itemId], quantity: updatedFavourite[itemId].quantity - 1 };
      if (updatedFavourite[itemId].quantity === 0) delete updatedFavourite[itemId];
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
        body: JSON.stringify({ itemId }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Removed from Favourite:", data))
        .catch((error) => console.error("Error removing from favourite:", error));
    }
  };

  const increaseFavouriteItem = (itemId) => {
    setFavouriteItems((prev) => ({
      ...prev,
      [itemId]: { quantity: (prev[itemId]?.quantity || 0) + 1, size: prev[itemId]?.size },
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
        body: JSON.stringify({ itemId, size: favouriteItems[itemId]?.size }),
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

  const clearCart = async () => {
    setCartItems(getDefaultCart());
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      try {
        const response = await fetch("http://localhost:5000/clearcart", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "auth-token": authToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        
        if (response.ok) {
          console.log("Cart cleared successfully");
        } else {
          console.error("Failed to clear cart");
        }
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    }
  };

  const clearFavourite = async () => {
    setFavouriteItems(getDefaultFavourite());
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      try {
        const response = await fetch("http://localhost:5000/clearfavourite", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "auth-token": authToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        
        if (response.ok) {
          console.log("Favourites cleared successfully");
        } else {
          console.error("Failed to clear favourites");
        }
      } catch (error) {
        console.error("Error clearing favourites:", error);
      }
    }
  };

  const contextValue = {
    all_product,
    cartItems,
    favouriteItems,
    addtoCart,
    removefromCart,
    addtoFavourite,
    removefromFavourite,
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
    userName,
    setUserName,
    fetchUserName,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;