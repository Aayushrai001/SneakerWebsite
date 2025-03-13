import React, { useEffect, useState } from 'react';
import './ListProduct.css';
import cross_icon from '../../assets/cross_icon.png';

const ListProduct = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Search input state

  // Fetch products from API
  const fetchInfo = async () => {
    try {
      const res = await fetch('http://localhost:5000/allproducts');
      const data = await res.json();
      setAllProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  // Function to remove a product
  const removeProduct = async (id) => {
    try {
      const response = await fetch('http://localhost:5000/removeproduct', {
        method: 'POST', // Change to 'DELETE' if your backend expects it
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id }) // Ensure backend expects this format
      });

      const data = await response.json();
      console.log("Server Response:", data); // Debugging

      if (data.success) {
        setAllProducts((prevProducts) =>
          prevProducts.filter((product) => product.id !== id)
        ); // Update UI after deletion
      } else {
        console.error("Failed to delete product:", data.message);
      }
    } catch (error) {
      console.error("Error removing product:", error);
    }
  };

  // Filter products based on search term
  const filteredProducts = allProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='list-product'>
      <h1>All Products List</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by product name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="listproduct-search"
      />

      <div className="listproduct-format-main">
        <p>Product</p>
        <p>Name</p>
        <p>Price</p>
        <p>Category</p>
        <p>Remove</p>
      </div>

      <div className="listproduct-allproducts">
        <hr />
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => (
            <div key={index} className="listproduct-forrmat-main listproduct">
              <img src={product.image} alt={product.name} className='listproduct-product-icon' />
              <p>{product.name}</p>
              <p>Rs.{product.new_price}</p>
              <p>{product.category}</p>
              <img 
                onClick={() => removeProduct(product.id)} 
                src={cross_icon} 
                alt="Remove" 
                className='listproduct-remove-icon' 
              />
            </div>
          ))
        ) : (
          <p className="no-products-message">No products found</p>
        )}
      </div>
    </div>
  );
};

export default ListProduct;
