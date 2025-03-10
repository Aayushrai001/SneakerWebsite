import React from 'react'
import './Sidebar.css'
import {Link} from 'react-router-dom'
import add_product_icon from '../../assets/Product_Cart.svg'
import list_product_icon from '../../assets/Product_list_icon.svg'

const Sidebar = () => {
  return ( 
    <div className='sidebar'> 
      <Link to={'/addproduct'} style={{textDecoration:"none"}}>
      <div className="sidebar-item">
        <img src={add_product_icon} alt="" />
        <p>Add Product</p>
      </div>
      </Link>
      <Link to={'/listproduct'} style={{textDecoration:"none"}}>
      <div className="sidebar-item">
        <img src={list_product_icon} alt="" />
        <p>Product List</p>
      </div>
      </Link>
      <Link to={'/reviewsfeedback'} style={{textDecoration:"none"}}>
      <div className="sidebar-item">
        <p>Revies and Feedbacks</p>
      </div>
      </Link>
      <Link to={'/orders'} style={{textDecoration:"none"}}>
      <div className="sidebar-item">
        <p>Orders</p>
      </div>
      </Link>
      <Link to={'/transaction'} style={{textDecoration:"none"}}>
      <div className="sidebar-item">
        <p>Transaction</p>
      </div>
      </Link>
      <Link to={'/custom'} style={{textDecoration:"none"}}>
      <div className="sidebar-item">
        <p>Custom</p>
      </div>
      </Link>
    </div>
  )
}

export default Sidebar
