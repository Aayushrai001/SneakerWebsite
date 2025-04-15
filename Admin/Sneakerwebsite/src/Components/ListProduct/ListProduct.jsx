import React, { useEffect, useState } from 'react';
import './ListProduct.css';
import cross_icon from '../../assets/cross_icon.png';
import filter_icon from '../../assets/filter.png';

const ListProduct = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [visibleProductsCount, setVisibleProductsCount] = useState(12);
  const [error, setError] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [restockData, setRestockData] = useState({});

  // Fisher-Yates shuffle to randomize array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchInfo = async (category = "") => {
    try {
      const url = category
        ? `http://localhost:5000/allproducts?category=${category}`
        : 'http://localhost:5000/allproducts';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      // Shuffle products before setting state
      setAllProducts(shuffleArray(data));
      setError(null);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products. Please try again later.");
    }
  };

  useEffect(() => {
    fetchInfo(filterCategory);
  }, [filterCategory]);

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
        setExpandedProductId(null);
        alert("Product removed successfully");
      } else {
        alert("Failed to remove product: " + data.message);
      }
    } catch (error) {
      console.error("Error removing product:", error);
      alert("Error removing product");
    }
  };

  const removeSize = async (productId, sizeToRemove) => {
    try {
      const response = await fetch('http://localhost:5000/removesize', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId, size: sizeToRemove }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchInfo(filterCategory);
        setExpandedProductId(null);
        alert(`Size ${sizeToRemove} removed successfully`);
      } else {
        alert("Failed to remove size: " + data.message);
      }
    } catch (error) {
      console.error("Error removing size:", error);
      alert("Error removing size");
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
        await fetchInfo(filterCategory);
        setRestockData(prev => ({ ...prev, [productId]: [] }));
        setExpandedProductId(null);
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

  const handleRemoveSizeInput = (productId, index) => {
    setRestockData(prev => {
      const updatedSizes = [...(prev[productId] || [])];
      updatedSizes.splice(index, 1);
      return { ...prev, [productId]: updatedSizes };
    });
  };

  const toggleProductDetails = (productId) => {
    setExpandedProductId(prev => (prev === productId ? null : productId));
  };

  const filteredProducts = allProducts
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const toggleShowMore = () => {
    setVisibleProductsCount(prev => prev === 12 ? prev + 9 : 12);
  };

  const categories = ["men", "women", "kid"];

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
        <div className="listproduct-filter-wrapper">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="listproduct-filter"
          >
            <option value="">All Categories</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
          <img src={filter_icon} alt="Filter" className="listproduct-filter-icon" />
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="listproduct-allproducts">
        {filteredProducts.length > 0 ? (
          filteredProducts.slice(0, visibleProductsCount).map((product) => (
            <div key={product.id} className="listproduct-item">
              <div className="listproduct-card" onClick={() => toggleProductDetails(product.id)}>
                <img src={product.image} alt={product.name} className="listproduct-product-icon" />
                <p className="listproduct-product-name">{product.name}</p>
              </div>
              {expandedProductId === product.id && (
                <div className="listproduct-details">
                  <div className="listproduct-details-cross" onClick={() => toggleProductDetails(product.id)}>
                    <img src={cross_icon} alt="Close" />
                  </div>
                  <p><strong>Price:</strong> Rs.{product.new_price}</p>
                  <p><strong>Category:</strong> {product.category}</p>
                  <p><strong>Brand:</strong> {product.brand}</p>
                  <p><strong>Description:</strong> {product.description}</p>
                  <div className="listproduct-sizes">
                    <strong>Sizes:</strong>
                    <ul>
                      {product.sizes.map((size, index) => (
                        <li key={index} className="size-item">
                          {size.size}: {size.quantity} available
                          <button
                            className="remove-size-btn"
                            onClick={() => removeSize(product.id, size.size)}
                          >
                            Remove
                          </button>
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
                      Remove Product
                    </button>
                  </div>
                  {restockData[product.id]?.length > 0 && (
                    <div className="restock-form">
                      <h3>Restock Product</h3>
                      {restockData[product.id].map((sizeInput, index) => (
                        <div key={index} className="restock-input">
                          <div className="input-group">
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
                          <button
                            className="remove-restock-input-btn"
                            onClick={() => handleRemoveSizeInput(product.id, index)}
                          >
                            Remove
                          </button>
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
            </div>
          ))
        ) : (
          <p className="no-products-message">No products found</p>
        )}
      </div>
      {filteredProducts.length > 12 && (
        <button onClick={toggleShowMore} className="see-more-btn">
          {visibleProductsCount === 12 ? 'See More' : 'Show Less'}
        </button>
      )}
    </div>
  );
};

export default ListProduct;