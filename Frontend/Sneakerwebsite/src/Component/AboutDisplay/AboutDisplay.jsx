import React from 'react'
import'./AboutDisplay.css'
import sneakerimg from '../assets/background0.jpg'

const AboutDisplay = () => {
    return (
        <div className="about-container">
            <div className="about-content">
                <h1>About Us</h1>
                <p>
                    Welcome to Sneaker Haven, your number one source for the latest and greatest sneakers.
                    We're dedicated to providing you with the best selection, focusing on quality, style,
                    and customer satisfaction.
                </p>
                <p>
                    Founded in 2020, Sneaker Haven has come a long way from its beginnings. We hope you enjoy
                    our sneakers as much as we enjoy offering them to you.
                </p>
            </div>
            <div className="about-image">
                <img src={sneakerimg} alt="Sneaker Collection" />
            </div>
        </div>
    );
};
export default AboutDisplay
