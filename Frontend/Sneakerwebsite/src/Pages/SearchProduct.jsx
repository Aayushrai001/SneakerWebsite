import React, { useState, useEffect } from 'react';
import './CSS/SearchProduct.css';
import { useLocation, useNavigate, Link } from 'react-router-dom'; 
import Item from '../Component/Item/Item'; 
import { FaFilter, FaSearch } from 'react-icons/fa'; 
import { MdClose } from 'react-icons/md'; 
import toast from 'react-hot-toast'; 
import logo from '../Component/assets/logo.png'; 

// Define the SearchProduct component
const SearchProduct = () => {
  // Hook to access the current location (URL) for query parameters
  const location = useLocation();
  // Hook to programmatically navigate to different routes
  const navigate = useNavigate();
  // Extract search query from URL query parameters, default to empty string if not present
  const searchQuery = new URLSearchParams(location.search).get('query') || '';
  
  // State to store all products fetched from the backend
  const [products, setProducts] = useState([]);
  // State to store filtered products based on search query and filters
  const [filteredProducts, setFilteredProducts] = useState([]);
  // State to track the current page for pagination
  const [currentPage, setCurrentPage] = useState(1);
  // State to toggle visibility of the filter sidebar
  const [showFilters, setShowFilters] = useState(false);
  // State to store filter values (brand, price range, gender)
  const [filters, setFilters] = useState({
    brand: '',
    priceRange: '',
    gender: ''
  });
  
  // Constant defining the number of items to display per page
  const itemsPerPage = 12;
  
  // useEffect to fetch all products from the backend on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch products from the backend
        const response = await fetch('http://localhost:5000/allproducts');
        const data = await response.json();
        // Randomize the order of products for display
        const randomizedProducts = data.sort(() => Math.random() - 0.5);
        setProducts(randomizedProducts); // Update products state
      } catch (error) {
        // Handle errors during product fetch
        console.error('Error fetching products:', error);
        toast.error('Failed to load products. Please try again later.');
      }
    };
    
    fetchProducts(); // Execute the fetch function
  }, []); // Empty dependency array to run once on mount
  
  // Create an array of unique brands from products, filtering out falsy values
  const uniqueBrands = [...new Set(products.map(product => product.brand))].filter(Boolean);
  
  // useEffect to filter products based on search query and filters
  useEffect(() => {
    let filtered = [...products]; // Create a copy of all products
    
    // Apply search query filter if present
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply brand filter if a brand is selected
    if (filters.brand && filters.brand !== "") {
      filtered = filtered.filter(product => product.brand === filters.brand);
    }
    // Apply gender filter if a gender is selected
    if (filters.gender && filters.gender !== "") {
      filtered = filtered.filter(product => product.category === filters.gender);
    }
    // Apply price range filter if a range is selected
    if (filters.priceRange && filters.priceRange !== "") {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(product => 
        product.new_price >= min && product.new_price <= max
      );
    }
    
    setFilteredProducts(filtered); // Update filtered products state
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchQuery, filters]); // Dependencies: products, searchQuery, filters
  
  // Calculate pagination indices
  const indexOfLastItem = currentPage * itemsPerPage; // Index of the last item on the current page
  const indexOfFirstItem = indexOfLastItem - itemsPerPage; // Index of the first item on the current page
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem); // Slice products for the current page
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage); // Calculate total number of pages
  
  // Function to handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value // Update the specific filter
    }));
    
    // Show toast notification when a filter is applied
    if (value) {
      toast.success(`${name.charAt(0).toUpperCase() + name.slice(1)} filter applied`);
    }
  };
  
  // Function to clear all filters
  const clearFilters = () => {
    setFilters({
      brand: '',
      priceRange: '',
      gender: ''
    }); // Reset all filters to default
    toast.success('All filters cleared!'); // Show notification
  };
  
  // Function to handle new search submission
  const handleNewSearch = (e) => {
    e.preventDefault(); // Prevent default form submission
    const newQuery = e.target.search.value.trim(); // Get search input value
    
    if (newQuery) {
      // Navigate to search page with new query
      navigate(`/search?query=${encodeURIComponent(newQuery)}`);
    } else {
      // Navigate to search page without query if input is empty
      navigate('/search');
    }
  };
  
  // Function to handle search input changes
  const handleSearchChange = (e) => {
    const newQuery = e.target.value.trim();
    if (!newQuery) {
      // Navigate to search page without query if input is cleared
      navigate('/search');
    }
  };
  
  // JSX rendering of the component
  return (
    // Main container for the search product page
    <div className="search-product-container">
      {/* Header section */}
      <div className="search-product-header">
        {/* Logo with link to homepage */}
        <div className="search-logo">
          <Link to="/">
            <img src={logo} alt="Sneaker.NP Logo" />
          </Link>
        </div>
        {/* Display search query or default title */}
        <h1>{searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}</h1>
        {/* Display number of filtered products */}
        <p>{filteredProducts.length} products found</p>
        
        {/* Search form */}
        <form className="search-form" onSubmit={handleNewSearch}>
          <input 
            type="text" 
            name="search" 
            placeholder="Search for products..." 
            defaultValue={searchQuery} // Pre-fill with current search query
            onChange={handleSearchChange} // Handle input changes
          />
          <button type="submit">
            <FaSearch /> {/* Search icon */}
          </button>
        </form>
      </div>
      
      {/* Main content section */}
      <div className="search-product-content">
        {/* Filter sidebar */}
        <div className={`filter-sidebar ${showFilters ? 'active' : ''}`}>
          {/* Filter header with title and close button */}
          <div className="filter-header">
            <h2>Filters</h2>
            <button className="close-filters" onClick={() => setShowFilters(false)}>
              <MdClose /> {/* Close icon */}
            </button>
          </div>
          
          {/* Gender filter section */}
          <div className="filter-section">
            <h3>Gender</h3>
            <select name="gender" value={filters.gender} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="kid">Kids</option>
            </select>
          </div>
          
          {/* Brand filter section */}
          <div className="filter-section">
            <h3>Brand</h3>
            <select name="brand" value={filters.brand} onChange={handleFilterChange}>
              <option value="">All</option>
              {uniqueBrands.map((brand, index) => (
                <option key={index} value={brand}>{brand}</option> // Dynamically generate brand options
              ))}
            </select>
          </div>
          
          {/* Price range filter section */}
          <div className="filter-section">
            <h3>Price Range</h3>
            <select name="priceRange" value={filters.priceRange} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="0-5000">Under Rs. 5,000</option>
              <option value="5000-8000">Rs. 5,000 - Rs. 8,000</option>
              <option value="8000-10000">Rs. 8,000 - Rs. 10,000</option>
              <option value="10000-20000">Rs. 10,000 - Rs. 20,000</option>
              <option value="20000-999999">Over Rs. 20,000</option>
            </select>
          </div>
          
          {/* Button to clear all filters */}
          <button className="clear-filters" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
        
        {/* Search results section */}
        <div className="search-results">
          {/* Search controls including filter toggle and summary */}
          <div className="search-controls">
            <button 
              className="filter-toggle" 
              onClick={() => setShowFilters(!showFilters)} // Toggle filter sidebar
            >
              <FaFilter /> Filters
            </button>
            
            {/* Display current page range and total products */}
            <div className="search-summary">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
            </div>
          </div>
          
          {/* Display filtered products or no-results message */}
          {currentItems.length > 0 ? (
            <div className="search-items">
              {currentItems.map((item) => (
                // Render each product using the Item component
                <Item
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  image={item.image}
                  new_price={item.new_price}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <FaSearch /> {/* Search icon */}
              <h2>No products found</h2>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          )}
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="pagination">
              {/* Previous page button */}
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1} // Disable if on first page
              >
                Previous
              </button>
              
              {/* Page number buttons */}
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)} // Set current page
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              {/* Next page button */}
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages} // Disable if on last page
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchProduct;