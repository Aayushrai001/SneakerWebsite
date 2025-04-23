import React, { useContext, useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShopContext } from '../../Context/ShopContext';
import './Navbar.css';
import logo from '../assets/logo.png';
import search from '../assets/search.png';
import cartIcon from '../assets/cart_icon.png';
import heartIcon from '../assets/heart-icon.png';
import menuIcon from '../assets/menu.png';

const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState("Home");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef();
  const { getTotalCartItems, getTotalFavouriteItems, userName, resetState, isLoading, initializeUserData } = useContext(ShopContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = localStorage.getItem('auth-token');

  useEffect(() => {
    if (isAuthenticated) {
      initializeUserData(isAuthenticated);
    }
  }, [isAuthenticated]);

  // Update activeMenu based on current route
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

  const toggleNavMenu = (e) => {
    menuRef.current.classList.toggle('nav-menu-visible');
    e.target.classList.toggle('open');
  };

  const toggleUserMenu = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth-token');
    resetState();
    setDropdownOpen(false);
  };

  const menuItems = [
    { name: "Shop", path: "/" },
    { name: "Mens", path: "/mens" },
    { name: "Womens", path: "/womens" },
    { name: "Kids", path: "/kids" },
    { name: "Personalize", path: "/personalize" },
    { name: "About Us", path: "/aboutus" },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with the query parameter
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <img src={logo} alt="Sneaker.NP Logo" />
        <p>Sneaker.NP</p>
      </div>

      <div className="nav-search">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-button">
            <img src={search} alt="" className='search'/>
          </button>
        </form>
      </div>

      <ul ref={menuRef} className="nav-menu">
        {menuItems.map(({ name, path }) => (
          <li key={name} className={activeMenu === name ? 'active' : ''} onClick={() => setActiveMenu(name)}>
            <Link to={path}>{name}</Link>
            <hr />
          </li>
        ))}
      </ul>

      <div className="nav-login-cart">
        {!isAuthenticated && (
          <Link to="/login"><button>Login</button></Link>
        )}
        <Link to="/favourite" className="nav-icon-wrapper">
          <img src={heartIcon} alt="Favourite" />
          <div className="nav-cart-count">{isLoading ? "..." : getTotalFavouriteItems() || 0}</div>
        </Link>
        <Link to="/cart" className="nav-icon-wrapper">
          <img src={cartIcon} alt="Cart" />
          <div className="nav-cart-count">{isLoading ? "..." : getTotalCartItems() || 0}</div>
        </Link>
        {isLoading ? (
          <span className="loading-text">Loading...</span>
        ) : (
          isAuthenticated && (
            <div className="user-section">
              <div className="username-display" onClick={() => setDropdownOpen(!dropdownOpen)}>
                {userName || 'User'}
                <img src={menuIcon} alt="" className="menu-icon" />
              </div>
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