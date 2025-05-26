import React, { useEffect, useState } from "react"; 
import "./RelatedProducts.css"; 
import Item from "../Item/Item"; 

// Declaring a functional component named RelatedProducts
const RelatedProducts = () => {
  // Declaring a state variable 'popularProducts' to store the list of fetched popular products
  const [popularProducts, setPopularProducts] = useState([]);

  // useEffect hook runs after the component mounts
  useEffect(() => {
    // Defining an asynchronous function to fetch popular products from the backend API
    const fetchPopular = async () => {
      try {
        // Sending a GET request to the backend API endpoint
        const response = await fetch("http://localhost:5000/popular");
        // Parsing the JSON response
        const data = await response.json();
        // Updating the state with the fetched popular products
        setPopularProducts(data);
      } catch (error) {
        // Handling errors during the fetch request
        console.error("Error fetching popular collections:", error);
      }
    };

    // Calling the fetch function when the component mounts
    fetchPopular();
  }, []); // Empty dependency array means this effect runs only once (componentDidMount)

  // Rendering the component UI
  return (
    <div className="popular">
      {/* Heading for the section */}
      <h1>Product You May Like</h1>
      {/* Horizontal line as a separator */}
      <hr />
      {/* Container for the list of popular product items */}
      <div className="popular-item">
        {/* Mapping through the popularProducts array and rendering each product using the Item component */}
        {popularProducts.map((item) => (
          <Item
            key={item.id} // Unique key prop for React list rendering
            id={item.id} // Passing product ID as a prop
            name={item.name} // Passing product name as a prop
            image={item.image} // Passing product image URL as a prop
            new_price={item.new_price} // Passing product new price as a prop
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
