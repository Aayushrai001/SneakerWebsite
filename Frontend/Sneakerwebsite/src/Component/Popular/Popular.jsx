import React, { useEffect, useState } from "react";
import "./Popular.css";
import Item from "../Item/Item";
import Home_img from '../assets/Home2.png';
import arrow from '../assets/arrow.png';

const Popular = () => {
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const response = await fetch("http://localhost:5000/popular");
        const data = await response.json();
        setPopularProducts(data);
      } catch (error) {
        console.error("Error fetching popular collections:", error);
      }
    };

    fetchPopular();
  }, []);

  return (
    <div className="popular-container">
      <div className="featured-banner">
        <div className="banner-overlay"></div>
        <img className="banner-image" src={Home_img} alt="New Arrivals" />
        <div className="banner-content">
          <div className="banner-text">
            <h2>New Collection</h2>
            <div className="banner-heading">
              <p>Step into Style</p>
              <p>Walk in Comfort</p>
            </div>
            <div className="banner-description">
              <p>Discover our latest sneaker collection featuring premium designs,</p>
              <p>unmatched comfort, and the hottest trends in footwear.</p>
            </div>
            <div className="banner-cta">
              <button className="banner-button">
                Shop Now <img src={arrow} alt="Arrow" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="popular">
        <div className="popular-header">
          <h1>POPULAR IN ALL</h1>
          <hr />
        </div>
        <div className="popular-item">
          {popularProducts.map((item) => (
            <Item
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Popular;