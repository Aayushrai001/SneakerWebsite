import React, { useEffect, useState } from "react";
import "./Popular.css";
import Item from "../Item/Item";
import Home_img from '../assets/Home2.png';
import arrow from '../assets/arrow.png';
import { useNavigate } from 'react-router-dom';

// Define the Popular component
const Popular = () => {
  const [popularProducts, setPopularProducts] = useState([]); // State to store fetched popular products
  const navigate = useNavigate(); // useNavigate hook to programmatically navigate

  // useEffect hook to fetch popular products once component mounts
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        // Fetch popular products from backend API
        const response = await fetch("http://localhost:5000/popular");
        const data = await response.json(); // Parse JSON data from response
        setPopularProducts(data); // Update state with fetched data
      } catch (error) {
        // Log any errors that occur during fetching
        console.error("Error fetching popular collections:", error);
      }
    };

    fetchPopular(); // Call the async fetch function
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handler to navigate to the search page when 'Shop Now' is clicked
  const handleShopNow = () => {
    navigate('/search');
  };

  return (
    <div className="popular-container">
      {/* Featured banner section */}
      <div className="featured-banner">
        <div className="banner-overlay"></div> {/* Optional overlay for styling */}
        <img className="banner-image" src={Home_img} alt="New Arrivals" /> {/* Banner background image */}
        <div className="banner-content">
          <div className="banner-text">
            <h2>New Collection</h2> {/* Main heading */}
            <div className="banner-heading">
              <p>Step into Style</p>
              <p>Walk in Comfort</p> {/* Taglines */}
            </div>
            <div className="banner-description">
              <p>Discover our latest sneaker collection featuring premium designs,</p>
              <p>unmatched comfort, and the hottest trends in footwear.</p> {/* Brief product description */}
            </div>
            {/* Call-to-action button to redirect to shop/search page */}
            <div className="banner-cta">
              <button className="banner-button" onClick={handleShopNow}>
                Shop Now <img src={arrow} alt="Arrow" /> {/* Arrow icon */}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popular products section */}
      <div className="popular">
        <div className="popular-header">
          <h1>POPULAR IN ALL</h1> {/* Section title */}
          <hr /> {/* Horizontal line under the heading */}
        </div>
        {/* Grid/list of individual popular product items */}
        <div className="popular-item">
          {popularProducts.map((item) => (
            <Item
              key={item.id} // Unique key for list rendering
              id={item.id} // Product ID passed as prop
              name={item.name} // Product name passed as prop
              image={item.image} // Product image URL
              new_price={item.new_price} // New price displayed
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Popular;