import React, { useState } from 'react';
import './Navbar.css';
import logo from '../assets/logo.png';
import cart_icon from '../assets/cart_icon.png';
import heart_icon from '../assets/heart-icon.png';
import { Link } from 'react-router-dom';
 
const Navbar = () => {
    const [menu, setMenu] = useState("Home");

    return (
        <div className="navbar">
            <div className="nav-logo">
                <img src={logo} alt='' />
                <p>Sneaker.NP</p>
            </div>
            <ul className="nav-menu">
                <li onClick={() => { setMenu("Shop") }}><Link style={{ textDecoration: 'none'}} to='/'>Shop</Link>{menu === "Shop" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("mens") }}><Link style={{ textDecoration: 'none'}} to='/mens'>Mens</Link>{menu === "mens" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("womens") }}><Link style={{ textDecoration: 'none'}} to="womens">Womens</Link>{menu === "womens" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("kids") }}><Link style={{ textDecoration: 'none'}} to='/kids'>Kids</Link>{menu === "kids" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("personalize") }}><Link style={{ textDecoration: 'none'}} to='/personalize'>Personalize</Link>{menu === "personalize" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("aboutUs") }}><Link style={{ textDecoration: 'none'}} to='/aboutus'>Aboutus</Link>{menu === "aboutUs" ? <hr /> : <></>}</li>
            </ul> 
            <div className="nav-login-cart">
                <Link to='/login'><button>Sign In</button></Link>
                <Link to='/cart'><img src={cart_icon} alt="" /></Link>
                <div className="nav-cart-count">0</div>
                <Link to='/favourite'>
                  <img src={heart_icon} alt="" />
                </Link>
                <div className="nav-cart-count">0</div>
            </div>
        </div>
    );
};

export default Navbar;
