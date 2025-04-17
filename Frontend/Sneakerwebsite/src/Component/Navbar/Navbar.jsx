import React, { useContext, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../../Context/ShopContext';
import './Navbar.css';
import logo from '../assets/logo.png';
import cartIcon from '../assets/cart_icon.png';
import heartIcon from '../assets/heart-icon.png';
import navDropdown from '../assets/nav_dropdown.png';
import menuIcon from '../assets/menu.png';

const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState("Home");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef();
  const { getTotalCartItems, getTotalFavouriteItems, userName } = useContext(ShopContext);

  const isAuthenticated = localStorage.getItem('auth-token');

  const toggleNavMenu = (e) => {
    menuRef.current.classList.toggle('nav-menu-visible');
    e.target.classList.toggle('open');
  };

  const toggleUserMenu = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const menuItems = [
    { name: "Shop", path: "/" },
    { name: "Mens", path: "/mens" },
    { name: "Womens", path: "/womens" },
    { name: "Kids", path: "/kids" },
    { name: "Personalize", path: "/personalize" },
    { name: "About Us", path: "/aboutus" },
  ];

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <img src={logo} alt="Sneaker.NP Logo" />
        <p>Sneaker.NP</p>
      </div>

      <img className="nav-dropdown" onClick={toggleNavMenu} src={navDropdown} alt="Menu" />

      <ul ref={menuRef} className="nav-menu">
        {menuItems.map(({ name, path }) => (
          <li key={name} className={activeMenu === name ? 'active' : ''} onClick={() => setActiveMenu(name)}>
            <Link to={path} className="nav-link">{name}</Link>
            <hr />
          </li>
        ))}
      </ul>

      <div className="nav-login-cart">
        {isAuthenticated ? (
          <>
            <p className="nav-user-name">{userName || "Loading..."}</p>
            <Link to="/cart" className="nav-icon-wrapper">
              <img src={cartIcon} alt="Cart" />
              <div className="nav-cart-count">{getTotalCartItems() || 0}</div>
            </Link>
            <Link to="/favourite" className="nav-icon-wrapper">
              <img src={heartIcon} alt="Favourite" />
              <div className="nav-cart-count">{getTotalFavouriteItems() || 0}</div>
            </Link>
            <div className="nav-user-menu">
              <img
                src={menuIcon}
                alt="User Menu"
                className="nav-menu-icon"
                onClick={toggleUserMenu}
              />
              {dropdownOpen && (
                <div className="nav-user-dropdown">
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
                    onClick={() => {
                      localStorage.removeItem('auth-token');
                      setDropdownOpen(false);
                    }}
                  >
                    Log Out
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login"><button>Login</button></Link>
            <Link to="/cart" className="nav-icon-wrapper">
              <img src={cartIcon} alt="Cart" />
              <div className="nav-cart-count">{getTotalCartItems() || 0}</div>
            </Link>
            <Link to="/favourite" className="nav-icon-wrapper">
              <img src={heartIcon} alt="Favourite" />
              <div className="nav-cart-count">{getTotalFavouriteItems() || 0}</div>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;