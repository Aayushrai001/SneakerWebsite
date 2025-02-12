import React from 'react'
import './Footer.css'
import footer_logo from '../assets/logo.png'
import instragram_icon from '../assets/instagram_icon.png'
import facebok_icon from '../assets/facebook_icon.png'
import whatsapp_icon from '../assets/whatsapp_icon.png'

const Footer = () => {
  return (
    <div className="footer">
        <div className="footer=logo">
            <img src={footer_logo} alt="" />
            <p>Sneaker.NP</p>
        </div>
        <ul className="footer-link">
            <li>Product</li>
            <li>About Us</li>
        </ul>
        <div className="footer-social-icon">
            <div className="footer-icons-container">
                <img src={instragram_icon} alt="" />
            </div>
            <div className="footer-icons-container">
                <img src={facebok_icon} alt="" />
            </div>
            <div className="footer-icons-container">
                <img src={whatsapp_icon} alt="" />
            </div>
        </div>
        <div className="footer-copyright">
            <hr />
            <p>Copyright @ 2025 - All Right Reserved.</p>
        </div>
    </div>
  )
}

export default Footer
