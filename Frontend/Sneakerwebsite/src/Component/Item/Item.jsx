// Importing necessary modules and components
import React from 'react'
import './Item.css'                             
import { Link } from 'react-router-dom'         

// Functional component 'Item' that accepts 'props' as argument
const Item = (props) => {
    return (
        <div className="item"> 
            {/* 
                Link to the product detail page using the product ID from props.
                The onClick triggers scroll to top when an item is clicked.
            */}
            <Link to={`/product/${props.id}`}>
                <img onClick={window.scrollTo(0,0)} src={props.image} alt="" />
            </Link>

            {/* Display the name of the product */}
            <p>{props.name}</p>

            {/* Displaying price section */}
            <div className="item-prices">
                {/* Display the new (current) price of the item */}
                <div className="item-price-new">
                    Rs.{props.new_price}
                </div>
            </div>
        </div>
    )
}

export default Item
