import React, { useState } from 'react'
import './Footer.css'
import footer_logo from '../assets/logo.png'
import instragram_icon from '../assets/instagram.png'
import facebok_icon from '../assets/facebook.png'
import whatsapp_icon from '../assets/whatapp.png'
import khalti_logo from '../assets/khalti.png'
import { Link } from 'react-router-dom'

const Footer = () => {
  const [activeToggle, setActiveToggle] = useState(null);

  const toggleSection = (section) => {
    setActiveToggle(activeToggle === section ? null : section);
  };

  const faqData = [
    {
      question: "What payment methods do you accept?",
      answer: "We accept Khalti, Visa, Mastercard, and PayPal for online payments. For in-store purchases, we also accept cash."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 3-5 business days within Nepal. International shipping may take 7-14 business days."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for unworn items in original packaging. Please visit our Returns page for more details."
    },
    {
      question: "Do you offer international shipping?",
      answer: "Yes, we ship internationally. Shipping costs and delivery times vary by location."
    }
  ];

  const sizeGuideData = [
    {
      title: "US Sizes",
      content: "US 5-13 for men, US 5-11 for women"
    },
    {
      title: "UK Sizes",
      content: "UK 3-12 for men, UK 3-9 for women"
    },
    {
      title: "EU Sizes",
      content: "EU 35-47 for men, EU 35-42 for women"
    }
  ];

  return (
    <div className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <img src={footer_logo} alt="Sneaker.NP Logo" />
            <p>Sneaker.NP</p>
          </div>
          <p className="footer-description">
            Your premier destination for authentic sneakers in Nepal. We offer the latest releases, 
            exclusive collaborations, and timeless classics. Experience quality, style, and comfort 
            with our carefully curated collection.
          </p>
          <div className="footer-social-icons">
            <a href="https://instagram.com/sneaker.np" target="_blank" rel="noopener noreferrer">
              <div className="footer-icons-container">
                <img src={instragram_icon} alt="Instagram" />
              </div>
            </a>
            <a href="https://facebook.com/sneaker.np" target="_blank" rel="noopener noreferrer">
              <div className="footer-icons-container">
                <img src={facebok_icon} alt="Facebook" />
              </div>
            </a>
            <a href="https://wa.me/9779825315733" target="_blank" rel="noopener noreferrer">
              <div className="footer-icons-container">
                <img src={whatsapp_icon} alt="WhatsApp" />
              </div>
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h3>Shop By Category</h3>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/mens">Men's Collection</Link></li>
            <li><Link to="/womens">Women's Collection</Link></li>
            <li><Link to="/kids">Kids' Collection</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Customer Support</h3>
          <ul className="footer-links">
            <li className="toggle-item" onClick={() => toggleSection('contact')}>
              Contact Us
              <div className={`toggle-content ${activeToggle === 'contact' ? 'active' : ''}`}>
                <p>📞 Phone: +977 9825315733</p>
                <p>📧 Email: support@sneaker.np</p>
                <p>🏪 Address: Kathmandu, Nepal</p>
                <p>⏰ Hours: 10:00 AM - 6:00 PM</p>
              </div>
            </li>
            <li className="toggle-item" onClick={() => toggleSection('faq')}>
              Frequently Asked Questions
              <div className={`toggle-content ${activeToggle === 'faq' ? 'active' : ''}`}>
                {faqData.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <h4>{faq.question}</h4>
                    <p>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </li>
            <li className="toggle-item" onClick={() => toggleSection('sizeGuide')}>
              Size Guide
              <div className={`toggle-content ${activeToggle === 'sizeGuide' ? 'active' : ''}`}>
                {sizeGuideData.map((guide, index) => (
                  <div key={index} className="size-guide-item">
                    <h4>{guide.title}</h4>
                    <p>{guide.content}</p>
                  </div>
                ))}
              </div>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>About Sneaker.NP</h3>
          <ul className="footer-links">
            <li><Link to="/aboutus">About us</Link></li>
            <li className="toggle-item" onClick={() => toggleSection('privacy')}>
              Privacy Policy
              <div className={`toggle-content ${activeToggle === 'privacy' ? 'active' : ''}`}>
                <p>We are committed to protecting your privacy. Your personal information is used only for order processing and improving your shopping experience.</p>
              </div>
            </li>
            <li className="toggle-item" onClick={() => toggleSection('terms')}>
              Terms & Conditions
              <div className={`toggle-content ${activeToggle === 'terms' ? 'active' : ''}`}>
                <p>By using our website, you agree to our terms of service. Please read our terms carefully before making a purchase.</p>
              </div>
            </li>
            <li className="toggle-item" onClick={() => toggleSection('storeLocator')}>
              Store Locator
              <div className={`toggle-content ${activeToggle === 'storeLocator' ? 'active' : ''}`}>
                <p>📍 Main Store: Kathmandu Mall, Floor 3</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Stay Updated</h3>
          <p>Subscribe to our newsletter for exclusive offers, new releases, and style inspiration!</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email address" />
            <button type="submit">Subscribe</button>
          </div>
          <div className="footer-contact-info">
            <p>📞 Call us: +977 9825315733</p>
            <p>📧 Email: support@sneaker.np</p>
            <p>🏪 Store: Main Store: Kathmandu Mall, Floor 3</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <hr />
        <div className="footer-bottom-content">
          <p>Copyright © 2024 Sneaker.NP - All Rights Reserved.</p>
          <div className="payment-methods">
            <span>Secure Payment Methods:</span>
            <div className="payment-icons">
              <img src={khalti_logo} alt="Khalti" className="payment-icon" />
              <i className="fab fa-cc-visa"></i>
              <i className="fab fa-cc-mastercard"></i>
              <i className="fab fa-cc-paypal"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Footer
