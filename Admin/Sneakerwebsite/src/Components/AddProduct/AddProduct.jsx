import React, { useState } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg';

const AddProduct = () => {
  const [image, setImage] = useState(null);
  const [productDetails, setProductDetails] = useState({
    name: "",
    image: "",
    category: "men",
    brand: "",
    new_price: "",
    description: "",
    quantity: ""
  });

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  const handleInputChange = (e) => {
    setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
  };

  const addProduct = async () => {
    let product = { ...productDetails };
    product.quantity = parseInt(product.quantity, 10);
    product.new_price = parseFloat(product.new_price); // Ensure price is a number

    // Validate required fields
    if (!product.name || !product.brand || !product.new_price || !product.quantity || !image) {
      alert("Please fill all required fields and upload an image.");
      return;
    }

    let formData = new FormData();
    formData.append('product', image);

    try {
      // Step 1: Upload image
      const uploadResponse = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });

      const responseData = await uploadResponse.json();
      if (!responseData.success) {
        throw new Error("Image upload failed");
      }

      product.image = responseData.image_url;

      // Step 2: Add product
      const addResponse = await fetch('http://localhost:5000/addproduct', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      const addData = await addResponse.json();
      if (addData.success) {
        alert("Product Added Successfully");
        // Reset form
        setProductDetails({
          name: "",
          image: "",
          category: "men",
          brand: "",
          new_price: "",
          description: "",
          quantity: ""
        });
        setImage(null);
      } else {
        alert("Failed to add product: " + (addData.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product: " + error.message);
    }
  };

  return (
    <div className="add-product">
      <div className="addproduct-itemfield">
        <p>Product Title</p>
        <input 
          value={productDetails.name} 
          onChange={handleInputChange} 
          type="text" 
          name='name' 
          placeholder='Type Here...' 
        />
      </div>
      <div className="addproduct-itemfield">
        <p>Brand</p>
        <input 
          value={productDetails.brand} 
          onChange={handleInputChange} 
          type="text" 
          name='brand' 
          placeholder='Enter brand name...' 
        />
      </div>
      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input 
            value={productDetails.new_price} 
            onChange={handleInputChange} 
            type="number" 
            name='new_price' 
            placeholder='Type Here...' 
          />
        </div>
      </div>
      <div className="addproduct-itemfield">
        <p>Product Category</p>
        <select 
          value={productDetails.category} 
          onChange={handleInputChange} 
          name="category" 
          className='add-product-selector'
        >
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="kid">Kid</option>
        </select>
      </div>
      <div className="addproduct-itemfield">
        <p>Product Description</p>
        <input
          value={productDetails.description} 
          onChange={handleInputChange} 
          name='description' 
          placeholder='Enter product description...'
        />
      </div>
      <div className="addproduct-itemfield">
        <p>Quantity</p>
        <input
          value={productDetails.quantity} 
          onChange={handleInputChange} 
          name='quantity' 
          type='number'
          placeholder='Enter available stock...'
        />
      </div>
      <div className="addproduct-itemfield">
        <label htmlFor="file-input">
          <img 
            src={image ? URL.createObjectURL(image) : upload_area} 
            className='addproduct-thumbnail-img' 
            alt="Product Thumbnail"
          />
        </label>
        <input 
          onChange={handleImageChange} 
          type="file" 
          name='image' 
          id='file-input' 
          hidden 
        />
      </div>
      <button onClick={addProduct} className="addproduct-btn">
        ADD PRODUCT
      </button>
    </div>
  );
};

export default AddProduct;