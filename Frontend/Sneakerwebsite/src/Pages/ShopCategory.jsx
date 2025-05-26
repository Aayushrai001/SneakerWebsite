import React, { useContext, useState, useEffect } from 'react';
import './CSS/ShopCategory.css'; 
import { ShopContext } from '../Context/ShopContext'; 
import Item from '../Component/Item/Item'; 

// Define the ShopCategory component, which accepts props (category and banner)
const ShopCategory = (props) => {
  // Access all_product from ShopContext to get the list of all products
  const { all_product } = useContext(ShopContext);
  // State to track the current page for pagination
  const [currentPage, setCurrentPage] = useState(1);
  // State to define the number of products per page (constant at 12)
  const [productsPerPage] = useState(12);
  // State to store products filtered by category
  const [filteredProducts, setFilteredProducts] = useState([]);
  // State to store the total number of pages for pagination
  const [totalPages, setTotalPages] = useState(1);

  // useEffect to filter products by category and update pagination
  useEffect(() => {
    // Filter products based on the category prop
    const filtered = all_product.filter(item => props.category === item.category);
    setFilteredProducts(filtered); // Update filtered products state
    setTotalPages(Math.ceil(filtered.length / productsPerPage)); // Calculate total pages
    setCurrentPage(1); // Reset to first page when category changes
  }, [all_product, props.category, productsPerPage]); // Dependencies: all_product, category, productsPerPage

  // Calculate pagination indices
  const indexOfLastProduct = currentPage * productsPerPage; // Index of the last product on the current page
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage; // Index of the first product on the current page
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct); // Slice products for the current page

  // Function to change the current page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate an array of page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Function to get the category title based on the category prop
  const getCategoryTitle = () => {
    switch(props.category) {
      case 'mens':
        return "Men's Collection"; // Title for men's category
      case 'womens':
        return "Women's Collection"; // Title for women's category
      case 'kids':
        return "Kids' Collection"; // Title for kids' category
      default:
        return "All Products"; // Default title for other categories
    }
  };

  // Function to get the category description based on the category prop
  const getCategoryDescription = () => {
    switch(props.category) {
      case 'mens':
        return "Step into style with our premium men's sneaker collection. From classic designs to the latest trends, find your perfect pair. Quality materials, superior comfort, and timeless aesthetics for the modern man.";
      case 'womens':
        return "Elevate your style with our curated women's sneaker collection. Where fashion meets functionality, discover designs that complement your lifestyle. Experience comfort without compromising on style.";
      case 'kids':
        return "Keep your little ones stylish and comfortable with our kids' sneaker collection. Durable, fun, and trendy designs that withstand active play while keeping them looking cool. Quality that parents trust.";
      default:
        return "Welcome to Sneaker.NP, your premier destination for authentic sneakers. Browse our extensive collection featuring the latest releases, timeless classics, and exclusive collaborations. Quality, style, and comfort for every step.";
    }
  };

  // JSX rendering of the component
  return (
    // Main container for the shop category page
    <div className="shop-category">
      {/* Banner section with category image and description */}
      <div className="shopcategory-banner-container">
        <img className="shopcategory-banner" src={props.banner} alt="Category Banner" /> {/* Display category banner image */}
        <div className="banner-content">
          <h1>{getCategoryTitle()}</h1> {/* Display category title */}
          <p>{getCategoryDescription()}</p> {/* Display category description */}
        </div>
      </div>

      {/* Section to display pagination information */}
      <div className="shopcategory-indexSort">
        <p>
          <span>Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products</span> {/* Show current page range and total products */}
        </p>
      </div>

      {/* Section to display filtered products */}
      <div className="shopcategory-products">
        {currentProducts.map((item, i) => (
          // Render each product using the Item component
          <Item key={i} id={item.id} name={item.name} image={item.image} new_price={item.new_price} />
        ))}
      </div>

      {/* Pagination controls (displayed only if there are multiple pages) */}
      {totalPages > 1 && (
        <div className="pagination">
          {/* Previous page button */}
          <button 
            className="pagination-btn" 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1} // Disable if on first page
          >
            Previous
          </button>
          
          {/* Page number buttons */}
          <div className="pagination-numbers">
            {pageNumbers.map(number => (
              <button
                key={number}
                className={`pagination-number ${currentPage === number ? 'active' : ''}`} // Highlight active page
                onClick={() => paginate(number)} // Set current page
              >
                {number}
              </button>
            ))}
          </div>
          
          {/* Next page button */}
          <button 
            className="pagination-btn" 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages} // Disable if on last page
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default ShopCategory