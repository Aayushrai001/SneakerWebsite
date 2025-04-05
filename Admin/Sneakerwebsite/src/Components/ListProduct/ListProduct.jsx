import React, { useEffect, useState } from 'react';
import './ListProduct.css';
import cross_icon from '../../assets/cross_icon.png';

const ListProduct = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleProductsCount, setVisibleProductsCount] = useState(3);
  const [error, setError] = useState(null); // Added error state

  const fetchInfo = async () => {
    try {
      const res = await fetch('http://localhost:5000/allproducts');
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      setAllProducts(data);
      setError(null); // Clear error on success
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products. Please try again later.");
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const removeProduct = async (id) => {
    try {
      const response = await fetch('http://localhost:5000/removeproduct', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id })
      });

      const data = await response.json();
      if (data.success) {
        setAllProducts(prevProducts => prevProducts.filter(product => product.id !== id));
        alert("Product removed successfully");
      } else {
        alert("Failed to remove product: " + data.message);
      }
    } catch (error) {
      console.error("Error removing product:", error);
      alert("Error removing product");
    }
  };

  const filteredProducts = allProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleShowMore = () => {
    setVisibleProductsCount(prev => prev === 3 ? filteredProducts.length : 3);
  };

  return (
    <div className='list-product'>
      <h1>All Products List</h1>
      <input
        type="text"
        placeholder="Search by product name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="listproduct-search"
      />
      {error && <p className="error-message">{ quantitéerror}</p>} {/* Display error */}
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
          filteredProducts.slice(0, visibleProductsCount).map((product) => (
            <React.Fragment key={product.id}>
              <div className="listproduct-forrmat-main listproduct">
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
              <hr />
            </React.Fragment>
          ))
        ) : (
          <p className="no-products-message">No products found</p>
        )}
      </div>
      {filteredProducts.length > 3 && (
        <button onClick={toggleShowMore} className="see-more-btn">
          {visibleProductsCount === 3 ? 'See More' : 'Show Less'}
        </button>
      )}
    </div>
  );
};

export default ListProduct;