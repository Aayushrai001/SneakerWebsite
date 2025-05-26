// Importing necessary dependencies from React and other libraries
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import './ListProduct.css'; 
import cross_icon from '../../assets/cross_icon.png'; 
import filter_icon from '../../assets/filter.png'; 
import edit_icon from '../../assets/edit.png';
import { toast } from 'react-hot-toast'; 

// Defining the main ListProduct functional component
const ListProduct = () => {
  // State to store the list of all products fetched from the server
  const [allProducts, setAllProducts] = useState([]);
  // State to store the search term for filtering products by name
  const [searchTerm, setSearchTerm] = useState("");
  // State to store the selected category filter
  const [filterCategory, setFilterCategory] = useState("");
  // State to store any error messages encountered during API calls
  const [error, setError] = useState(null);
  // State to track which product's details are expanded in the modal
  const [expandedProductId, setExpandedProductId] = useState(null);
  // State to manage restock input data for each product (keyed by product ID)
  const [restockData, setRestockData] = useState({});
  // State to track the current page for pagination
  const [currentPage, setCurrentPage] = useState(1);
  // Constant defining the number of products to display per page
  const productsPerPage = 20;

  // Fisher-Yates shuffle algorithm to randomize the order of the products array
  const shuffleArray = (array) => {
    const shuffled = [...array]; // Creates a shallow copy of the input array
    for (let i = shuffled.length - 1; i > 0; i--) { // Iterates from the end of the array
      const j = Math.floor(Math.random() * (i + 1)); // Generates a random index
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swaps elements at indices i and j
    }
    return shuffled; // Returns the shuffled array
  };

  // Function to fetch product data from the server
  const fetchInfo = async (category = "") => {
    try {
      // Constructs the API URL, optionally including a category filter
      const url = category
        ? `http://localhost:5000/allproducts?category=${category}`
        : 'http://localhost:5000/allproducts';
      const res = await fetch(url); // Makes the HTTP GET request
      if (!res.ok) { // Checks if the response status indicates an error
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json(); // Parses the JSON response
      // Shuffles the fetched products before updating state
      setAllProducts(shuffleArray(data));
      setError(null); // Clears any previous error
    } catch (error) {
      console.error("Error fetching products:", error); // Logs the error to the console
      setError("Failed to fetch products. Please try again later."); // Sets an error message
    }
  };

  // useEffect hook to fetch products whenever the filterCategory changes
  useEffect(() => {
    fetchInfo(filterCategory); // Calls fetchInfo with the current filterCategory
  }, [filterCategory]); // Dependency array ensures this runs when filterCategory changes

  // Function to remove a product from the server and update the UI
  const removeProduct = async (id) => {
    try {
      // Sends a POST request to remove the product by ID
      const response = await fetch('http://localhost:5000/removeproduct', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id }), // Sends the product ID in the request body
      });

      const data = await response.json(); // Parses the response
      if (data.success) { // Checks if the operation was successful
        // Updates the product list by filtering out the removed product
        setAllProducts(prevProducts => prevProducts.filter(product => product.id !== id));
        setExpandedProductId(null); // Closes any open product details modal
        toast.success("Product removed successfully"); // Displays a success notification
      } else {
        toast.error("Failed to remove product: " + data.message); // Displays an error notification
      }
    } catch (error) {
      console.error("Error removing product:", error); // Logs the error
      toast.error("Error removing product"); // Displays a generic error notification
    }
  };

  // Function to remove a specific size for a product
  const removeSize = async (productId, sizeToRemove) => {
    try {
      // Sends a POST request to remove the specified size for the product
      const response = await fetch('http://localhost:5000/removesize', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId, size: sizeToRemove }), // Sends product ID and size
      });

      const data = await response.json(); // Parses the response
      if (data.success) { // Checks if the operation was successful
        await fetchInfo(filterCategory); // Refetches the product list to reflect changes
        setExpandedProductId(null); // Closes any open product details modal
         toast.success(`Size ${sizeToRemove} removed successfully`); // Displays a success notification
      } else {
         toast.error("Failed to remove size: " + data.message); // Displays an error notification
      }
    } catch (error) {
      console.error("Error removing size:", error); // Logs the error
       toast.error("Error removing size"); // Displays a generic error notification
    }
  };

  // Function to handle restocking a product with new sizes and quantities
  const handleRestock = async (productId) => {
    const sizesToUpdate = restockData[productId] || []; // Gets the restock inputs for the product

    // Filters out invalid inputs (empty size or invalid quantity)
    const validSizesToUpdate = sizesToUpdate.filter(sizeInput =>
      sizeInput.size && sizeInput.size.trim() !== "" &&
      Number.isInteger(Number(sizeInput.quantity)) && Number(sizeInput.quantity) >= 0
    );

    if (!validSizesToUpdate.length) { // Checks if there are valid sizes to update
      toast.error("Please add valid sizes and quantities to restock."); // Shows error if no valid inputs
      return;
    }

    try {
      // Sends a POST request to restock the product with the specified sizes
      const response = await fetch('http://localhost:5000/restockproduct', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId, sizes: validSizesToUpdate }), // Sends product ID and sizes
      });

      const data = await response.json(); // Parses the response
      if (data.success) { // Checks if the operation was successful
        // Updates the specific product's sizes in the state without refetching
        setAllProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === productId ? { ...p, sizes: data.product.sizes } : p
          )
        );
        setRestockData(prev => ({ ...prev, [productId]: [] })); // Clears the restock inputs
        // Keeps the modal open to allow further restocking
         toast.success("Product restocked successfully"); // Displays a success notification
      } else {
         toast.error("Failed to restock product: " + data.message); // Displays an error notification
      }
    } catch (error) {
      console.error("Error restocking product:", error); // Logs the error
       toast.error("Error restocking product"); // Displays a generic error notification
    }
  };

  // Function to add a new size input field for restocking a product
  const handleAddSizeInput = (productId) => {
    setRestockData(prev => {
      const currentRestockInputs = prev[productId] || []; // Gets existing restock inputs
      // Adds a new empty size input
      return {
        ...prev,
        [productId]: [...currentRestockInputs, { size: "", quantity: 0 }],
      };
    });
  };

  // Function to update the size or quantity in a restock input field
  const handleSizeChange = (productId, index, field, value) => {
    setRestockData(prev => {
      const updatedSizes = [...(prev[productId] || [])]; // Copies the current restock inputs
      updatedSizes[index] = { ...updatedSizes[index], [field]: value }; // Updates the specified field
      return { ...prev, [productId]: updatedSizes }; // Updates the state
    });
  };

  // Function to remove a restock input field
  const handleRemoveSizeInput = (productId, index) => {
    setRestockData(prev => {
      const updatedSizes = [...(prev[productId] || [])]; // Copies the current restock inputs
      updatedSizes.splice(index, 1); // Removes the input at the specified index
      return { ...prev, [productId]: updatedSizes }; // Updates the state
    });
  };

  // Function to toggle the visibility of a product's details modal
  const toggleProductDetails = (productId) => {
    setExpandedProductId(prev => (prev === productId ? null : productId)); // Toggles the modal
  };

  // Filters products based on the search term
  const filteredProducts = allProducts
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) // Case-insensitive search
    );

  // Calculates pagination values
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage); // Total number of pages
  const indexOfLastProduct = currentPage * productsPerPage; // Index of the last product on the page
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage; // Index of the first product
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct); // Products for the current page

  // Function to navigate to a specific page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber); // Updates the current page
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scrolls to the top of the page
  };

  // useEffect hook to reset to the first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1); // Resets to the first page
  }, [searchTerm, filterCategory]); // Runs when searchTerm or filterCategory changes

  // Array of available categories for the filter dropdown
  const categories = ["men", "women", "kid"];

  // ProductDetails component to display/edit product details in a modal
  const ProductDetails = ({ product, onClose }) => {
    // State to manage editing mode
    const [isEditing, setIsEditing] = useState(false);
    // State to store editable product fields
    const [editValues, setEditValues] = useState({
      name: product.name,
      price: product.new_price,
      description: product.description,
      sizes: product.sizes.map(size => ({ ...size }))
    });

    // useEffect to sync editValues with the product prop when it changes
    useEffect(() => {
      setEditValues({
        name: product.name,
        price: product.new_price,
        description: product.description,
        sizes: product.sizes.map(size => ({ ...size }))
      });
    }, [product]);

    // State to manage restock inputs within the modal
    const [modalRestockInputs, setModalRestockInputs] = useState([]);

    // Function to enter edit mode
    const handleEditClick = () => {
      setIsEditing(true); // Enables edit mode
    };

    // Function to cancel editing and reset values
    const handleCancelClick = () => {
      setIsEditing(false); // Exits edit mode
      // Resets edit values to the current product values
      setEditValues({
        name: product.name,
        price: product.new_price,
        description: product.description,
        sizes: product.sizes.map(size => ({ ...size }))
      });
    };

    // Function to update a field in editValues
    const handleInputChange = (field, value) => {
      setEditValues(prev => ({ ...prev, [field]: value })); // Updates the specified field
    };

    // Function to update a size or quantity in the edit sizes array
    const handleSizeInputChange = (index, field, value) => {
      const newSizes = [...editValues.sizes]; // Copies the sizes array
      newSizes[index] = { ...newSizes[index], [field]: value }; // Updates the specified field
      setEditValues(prev => ({ ...prev, sizes: newSizes })); // Updates the state
    };

    // Function to add a new size input field in edit mode
    const handleAddSizeEditInput = () => {
      setEditValues(prev => ({
        ...prev,
        sizes: [...prev.sizes, { size: "", quantity: 0 }] // Adds a new empty size
      }));
    };

    // Function to remove a size input field in edit mode
    const handleRemoveSizeEditInput = (index) => {
      setEditValues(prev => ({
        ...prev,
        sizes: prev.sizes.filter((_, i) => i !== index) // Removes the size at the index
      }));
    };

    // Function to add a new restock input field in the modal
    const handleAddModalRestockInput = () => {
      setModalRestockInputs(prev => [...prev, { size: "", quantity: 0 }]); // Adds a new empty restock input
    };

    // Function to update a restock input field in the modal
    const handleModalRestockInputChange = (index, field, value) => {
      const updatedInputs = [...modalRestockInputs]; // Copies the restock inputs
      updatedInputs[index] = { ...updatedInputs[index], [field]: value }; // Updates the specified field
      setModalRestockInputs(updatedInputs); // Updates the state
    };

    // Function to remove a restock input field in the modal
    const handleRemoveModalRestockInput = (index) => {
      setModalRestockInputs(prev => prev.filter((_, i) => i !== index)); // Removes the input at the index
    };

    // Function to submit restock inputs from the modal
    const handleSubmitModalRestock = async () => {
      // Filters out invalid restock inputs
      const validSizesToUpdate = modalRestockInputs.filter(sizeInput =>
        sizeInput.size && sizeInput.size.trim() !== "" &&
        Number.isInteger(Number(sizeInput.quantity)) && Number(sizeInput.quantity) >= 0
      );

      if (!validSizesToUpdate.length) { // Checks if there are valid inputs
        toast.error("Please add valid sizes and quantities to restock."); // Shows error if no valid inputs
        return;
      }

      try {
        // Sends a POST request to restock the product
        const response = await fetch('http://localhost:5000/restockproduct', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: product.id, sizes: validSizesToUpdate }), // Sends product ID and sizes
        });

        const data = await response.json(); // Parses the response
        if (data.success) { // Checks if the operation was successful
          setModalRestockInputs([]); // Clears the restock inputs
          toast.success("Product restocked successfully"); // Displays a success notification
          // Updates the sizes in editValues to reflect the new sizes
          setEditValues(prev => ({
            ...prev,
            sizes: data.product.sizes 
          }));
        } else {
          toast.error("Failed to restock product: " + data.message); // Displays an error notification
        }
      } catch (error) {
        console.error("Error restocking product:", error); // Logs the error
        toast.error("Error restocking product"); // Displays a generic error notification
      }
    };

    // Function to save all edited product details
    const handleSaveAll = async () => {
      try {
        // Validates input fields
        if (!editValues.name.trim()) {
          toast.error("Product name is required"); // Shows error if name is empty
          return;
        }
        if (!editValues.description.trim()) {
          toast.error("Product description is required"); // Shows error if description is empty
          return;
        }
        if (isNaN(editValues.price) || editValues.price <= 0) {
          toast.error("Price must be a positive number"); // Shows error if price is invalid
          return;
        }
        if (editValues.sizes.length === 0) {
          toast.error("At least one size is required"); // Shows error if no sizes are provided
          return;
        }

        // Validates each size entry
        for (const size of editValues.sizes) {
          if (!size.size.trim()) {
            toast.error("Size cannot be empty"); // Shows error if size is empty
            return;
          }
          if (!Number.isInteger(Number(size.quantity)) || Number(size.quantity) < 0) {
            toast.error("Quantity must be a non-negative integer"); // Shows error if quantity is invalid
            return;
          }
        }

        // Sends a POST request to update the product
        const response = await fetch('http://localhost:5000/editproduct', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: product.id,
            name: editValues.name.trim(),
            new_price: Number(editValues.price),
            description: editValues.description.trim(),
            sizes: editValues.sizes.map(size => ({
              size: size.size.trim(),
              quantity: Number(size.quantity)
            }))
          }), // Sends updated product details
        });

        const data = await response.json(); // Parses the response
        if (data.success) { // Checks if the operation was successful
          toast.success("Product updated successfully"); // Displays a success notification
          setIsEditing(false); // Exits edit mode
          fetchInfo(filterCategory); // Refetches the product list
        } else {
          toast.error(data.message || "Failed to update product"); // Displays an error notification
        }
      } catch (error) {
        console.error("Error updating product:", error); // Logs the error
        toast.error("Error updating product"); // Displays a generic error notification
      }
    };

    // Checks if product is null to prevent rendering issues
    if (!product) return null;

    // Renders the modal using ReactDOM.createPortal to attach it to document.body
    return ReactDOM.createPortal(
      <div className="listproduct-details-overlay"> {/* Overlay for the modal */}
        <div className="listproduct-details"> {/* Main modal container */}
          <div className="listproduct-details-cross" onClick={onClose}> {/* Close button */}
            <img src={cross_icon} alt="Close" />
          </div>

          {!isEditing ? ( // Display mode for the modal
            <>
              <div className="editable-field"> {/* Displays product name */}
                <strong>Name:</strong> <span>{product.name}</span>
              </div>
              <div className="editable-field"> {/* Displays product price */}
                <strong>Price:</strong> <span>Rs.{product.new_price}</span>
              </div>
              <div className="editable-field"> {/* Displays product category */}
                <strong>Category:</strong> <span>{product.category}</span>
              </div>
              <div className="editable-field"> {/* Displays product brand */}
                <strong>Brand:</strong> <span>{product.brand}</span>
              </div>
              <div className="editable-field"> {/* Displays product description */}
                <strong>Description:</strong> <span>{product.description}</span>
              </div>

              <div className="listproduct-sizes"> {/* Displays product sizes */}
                <strong>Sizes:</strong>
                <ul>
                  {product.sizes.map((size, index) => ( // Lists all sizes
                    <li key={index} className="size-item">
                       <div className="size-item-display">
                          <span>{size.size}: {size.quantity} available</span> {/* Shows size and quantity */}
                          {/* Button to remove a size */}
                           <button
                             className="remove-size-btn"
                             onClick={() => removeSize(product.id, size.size)}
                           >
                             Remove
                           </button>
                       </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Restock form within the modal */}
              <div className="restock-form">
                <h3>Restock Product</h3>
                {modalRestockInputs.map((sizeInput, index) => ( // Lists restock input fields
                  <div key={index} className="restock-input">
                    <div className="input-group">
                      <input
                        type="text"
                        placeholder="Size (e.g., 8)"
                        value={sizeInput.size}
                        onChange={(e) => handleModalRestockInputChange(index, "size", e.target.value)}
                      /> {/* Input for size */}
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={sizeInput.quantity}
                        onChange={(e) => handleModalRestockInputChange(index, "quantity", e.target.value)}
                        min="0"
                      /> {/* Input for quantity */}
                    </div>
                    <button
                      className="remove-restock-input-btn"
                      onClick={() => handleRemoveModalRestockInput(index)}
                    >
                      Remove
                    </button> {/* Button to remove a restock input */}
                  </div>
                ))}
                <button className="restock-btn" onClick={handleAddModalRestockInput}>Add Size to Restock</button> {/* Button to add a new restock input */}
                {modalRestockInputs.length > 0 && ( // Conditionally shows the submit button
                   <button
                     className="submit-restock-btn"
                     onClick={handleSubmitModalRestock}
                   >
                     Submit Restock
                   </button>
                )}
              </div>

              {/* Action buttons for the modal */}
              <div className="listproduct-actions">
                <button className="main-edit-button" onClick={handleEditClick}>Edit Product</button> {/* Button to enter edit mode */}
                 <button
                   className="remove-btn"
                   onClick={() => removeProduct(product.id)}
                 >
                   Remove Product
                 </button> {/* Button to remove the product */}
              </div>

            </>
          ) : ( // Edit mode for the modal
            <>
              <div className="editable-field"> {/* Editable field for product name */}
                <strong>Name:</strong>
                <input
                  type="text"
                  value={editValues.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div className="editable-field"> {/* Editable field for product price */}
                <strong>Price:</strong>
                <input
                  type="number"
                  value={editValues.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                />
              </div>
               <div className="editable-field"> {/* Non-editable field for category */}
                <strong>Category:</strong> <span>{product.category}</span>
              </div>
              <div className="editable-field"> {/* Non-editable field for brand */}
                <strong>Brand:</strong> <span>{product.brand}</span>
              </div>
              <div className="editable-field"> {/* Editable field for description */}
                <strong>Description:</strong>
                <textarea
                  value={editValues.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="listproduct-sizes"> {/* Editable sizes list */}
                <strong>Sizes:</strong>
                <ul>
                  {editValues.sizes.map((size, index) => ( // Lists editable sizes
                    <li key={index} className="size-item">
                      <div className="size-item-edit">
                        <input
                          type="text"
                          placeholder="Size"
                          value={size.size}
                          onChange={(e) => handleSizeInputChange(index, 'size', e.target.value)}
                        /> {/* Input for size */}
                        <input
                          type="number"
                          placeholder="Quantity"
                          value={size.quantity}
                          onChange={(e) => handleSizeInputChange(index, 'quantity', e.target.value)}
                          min="0"
                        /> {/* Input for quantity */}
                        <button
                          className="remove-size-btn"
                          onClick={() => handleRemoveSizeEditInput(index)}
                        >
                          Remove
                        </button> {/* Button to remove a size */}
                      </div>
                    </li>
                  ))}
                </ul>
                <button className="restock-btn" onClick={handleAddSizeEditInput}>Add New Size</button> {/* Button to add a new size */}
              </div>

              <div className="save-cancel-buttons"> {/* Save and cancel buttons */}
                <button className="save-btn" onClick={handleSaveAll}>Save All</button> {/* Saves changes */}
                <button className="cancel-btn" onClick={handleCancelClick}>Cancel</button> {/* Cancels editing */}
              </div>
            </>
          )}

        </div>
      </div>,
      document.body // Attaches the modal to the document body
    );
  };

  // Main render method for the ListProduct component
  return (
    <div className='list-product'> {/* Main container for the component */}
      <h1>All Products List</h1> {/* Page title */}
      <div className="listproduct-controls"> {/* Container for search and filter controls */}
        <input
          type="text"
          placeholder="Search by product name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="listproduct-search"
        /> {/* Search input field */}
        <div className="listproduct-filter-wrapper"> {/* Wrapper for the filter dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="listproduct-filter"
          >
            <option value="">All Categories</option> {/* Default option */}
            {categories.map((category, index) => ( // Maps categories to options
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
          <img src={filter_icon} alt="Filter" className="listproduct-filter-icon" /> {/* Filter icon */}
        </div>
      </div>
      {error && <p className="error-message">{error}</p>} {/* Displays error message if present */}
      <div className="listproduct-allproducts"> {/* Container for product cards */}
        {currentProducts.length > 0 ? ( // Checks if there are products to display
          currentProducts.map((product) => ( // Maps products to cards
            <div key={product.id} className="listproduct-item">
              <div className="listproduct-card" onClick={() => toggleProductDetails(product.id)}>
                <img src={product.image} alt={product.name} className="listproduct-product-icon" /> {/* Product image */}
                <p className="listproduct-product-name">{product.name}</p> {/* Product name */}
              </div>
            </div>
          ))
        ) : (
          <p className="no-products-message">No products found</p> // Message when no products match
        )}
      </div>
      {totalPages > 1 && ( // Conditionally renders pagination controls
        <div className="pagination">
          <button
            className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button> {/* Previous page button */}
          <div className="pagination-numbers">
            {[...Array(totalPages)].map((_, index) => ( // Maps page numbers
              <button
                key={index + 1}
                className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button
            className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button> {/* Next page button */}
        </div>
      )}
      {expandedProductId && ( // Conditionally renders the product details modal
        <ProductDetails
          product={filteredProducts.find(p => p.id === expandedProductId)}
          onClose={() => setExpandedProductId(null)}
        />
      )}
    </div>
  );
};

export default ListProduct;