import React, { createContext, useEffect, useState } from "react";

export const ShopContext = createContext(null);

const getDefaultCart = () => ({});
const getDefaultFavourite = () => ({});

const ShopContextProvider = (props) => {
    const [all_product, setAll_Product] = useState([]);
    const [cartItems, setCartItems] = useState(getDefaultCart());
    const [favouriteItems, setFavouriteItems] = useState(getDefaultFavourite());

    useEffect(() => {
        // Fetch all products from the backend
        fetch("http://localhost:5000/allproducts")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                setAll_Product(data);
                console.log("Fetched Products:", data);
            })
            .catch((error) => console.error("Error fetching data:", error));

        // Fetch cart data if the user is authenticated
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
                .then((data) => {
                    setCartItems(data);
                })
                .catch((error) => console.error("Error fetching cart data:", error));
        }

        if (authToken) {
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
                .then((data) => {
                    setFavouriteItems(data);
                })
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
            if (prev[itemId] > 0) {
                return { ...prev, [itemId]: prev[itemId] - 1 };
            }
            return prev;
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

    const getTotalFavouriteItems = () => {
        return Object.values(favouriteItems).reduce((sum, count) => sum + (count || 0), 0);
    };

    // function for Favourite Amount
    const getTotalFavouriteAmount = () => {
        return Object.entries(favouriteItems).reduce((total, [itemId, quantity]) => {
            const itemInfo = all_product.find((product) => product.id === Number(itemId));
            return itemInfo ? total + (itemInfo.new_price * quantity) : total;
        }, 0);
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
    };

    return (
        <ShopContext.Provider value={contextValue}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;
