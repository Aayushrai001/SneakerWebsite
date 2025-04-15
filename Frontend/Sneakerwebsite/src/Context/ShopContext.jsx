import React, { createContext, useEffect, useState } from "react";

export const ShopContext = createContext(null);

const getDefaultCart = () => ({});
const getDefaultFavourite = () => ({});

const ShopContextProvider = (props) => {
  const [all_product, setAll_Product] = useState([]);
  const [cartItems, setCartItems] = useState(getDefaultCart());
  const [favouriteItems, setFavouriteItems] = useState(getDefaultFavourite());

  // Function to fetch all products
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

  useEffect(() => {
    fetchAllProducts();

    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("http://localhost:5000/getcart", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
        .then((response) => response.json())
        .then((data) => setCartItems(data))
        .catch((error) => console.error("Error fetching cart data:", error));

      fetch("http://localhost:5000/getfavourite", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
        .then((response) => response.json())
        .then((data) => setFavouriteItems(data))
        .catch((error) => console.error("Error fetching favourite data:", error));
    }
  }, []);

  const addtoCart = (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
    const authToken = localStorage.getItem("auth-token");
    if (authToken) {
      fetch("http://localhost:5000/AddToCart", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "auth-token": authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Cart updated:", data))
        .catch((error) => console.error("Error adding to cart:", error));
    }
  };

  const removefromCart = (itemId) => {
    setCartItems((prev) => {
      if (!prev[itemId] || prev[itemId] <= 0) return prev;
      const updatedCart = { ...prev };
      updatedCart[itemId] -= 1;
      if (updatedCart[itemId] === 0) delete updatedCart[itemId];
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
        body: JSON.stringify({ itemId }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Item removed from cart:", data))
        .catch((error) => console.error("Error removing from cart:", error));
    }
  };

  const decreaseCartItem = (itemId) => {
    removefromCart(itemId);
  };

  const increaseCartItem = (itemId) => {
    addtoCart(itemId);
  };

  const getTotalCartAmount = () => {
    return Object.entries(cartItems).reduce((total, [itemId, quantity]) => {
      const itemInfo = all_product.find((product) => product.id === Number(itemId));
      return itemInfo ? total + (itemInfo.new_price * quantity) : total;
    }, 0);
  };

  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((sum, count) => sum + (count || 0), 0);
  };

  const addtoFavourite = (itemId) => {
    setFavouriteItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
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
        body: JSON.stringify({ itemId }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Added to Favourite:", data))
        .catch((error) => console.error("Error adding to favourite:", error));
    }
  };

  const removefromFavourite = (itemId) => {
    setFavouriteItems((prev) => {
      if (!prev[itemId] || prev[itemId] <= 0) return prev;
      const updatedFavourite = { ...prev };
      updatedFavourite[itemId] -= 1;
      if (updatedFavourite[itemId] === 0) delete updatedFavourite[itemId];
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
    addtoFavourite(itemId);
  };

  const decreaseFavouriteItem = (itemId) => {
    removefromFavourite(itemId);
  };

  const getTotalFavouriteItems = () => {
    return Object.values(favouriteItems).reduce((sum, count) => sum + (count || 0), 0);
  };

  const getTotalFavouriteAmount = () => {
    return Object.entries(favouriteItems).reduce((total, [itemId, quantity]) => {
      const itemInfo = all_product.find((product) => product.id === Number(itemId));
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
    fetchAllProducts, // Expose fetchAllProducts to refresh product data
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;