import React, { useContext, useState, useEffect } from 'react';
import './CSS/ShopCategory.css';
import { ShopContext } from '../Context/ShopContext';
import Item from '../Component/Item/Item';

const ShopCategory = (props) => {
  const { all_product } = useContext(ShopContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // Filter products by category
  useEffect(() => {
    const filtered = all_product.filter(item => props.category === item.category);
    setFilteredProducts(filtered);
    setTotalPages(Math.ceil(filtered.length / productsPerPage));
    setCurrentPage(1); // Reset to first page when category changes
  }, [all_product, props.category, productsPerPage]);

  // Calculate pagination values
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Get category title based on props.category
  const getCategoryTitle = () => {
    switch(props.category) {
      case 'mens':
        return "Men's Collection";
      case 'womens':
        return "Women's Collection";
      case 'kids':
        return "Kids' Collection";
      default:
        return "All Products";
    }
  };

  // Get category description
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

  return (
    <div className="shop-category">
      <div className="shopcategory-banner-container">
        <img className="shopcategory-banner" src={props.banner} alt="Category Banner" />
        <div className="banner-content">
          <h1>{getCategoryTitle()}</h1>
          <p>{getCategoryDescription()}</p>
        </div>
      </div>

      <div className="shopcategory-indexSort">
        <p>
          <span>Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products</span>
        </p>
      </div>

      <div className="shopcategory-products">
        {currentProducts.map((item, i) => (
          <Item key={i} id={item.id} name={item.name} image={item.image} new_price={item.new_price} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn" 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="pagination-numbers">
            {pageNumbers.map(number => (
              <button
                key={number}
                className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                onClick={() => paginate(number)}
              >
                {number}
              </button>
            ))}
          </div>
          
          <button 
            className="pagination-btn" 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default ShopCategory
