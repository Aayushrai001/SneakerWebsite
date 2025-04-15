import React, { useEffect, useState } from "react";
import "./RelatedProducts.css";
import Item from "../Item/Item";

const RelatedProducts = () => {
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
    <div className="popular">
      <h1>Related Product</h1>
      <hr />
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
  );
};

export default RelatedProducts;

