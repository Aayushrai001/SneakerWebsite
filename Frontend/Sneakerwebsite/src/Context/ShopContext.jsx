import React, { createContext, useEffect, useState } from "react";

export const ShopContext = createContext(null);

const getDefaultCart = () => ({});
const getDefaultFavourite = () => ({});

const ShopContextProvider = (props) => {
    const [all_product, setAll_Product] = useState([]);
    const [cartItems, setCartItems] = useState(getDefaultCart());
    const [favouriteItems, setFavouriteItems] = useState(getDefaultFavourite());

    useEffect(() => {
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
    }, []);

    // Add to cart function
    const addtoCart = (itemId) => {
        setCartItems((prev) => ({...prev,[itemId]: prev[itemId]+1}));
        
    };

    // Remove from cart function
    const removefromCart = (itemId) => {
        setCartItems((prev) => {
            if (prev[itemId] > 0) {
                return { ...prev, [itemId]: prev[itemId] - 1 };
            }
            return prev;
        });
    };

    // Get total cost of cart items
    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                const itemInfo = all_product.find((product) => product.id === Number(item));
                if (itemInfo) {
                    totalAmount += itemInfo.new_price * cartItems[item];
                }
            }
        }
        return totalAmount;
    };

    // Get total number of cart items
    const getTotalCartItems = () => {
        return Object.values(cartItems).reduce((sum, count) => sum + count, 0);
    };

    // Add to favourite function
    const addtoFavourite = (itemId) => {
        setFavouriteItems((prev) => ({
            ...prev,
            [itemId]: (prev[itemId] || 0) + 1,
        }));
    };

    // Remove from favourite function
    const removefromFavourite = (itemId) => {
        setFavouriteItems((prev) => {
            if (prev[itemId] > 0) {
                return { ...prev, [itemId]: prev[itemId] - 1 };
            }
            return prev;
        });
    };

    // Get total cost of favourite items
    const getTotalFavouriteAmount = () => {
        let totalAmount = 0;
        for (const item in favouriteItems) {
            if (favouriteItems[item] > 0) {
                const itemInfo = all_product.find((product) => product.id === Number(item));
                if (itemInfo) {
                    totalAmount += itemInfo.new_price * favouriteItems[item];
                }
            }
        }
        return totalAmount;
    };

    // Get total number of favourite items
    const getTotalFavouriteItems = () => {
        return Object.values(favouriteItems).reduce((sum, count) => sum + count, 0);
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
        getTotalFavouriteAmount,
        getTotalFavouriteItems,
    };

    return (
        <ShopContext.Provider value={contextValue}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;
