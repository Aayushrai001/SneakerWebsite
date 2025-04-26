import React, { useEffect, useState } from "react";
import "./NewCollections.css";
import Home_image from '../assets/Home1.png';
import arrow from '../assets/arrow.png';
import Item from "../Item/Item";
import { useNavigate } from 'react-router-dom';

const NewCollections = () => {
  const [newCollection, setNewCollection] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch("http://localhost:5000/newcollections");
        const data = await response.json();
        setNewCollection(data);
      } catch (error) {
        console.error("Error fetching new collections:", error);
      }
    };

    fetchCollections();
  }, []);

  const handleShopNow = () => {
    navigate('/search');
  };

  return (
    <div className="new-collections">
      <div className="new-collections-header">
        <div className="banner-container">
          <div className="banner-overlay"></div>
          <img className="banner-img" src={Home_image} alt="New Arrivals" />
          <div className="banner-content">
            <div className="banner-text">
              <h1>Our Collection</h1>
              <h1>You May Like</h1>
              <div className="banner">
                <button className="banner-butt" onClick={handleShopNow}>
                  Shop Now <img src={arrow} alt="Arrow" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <h1>NEW COLLECTIONS</h1>
        <hr />
      </div>
      <div className="collections">
        {newCollection.map((item) => (
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
  );
};

export default NewCollections;
