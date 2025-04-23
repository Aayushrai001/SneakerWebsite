import React from 'react';
import './CSS/Aboutus.css';
import sneakerimg from '../Component/assets/about.png';
import authorimg from '../Component/assets/profile.jpg';
import product1 from '../Component/assets/Air Jordan1 High OG Taxi.png';
import product2 from '../Component/assets/Jordan4 Retro Infrared.jpg';
import product3 from '../Component/assets/Nike SB Dunk Low Pro White Gum.jpg';


const AboutDisplay = () => {
    return (
        <div className="about-container">
            {/* About Section */}
            <div className="about-image">
                <div className="about-content">
                    <h1>About Us</h1>
                    <p>
                        Welcome to <strong>Sneaker Haven</strong>, your ultimate destination for the latest and trendiest sneakers.
                        We are committed to offering a curated selection of high-quality footwear, blending
                        style and comfort seamlessly.
                    </p>
                    <p>
                        Since our founding in 2020, we have built a passionate community of sneaker enthusiasts.
                        Our goal is to bring you exclusive releases and timeless classics.
                    </p>
                    <img src={sneakerimg} alt="Sneaker Collection" className="sneaker-img" />
                </div>
            </div>

            {/* Author Sections */}
            <div className="author-section left-align">
                <img src={authorimg} alt="Founder" className="author-img" />
                <div className="author-content">
                    <h2>Meet the Founder</h2>
                    <p>
                        <strong>John Doe</strong>, the visionary behind Sneaker Haven, has been a sneaker enthusiast for over a decade.
                        His passion for footwear and street culture led him to create a brand that speaks to every sneaker lover.
                    </p>
                </div>
            </div>
            <div className="product-section">
                <h2>Our Collection</h2>
                <div className="product-grid">
                    <div className="product-card">
                        <img src={product1} alt="Sneaker 1" />
                        <p>Air Jordan1 Taxi</p>
                    </div>
                    <div className="product-card">
                        <img src={product2} alt="Sneaker 2" />
                        <p>Jordan3 Infrared</p>
                    </div>
                    <div className="product-card">
                        <img src={product3} alt="Sneaker 3" />
                        <p>Nike SB Dunk White Gum</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutDisplay;
