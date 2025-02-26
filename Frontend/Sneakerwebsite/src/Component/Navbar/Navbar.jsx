import React, { useContext, useRef, useState } from 'react';
import './Navbar.css';
import logo from '../assets/logo.png';
import cart_icon from '../assets/cart_icon.png';
import heart_icon from '../assets/heart-icon.png';
import { Link } from 'react-router-dom';
import { ShopContext } from '../../Context/ShopContext';
import nav_dropdown from '../assets/nav_dropdown.png'

const Navbar = () => {
    const [menu, setMenu] = useState("Home");
    const { getTotalCartItems } = useContext(ShopContext);
    const { getTotalFavouriteItems} = useContext(ShopContext);
    const menuRef = useRef();
    const dropdown_toggle= (e) =>{
        menuRef.current.classList.toggle('nav-menu-visible');
        e.target.classList.toggle('open');
    }

    return (
        <div className="navbar">
            <div className="nav-logo">
                <img src={logo} alt='' />
                <p>Sneaker.NP</p>
            </div>
            <img className='nav-dropdown' onClick={dropdown_toggle} src={nav_dropdown} alt="" />
            <ul ref={menuRef}className="nav-menu">
                <li onClick={() => { setMenu("Shop") }}><Link style={{ textDecoration: 'none' }} to='/'>Shop</Link>{menu === "Shop" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("mens") }}><Link style={{ textDecoration: 'none' }} to='/mens'>Mens</Link>{menu === "mens" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("womens") }}><Link style={{ textDecoration: 'none' }} to="womens">Womens</Link>{menu === "womens" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("kids") }}><Link style={{ textDecoration: 'none' }} to='/kids'>Kids</Link>{menu === "kids" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("personalize") }}><Link style={{ textDecoration: 'none' }} to='/personalize'>Personalize</Link>{menu === "personalize" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("aboutUs") }}><Link style={{ textDecoration: 'none' }} to='/aboutus'>Aboutus</Link>{menu === "aboutUs" ? <hr /> : <></>}</li>
            </ul>
            <div className="nav-login-cart">
                <Link to='/login'><button>Login</button></Link>

                {/* Cart Icon with Count */}
                <Link to='/cart' className="nav-icon-wrapper">
                    <img src={cart_icon} alt="Cart" />
                    <div className="nav-cart-count">{getTotalCartItems()}</div>
                </Link>

                {/* Heart Icon with Count */}
                <Link to='/favourite' className="nav-icon-wrapper">
                    <img src={heart_icon} alt="Favourite" />
                    <div className="nav-cart-count">{getTotalFavouriteItems()}</div> 
                </Link>
            </div>

        </div>
    );
};

export default Navbar;
