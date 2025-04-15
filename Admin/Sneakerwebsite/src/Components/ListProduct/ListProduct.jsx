import React, { useEffect, useState } from 'react';
import './ListProduct.css';
import cross_icon from '../../assets/cross_icon.png';

const ListProduct = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState(""); // State for filtering by category
  const [visibleProductsCount, setVisibleProductsCount] = useState(3);
  const [error, setError] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null); // Track expanded product
  const [restockData, setRestockData] = useState({}); // Track restock inputs

  const fetchInfo = async () => {
    try {
      const res = await fetch('http://localhost:5000/allproducts');
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      setAllProducts(data);
      setError(null);
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
        body: JSON.stringify({ id: id }),
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

  const handleRestock = async (productId) => {
    const sizesToUpdate = restockData[productId] || [];
    if (!sizesToUpdate.length) {
      alert("Please add at least one size and quantity to restock.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/restockproduct', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId, sizes: sizesToUpdate }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchInfo(); // Refresh product list
        setRestockData(prev => ({ ...prev, [productId]: [] })); // Clear restock inputs
        alert("Product restocked successfully");
      } else {
        alert("Failed to restock product: " + data.message);
      }
    } catch (error) {
      console.error("Error restocking product:", error);
      alert("Error restocking product");
    }
  };

  const handleAddSizeInput = (productId) => {
    setRestockData(prev => ({
      ...prev,
      [productId]: [...(prev[productId] || []), { size: "", quantity: "" }],
    }));
  };

  const handleSizeChange = (productId, index, field, value) => {
    setRestockData(prev => {
      const updatedSizes = [...(prev[productId] || [])];
      updatedSizes[index] = { ...updatedSizes[index], [field]: value };
      return { ...prev, [productId]: updatedSizes };
    });
  };

  const toggleProductDetails = (productId) => {
    setExpandedProductId(prev => (prev === productId ? null : productId));
  };

  const filteredProducts = allProducts
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((product) =>
      filterCategory ? product.category === filterCategory : true
    );

  const toggleShowMore = () => {
    setVisibleProductsCount(prev => prev === 3 ? filteredProducts.length : 3);
  };

  // Get unique categories for the filter dropdown
  const categories = [...new Set(allProducts.map(product => product.category))];

  return (
    <div className='list-product'>
      <h1>All Products List</h1>
      <div className="listproduct-controls">
        <input
          type="text"
          placeholder="Search by product name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="listproduct-search"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="listproduct-filter"
        >
          <option value="">Filter by Category</option>
          {categories.map((category, index) => (
            <option key={index} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="listproduct-allproducts">
        {filteredProducts.length > 0 ? (
          filteredProducts.slice(0, visibleProductsCount).map((product) => (
            <div key={product.id} className="listproduct-item">
              <div className="listproduct-summary" onClick={() => toggleProductDetails(product.id)}>
                <img src={product.image} alt={product.name} className='listproduct-product-icon' />
                <p>{product.name}</p>
              </div>
              {expandedProductId === product.id && (
                <div className="listproduct-details">
                  <p><strong>Price:</strong> Rs.{product.new_price}</p>
                  <p><strong>Category:</strong> {product.category}</p>
                  <p><strong>Brand:</strong> {product.brand}</p>
                  <p><strong>Description:</strong> {product.description}</p>
                  <div className="listproduct-sizes">
                    <strong>Sizes:</strong>
                    <ul>
                      {product.sizes.map((size, index) => (
                        <li key={index}>
                          {size.size}: {size.quantity} available
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="listproduct-actions">
                    <button
                      className="restock-btn"
                      onClick={() => handleAddSizeInput(product.id)}
                    >
                      Restock
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => removeProduct(product.id)}
                    >
                      Remove
                    </button>
                  </div>
                  {restockData[product.id]?.length > 0 && (
                    <div className="restock-form">
                      <h3>Restock Product</h3>
                      {restockData[product.id].map((sizeInput, index) => (
                        <div key={index} className="restock-input">
                          <input
                            type="text"
                            placeholder="Size (e.g., 8)"
                            value={sizeInput.size}
                            onChange={(e) =>
                              handleSizeChange(product.id, index, "size", e.target.value)
                            }
                          />
                          <input
                            type="number"
                            placeholder="Quantity"
                            value={sizeInput.quantity}
                            onChange={(e) =>
                              handleSizeChange(product.id, index, "quantity", e.target.value)
                            }
                            min="0"
                          />
                        </div>
                      ))}
                      <button
                        className="submit-restock-btn"
                        onClick={() => handleRestock(product.id)}
                      >
                        Submit Restock
                      </button>
                    </div>
                  )}
                </div>
              )}
              <hr />
            </div>
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