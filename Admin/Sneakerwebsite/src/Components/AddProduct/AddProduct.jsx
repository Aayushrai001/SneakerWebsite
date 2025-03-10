// Components/AddProduct/AddProduct.jsx
import React from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg'

const AddProduct = () => {
    return (
        <div className="add-product">
            <div className="addproduct-itemfield">
                <p>Product Title</p>
                <input type="text" name='name' placeholder='Type Here...' />
            </div>
            <div className="addproduct-price">
                <div className="addproduct-itemfield">
                    <p>Price</p>
                    <input type="text" name='new_price' placeholder='Type Here...' />
                </div>
            </div>
            <div className="addproduct-itemfield">
                <p>Product Category</p>
                <select name="category" className='add-product-selector'>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="kid">kid</option>
                </select>
            </div>
            <div className="addproduct_itemfield">
                <label htmlFor="file-input">
                    <img src={upload_area} className='addproduct-thumnail-img' alt="" />
                </label>
                <input type="file" name='image' id='file-input' hidden />
            </div>
            <button className="addproduct-btn">ADD PRODUCT</button>
        </div>
    );
};

export default AddProduct;