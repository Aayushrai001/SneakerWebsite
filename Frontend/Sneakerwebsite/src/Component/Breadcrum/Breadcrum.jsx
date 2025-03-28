import React from 'react';
import './Breadcrum.css';
import arrow_icon from '../assets/breadcrum_arrow.png';

const Breadcrum = (props) => {
    const { product } = props;

    // Ensure product exists before trying to access properties
    if (!product) {
        return <div>Loading...</div>; // Fallback in case product is undefined
    }

    return (
        <div className="breadcrum">
            HOME <img src={arrow_icon} alt="arrow" />
            SHOP <img src={arrow_icon} alt="arrow" />
            {product.category} <img src={arrow_icon} alt="arrow" /> {product.name}
        </div>
    );
};

export default Breadcrum;
