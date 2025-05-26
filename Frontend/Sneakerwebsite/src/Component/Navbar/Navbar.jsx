import React, { useContext, useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShopContext } from '../../Context/ShopContext';
import './Navbar.css';
import logo from '../assets/logo.png';
import search from '../assets/search.png';
import cartIcon from '../assets/cart_icon.png';
import heartIcon from '../assets/heart-icon.png';
import menuIcon from '../assets/menu.png';

// Functional component Navbar
const Navbar = () => {
  // State for tracking the currently active menu item
  const [activeMenu, setActiveMenu] = useState("Home");

  // State to toggle user dropdown menu
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // State to store the text in the search input
  const [searchQuery, setSearchQuery] = useState('');

  // Ref to access the menu DOM element for toggling class
  const menuRef = useRef();

  // Destructuring values from ShopContext for user and cart/favourite logic
  const { getTotalCartItems, getTotalFavouriteItems, userName, resetState, isLoading, initializeUserData } = useContext(ShopContext);

  // Get current route location
  const location = useLocation();

  // Hook to programmatically navigate
  const navigate = useNavigate();

  // Check user authentication from local storage
  const isAuthenticated = localStorage.getItem('auth-token');

  // If user is authenticated, initialize their data
  useEffect(() => {
    if (isAuthenticated) {
      initializeUserData(isAuthenticated);
    }
  }, [isAuthenticated]);

  // Update the active menu based on the current path
  useEffect(() => {
    const pathToMenuName = {
      '/': 'Shop',
      '/mens': 'Mens',
      '/womens': 'Womens',
      '/kids': 'Kids',
      '/personalize': 'Personalize',
      '/aboutus': 'About Us',
    };
    const currentMenu = pathToMenuName[location.pathname] || 'Home';
    setActiveMenu(currentMenu);
  }, [location.pathname]);

  // Toggle visibility of nav menu on small screens
  const toggleNavMenu = (e) => {
    menuRef.current.classList.toggle('nav-menu-visible');
    e.target.classList.toggle('open');
  };

  // Toggle dropdown user menu
  const toggleUserMenu = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Handle user logout logic
  const handleLogout = () => {
    localStorage.removeItem('auth-token'); // Clear token
    resetState();                          // Reset user-related state
    setDropdownOpen(false);                // Close dropdown
  };

  // List of main menu items with their respective paths
  const menuItems = [
    { name: "Shop", path: "/" },
    { name: "Mens", path: "/mens" },
    { name: "Womens", path: "/womens" },
    { name: "Kids", path: "/kids" },
    { name: "About Us", path: "/aboutus" },
  ];

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault(); // Prevent page reload
    if (searchQuery.trim()) {
      // Navigate to search route with query
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Return JSX for navbar UI
  return (
    <nav className="navbar">
      {/* Logo section on the left */}
      <div className="nav-logo">
        <Link to="/">
          <img src={logo} alt="Sneaker.NP Logo" />
          <p>Sneaker.NP</p>
        </Link>
      </div>

      {/* Search bar section */}
      <div className="nav-search">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query as user types
          />
          <button type="submit" className="search-button">
            <img src={search} alt="" className='search' />
          </button>
        </form>
      </div>

      {/* Main navigation menu */}
      <ul ref={menuRef} className="nav-menu">
        {menuItems.map(({ name, path }) => (
          <li key={name} className={activeMenu === name ? 'active' : ''} onClick={() => setActiveMenu(name)}>
            <Link to={path}>{name}</Link>
            <hr /> {/* Underline for the active menu item */}
          </li>
        ))}
      </ul>

      {/* Right-side icons and user login dropdown */}
      <div className="nav-login-cart">
        {/* Show login button only if user is not authenticated */}
        {!isAuthenticated && (
          <Link to="/login"><button>Login</button></Link>
        )}

        {/* Favourite icon with item count */}
        <Link to="/favourite" className="nav-icon-wrapper">
          <img src={heartIcon} alt="Favourite" />
          <div className="nav-cart-count">{isLoading ? "..." : getTotalFavouriteItems() || 0}</div>
        </Link>

        {/* Cart icon with item count */}
        <Link to="/cart" className="nav-icon-wrapper">
          <img src={cartIcon} alt="Cart" />
          <div className="nav-cart-count">{isLoading ? "..." : getTotalCartItems() || 0}</div>
        </Link>

        {/* User dropdown with username and logout options */}
        {isLoading ? (
          <span className="loading-text">Loading...</span> // Show loading if still fetching data
        ) : (
          isAuthenticated && (
            <div className="user-section">
              <div className="username-display" onClick={() => setDropdownOpen(!dropdownOpen)}>
                {userName || 'User'} {/* Display username or fallback */}
                <img src={menuIcon} alt="" className="menu-icon" />
              </div>

              {/* Dropdown menu for logged-in users */}
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link
                    to="/UserPanel"
                    className="nav-dropdown-link"
                    onClick={() => setDropdownOpen(false)}
                  >
                    My Details
                  </Link>
                  <Link
                    to="/"
                    className="nav-dropdown-link"
                    onClick={handleLogout}
                  >
                    Log Out
                  </Link>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </nav>
  );
};

export default Navbar;