import React, { useState, useEffect } from 'react';
import './CSS/SearchProduct.css';
import { useLocation, useNavigate } from 'react-router-dom';
import Item from '../Component/Item/Item';
import { FaFilter, FaSearch } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import toast, { Toaster } from 'react-hot-toast';

const SearchProduct = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = new URLSearchParams(location.search).get('query') || '';
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    brand: '',
    priceRange: '',
    gender: ''
  });
  
  const itemsPerPage = 12;
  
  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/allproducts');
        const data = await response.json();
        setProducts(data);
        if (data.length > 0) {
          toast.success('Products loaded successfully!', {
            duration: 2000,
            position: 'top-left',
          });
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products. Please try again later.', {
          duration: 3000,
          position: 'top-left',
        });
      }
    };
    
    fetchProducts();
  }, []);
  
  // Get unique brands from products
  const uniqueBrands = [...new Set(products.map(product => product.brand))].filter(Boolean);
  
  // Filter products based on search query and filters
  useEffect(() => {
    let filtered = products;
    
    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply other filters
    if (filters.brand) {
      filtered = filtered.filter(product => product.brand === filters.brand);
    }
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(product => 
        product.new_price >= min && product.new_price <= max
      );
    }
    
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchQuery, filters]);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (value) {
      toast.success(`${name.charAt(0).toUpperCase() + name.slice(1)} filter applied`, {
        duration: 1500,
        position: 'top-left',
      });
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      brand: '',
      priceRange: '',
      gender: ''
    });
    toast.success('All filters cleared!', {
      duration: 1500,
      position: 'top-left',
    });
  };
  
  // Handle new search
  const handleNewSearch = (e) => {
    e.preventDefault();
    const newQuery = e.target.search.value.trim();
    if (newQuery) {
      navigate(`/search?query=${encodeURIComponent(newQuery)}`);
      toast.success(`Searching for "${newQuery}"`, {
        duration: 1500,
        position: 'top-left',
      });
    } else {
      toast.error('Please enter a search term', {
        duration: 1500,
        position: 'top-left',
      });
    }
  };
  
  return (
    <div className="search-product-container">
      <Toaster />
      <div className="search-product-header">
        <h1>Search Results for "{searchQuery}"</h1>
        <p>{filteredProducts.length} products found</p>
        
        <form className="search-form" onSubmit={handleNewSearch}>
          <input 
            type="text" 
            name="search" 
            placeholder="Search for products..." 
            defaultValue={searchQuery}
          />
          <button type="submit">
            <FaSearch />
          </button>
        </form>
      </div>
      
      <div className="search-product-content">
        <div className={`filter-sidebar ${showFilters ? 'active' : ''}`}>
          <div className="filter-header">
            <h2>Filters</h2>
            <button className="close-filters" onClick={() => setShowFilters(false)}>
              <MdClose />
            </button>
          </div>
          
          <div className="filter-section">
            <h3>Gender</h3>
            <select name="gender" value={filters.gender} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="mens">Men</option>
              <option value="womens">Women</option>
              <option value="kids">Kids</option>
            </select>
          </div>
          
          <div className="filter-section">
            <h3>Brand</h3>
            <select name="brand" value={filters.brand} onChange={handleFilterChange}>
              <option value="">All</option>
              {uniqueBrands.map((brand, index) => (
                <option key={index} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-section">
            <h3>Price Range</h3>
            <select name="priceRange" value={filters.priceRange} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="0-5000">Under Rs. 5,000</option>
              <option value="5000-8000">Rs. 5,000 - Rs. 8,000</option>
              <option value="8000-10000">Rs. 8,000 - Rs. 10,000</option>
              <option value="10000-20000">Rs. 10,000 - Rs. 20,000</option>
              <option value="0000-999999">Over Rs. 10,000</option>
            </select>
          </div>
          
          <button className="clear-filters" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
        
        <div className="search-results">
          <div className="search-controls">
            <button 
              className="filter-toggle" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>
            
            <div className="search-summary">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
            </div>
          </div>
          
          {currentItems.length > 0 ? (
            <div className="search-items">
              {currentItems.map((item) => (
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
              <FaSearch />
              <h2>No products found</h2>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
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
