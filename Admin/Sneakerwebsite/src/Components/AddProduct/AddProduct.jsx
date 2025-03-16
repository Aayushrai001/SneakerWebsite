import React, { useState } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg';

const AddProduct = () => {
  const [image, setImage] = useState(null);
  const [productDetails, setProductDetails] = useState({
    name: "",
    image: "",
    category: "Men",
    new_price: "",
    description: ""
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
    console.log(productDetails);
    let responseData = null;
    let product = { ...productDetails };
    let formData = new FormData();
    formData.append('product', image);

    try {
      const uploadResponse = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });

      responseData = await uploadResponse.json();
      
      if (responseData && responseData.success) {
        product.image = responseData.image_url;
        console.log(product);

        await fetch('http://localhost:5000/addproduct', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
        }).then((resp)=>resp.json()).then((data)=>{
            data.success?alert("Product Added"):alert("Failed")
        })
      }
    } catch (error) {
      console.error("Error uploading product:", error);
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
      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input 
            value={productDetails.new_price} 
            onChange={handleInputChange} 
            type="text" 
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
          <option value="mens">Men</option>
          <option value="womens">Women</option>
          <option value="kids">Kid</option>
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
