import React, { createContext, useState } from "react";
import all_product from "../Component/assets/all_product";

export const ShopContext = createContext(null);

const getDefaultCart = () => {
    let cart = {};
    for (let index = 0; index < all_product.length; index++) {
        cart[index] = 0;
    }
    return cart;
};

const getDefaultFavourite = () => {
    let favourite = {};
    for (let index = 0; index < all_product.length; index++) {
        favourite[index] = 0;
    }
    return favourite;
};

const ShopContextProvider = (props) => {
    const [cartItems, setCartItems] = useState(getDefaultCart());
    const [favouriteItems, setFavouriteItems] = useState(getDefaultFavourite());

    // Add to cart function
    const addtoCart = (itemId) => {
        setCartItems((prev) => {
            const updatedCart = { ...prev, [itemId]: prev[itemId] + 1 };
            console.log("Updated Cart:", updatedCart);
            return updatedCart;
        });
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

    //total cost pf cart item
    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = all_product.find((product) => product.id === Number(item));
                totalAmount += itemInfo.new_price * cartItems[item];
            }
        }
        return totalAmount;
    };

    //get totol number of item
    const getTotalCartItems = () => {
        let totalItem = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                totalItem += cartItems[item];
            }
        }
        return totalItem;
    };

    // Add to favourite function
    const addtoFavourite = (itemId) => {
        setFavouriteItems((prev) => {
            const updatedFavourite = { ...prev, [itemId]: prev[itemId] + 1 };
            console.log("Updated Favourite:", updatedFavourite);
            return updatedFavourite;
        });
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

    //total cost of Favourite item
    const getTotalFavouriteAmount = () => {
        let totalAmount = 0;
        for (const item in favouriteItems) {
            if (favouriteItems[item] > 0) {
                let itemInfo = all_product.find((product) => product.id === Number(item));
                totalAmount += itemInfo.new_price * favouriteItems[item];
            }
        }
        return totalAmount;
    };

    //get totol number of item
    const getTotalFavouriteItems = () => {
        let totalItem = 0;
        for (const item in favouriteItems) {
            if (favouriteItems[item] > 0) {
                totalItem += favouriteItems[item];
            }
        }
        return totalItem;
    };
    

    const contextValue = { getTotalCartAmount, getTotalCartItems, all_product, cartItems, addtoCart, removefromCart, favouriteItems, addtoFavourite, removefromFavourite,
        getTotalFavouriteAmount, getTotalFavouriteItems };

    return (
        <ShopContext.Provider value={contextValue}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;
