import React from 'react'
import './Breadcrum.css'
import arrow_icon from '../assets/breadcrum_arrow.png'

const Breadcrum = () => {
    const {product} = props;
  return (
    <div className="breadcrum">
        HOME <img src={arrow_icon} alt="" />SHOP <img src={arrow_icon} alt="" />c {product.category} <img src={arrow_icon} alt="" /> {product.name}

    </div>
  )
}

export default Breadcrum
