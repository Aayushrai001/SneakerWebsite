import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../../Context/ShopContext';
import './Navbar.css';
import logo from '../assets/logo.png';
import cartIcon from '../assets/cart_icon.png';
import heartIcon from '../assets/heart-icon.png';
import navDropdown from '../assets/nav_dropdown.png';

const Navbar = () => {
    const [activeMenu, setActiveMenu] = useState("Home");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const menuRef = useRef();
    const { getTotalCartItems, getTotalFavouriteItems } = useContext(ShopContext);
    
    const isAuthenticated = localStorage.getItem('auth-token');

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserName();
        }
    }, [isAuthenticated]);

    const fetchUserName = async () => {
        try {
            const token = localStorage.getItem('auth-token');
            const response = await fetch('http://localhost:5000/getusername', {
                method: 'GET',
                headers: {
                    'auth-token': token,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                setUserName(data.name);
            }
        } catch (error) {
            console.error("Error fetching user name:", error);
        }
    };

    const toggleDropdown = (e) => {
        menuRef.current.classList.toggle('nav-menu-visible');
        e.target.classList.toggle('open');
    };

    const menuItems = [
        { name: "Shop", path: "/" },
        { name: "Mens", path: "/mens" },
        { name: "Womens", path: "/womens" },
        { name: "Kids", path: "/kids" },
        { name: "Personalize", path: "/personalize" },
        { name: "About Us", path: "/aboutus" }
    ];

    return (
        <nav className="navbar">
            <div className="nav-logo">
                <img src={logo} alt="Sneaker.NP Logo" />
                <p>Sneaker.NP</p>
            </div>
            
            <img className="nav-dropdown" onClick={toggleDropdown} src={navDropdown} alt="Menu" />
            
            <ul ref={menuRef} className="nav-menu">
                {menuItems.map(({ name, path }) => (
                    <li key={name} onClick={() => setActiveMenu(name)}>
                        <Link to={path} className="nav-link">{name}</Link>
                        {activeMenu === name && <hr />}
                    </li>
                ))}
            </ul>
            
            <div className="nav-login-cart">
                {isAuthenticated ? (
                    <div className="nav-user-menu">
                        <p className="nav-user-name" onClick={() => setDropdownOpen(!dropdownOpen)}>
                            {userName || "Loading..."}
                        </p>
                        {dropdownOpen && (
                            <div className="nav-user-dropdown">
                                <Link to="/UserPanel" className="nav-dropdown-link">My Details</Link>
                                <Link to="/" className="nav-dropdown-link" onClick={() => { 
                                    localStorage.removeItem('auth-token'); 
                                    window.location.replace('/'); 
                                }}>Log Out</Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login"><button>Login</button></Link>
                )}
                
                <Link to="/cart" className="nav-icon-wrapper">
                    <img src={cartIcon} alt="Cart" />
                    <div className="nav-cart-count">{getTotalCartItems() || 0}</div>
                </Link>
                
                <Link to="/favourite" className="nav-icon-wrapper">
                    <img src={heartIcon} alt="Favourite" />
                    <div className="nav-cart-count">{getTotalFavouriteItems() || 0}</div>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
