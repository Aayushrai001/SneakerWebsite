import React, { useEffect, useState } from "react";
import "./NewCollections.css";
import Home_image from '../assets/Home1.png';
import arrow from '../assets/arrow.png';
import Item from "../Item/Item";
import { useNavigate } from 'react-router-dom';

// Functional component: NewCollections
const NewCollections = () => {
  // useState hook to manage state for new collection items
  const [newCollection, setNewCollection] = useState([]);

  // Hook to programmatically navigate to a different route
  const navigate = useNavigate();

  // useEffect to fetch collection data from backend on component mount
  useEffect(() => {
    // Async function to fetch data from backend API
    const fetchCollections = async () => {
      try {
        // Fetching new collections from local server endpoint
        const response = await fetch("http://localhost:5000/newcollections");
        // Parsing JSON response
        const data = await response.json();
        // Setting the received data to state
        setNewCollection(data);
      } catch (error) {
        // Logging error if fetch fails
        console.error("Error fetching new collections:", error);
      }
    };

    // Triggering the fetch function
    fetchCollections();
  }, []); // Empty dependency array ensures this runs only once when component mounts

  // Handler function to navigate to search page when "Shop Now" is clicked
  const handleShopNow = () => {
    navigate('/search');
  };

  // Returning the component's JSX layout
  return (
    <div className="new-collections">
      {/* Header section with banner */}
      <div className="new-collections-header">
        <div className="banner-container">
          {/* Optional dark overlay for readability */}
          <div className="banner-overlay"></div>
          {/* Background banner image */}
          <img className="banner-img" src={Home_image} alt="New Arrivals" />
          {/* Content that appears on top of the banner */}
          <div className="banner-content">
            <div className="banner-text">
              <h1>Our Collection</h1>
              <h1>You May Like</h1>
              <div className="banner">
                {/* Shop Now button with arrow icon, triggers handleShopNow */}
                <button className="banner-butt" onClick={handleShopNow}>
                  Shop Now <img src={arrow} alt="Arrow" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section title and divider */}
        <h1>NEW COLLECTIONS</h1>
        <hr />
      </div>

      {/* Product list rendering all new collection items */}
      <div className="collections">
        {/* Iterating over collection array and rendering each item with Item component */}
        {newCollection.map((item) => (
          <Item
            key={item.id}             // Unique key for each item
            id={item.id}              // Passing id as prop
            name={item.name}          // Passing name as prop
            image={item.image}        // Passing image URL as prop
            new_price={item.new_price} // Passing price as prop
          />
        ))}
      </div>
    </div>
  );
};

export default NewCollections;