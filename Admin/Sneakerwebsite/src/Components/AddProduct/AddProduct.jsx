import React, { useState } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg';
import { toast } from 'react-hot-toast';

const AddProduct = () => {
  const [image, setImage] = useState(null);
  const [productDetails, setProductDetails] = useState({
    name: '',
    category: 'men',
    brand: '',
    new_price: '',
    description: '',
  });
  const [sizes, setSizes] = useState([{ size: '', quantity: '' }]);
  const [error, setError] = useState(''); // Added for error display

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.errorr('Only .jpg and .png files are allowed');
        return;
      }
      setImage(file);
      setError('');
    }
  };

  const handleInputChange = (e) => {
    setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...sizes];
    newSizes[index][field] = value;
    setSizes(newSizes);
    setError('');
  };

  const addSizeField = () => {
    setSizes([...sizes, { size: '', quantity: '' }]);
  };

  const removeSizeField = (index) => {
    if (sizes.length > 1) {
      setSizes(sizes.filter((_, i) => i !== index));
    }
  };

  const addProduct = async () => {
    setError('');

    // Validate required fields
    if (
      !productDetails.name.trim() ||
      !productDetails.brand.trim() ||
      !productDetails.new_price ||
      !productDetails.description.trim() ||
      !image
    ) {
      toast.error('Please fill all required fields and upload an image.');
      return;
    }

    // Validate price
    const price = parseFloat(productDetails.new_price);
    if (isNaN(price) || price <= 0) {
      toast.error('Price must be a positive number.');
      return;
    }

    // Validate sizes
    for (const size of sizes) {
      if (!size.size.trim()) {
        toast.error('Size cannot be empty.');
        return;
      }
      const qty = parseInt(size.quantity);
      if (isNaN(qty) || qty < 0) {
        toast.error('Quantity must be a non-negative number.');
        return;
      }
    }

    const formData = new FormData();
    formData.append('product', image);
    formData.append('name', productDetails.name.trim());
    formData.append('category', productDetails.category);
    formData.append('brand', productDetails.brand.trim());
    formData.append('new_price', price);
    formData.append('description', productDetails.description.trim());
    formData.append('sizes', JSON.stringify(sizes.map((s) => ({ size: s.size.trim(), quantity: parseInt(s.quantity) }))));

    try {
      const response = await fetch('http://localhost:5000/addproduct', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Product Added Successfully'); 
        setProductDetails({
          name: '',
          category: 'men',
          brand: '',
          new_price: '',
          description: '',
        });
        setSizes([{ size: '', quantity: '' }]);
        setImage(null);
      } else {
        toast.error(data.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error adding product: ' + error.message);
    }
  };

  return (
    <div className="add-product">
      {error && <div className="error-message">{error}</div>}
      <div className="addproduct-itemfield">
        <p>Product Title</p>
        <input
          value={productDetails.name}
          onChange={handleInputChange}
          type="text"
          name="name"
          placeholder="Type Here..."
        />
      </div>
      <div className="addproduct-itemfield">
        <p>Brand</p>
        <input
          value={productDetails.brand}
          onChange={handleInputChange}
          type="text"
          name="brand"
          placeholder="Enter brand name..."
        />
      </div>
      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input
            value={productDetails.new_price}
            onChange={handleInputChange}
            type="number"
            name="new_price"
            placeholder="Type Here..."
            min="0.01"
            step="0.01"
          />
        </div>
      </div>
      <div className="addproduct-itemfield">
        <p>Product Category</p>
        <select
          value={productDetails.category}
          onChange={handleInputChange}
          name="category"
          className="add-product-selector"
        >
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="kid">Kid</option>
        </select>
      </div>
      <div className="addproduct-itemfield">
        <p>Product Description</p>
        <textarea
          value={productDetails.description}
          onChange={handleInputChange}
          name="description"
          placeholder="Enter product description..."
          rows="4"
        />
      </div>
      <div className="addproduct-itemfield">
        <p>Sizes and Quantities</p>
        {sizes.map((size, index) => (
          <div key={index} className="size-quantity-row">
            <input
              type="text"
              value={size.size}
              onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
              placeholder="Size (e.g., 19)"
              className="size-input"
            />
            <input
              type="number"
              value={size.quantity}
              onChange={(e) => handleSizeChange(index, 'quantity', e.target.value)}
              placeholder="Quantity"
              min="0"
              className="quantity-input"
            />
            {sizes.length > 1 && (
              <button
                type="button"
                onClick={() => removeSizeField(index)}
                className="remove-size-btn"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addSizeField} className="add-size-btn">
          Add Size
        </button>
      </div>
      <div className="addproduct-itemfield">
        <label htmlFor="file-input">
          <img
            src={image ? URL.createObjectURL(image) : upload_area}
            className="addproduct-thumbnail-img"
            alt="Product Thumbnail"
          />
        </label>
        <input
          onChange={handleImageChange}
          type="file"
          name="image"
          id="file-input"
          accept="image/jpeg,image/png"
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