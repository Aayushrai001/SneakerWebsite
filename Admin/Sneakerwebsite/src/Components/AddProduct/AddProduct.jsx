import React, { useState } from 'react';
import './AddProduct.css'; 
import upload_area from '../../assets/upload_area.svg'; 
import { toast } from 'react-hot-toast'; 
// Define the AddProduct component
const AddProduct = () => {
  // State to store the selected product image file
  const [image, setImage] = useState(null);
  // State to store product details (name, category, brand, price, description)
  const [productDetails, setProductDetails] = useState({
    name: '',
    category: 'men',
    brand: '',
    new_price: '',
    description: '',
  });
  // State to store an array of size and quantity pairs
  const [sizes, setSizes] = useState([{ size: '', quantity: '' }]);
  // State to track loading status during product submission
  const [loading, setLoading] = useState(false);

  // Function to handle image file selection
  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      // Validate file type (only JPEG and PNG allowed)
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Only .jpg and .png files are allowed');
        return;
      }
      setImage(file); // Update image state with selected file
      toast.success('Image selected successfully'); // Show success notification
    }
  };

  // Function to handle changes to product detail inputs
  const handleInputChange = (e) => {
    setProductDetails({ ...productDetails, [e.target.name]: e.target.value }); // Update specific field in productDetails
  };

  // Function to handle changes to size and quantity inputs
  const handleSizeChange = (index, field, value) => {
    const newSizes = [...sizes]; // Create a copy of sizes array
    newSizes[index][field] = value; // Update specific field (size or quantity) at given index
    setSizes(newSizes); // Update sizes state
  };

  // Function to add a new size and quantity input field
  const addSizeField = () => {
    setSizes([...sizes, { size: '', quantity: '' }]); // Add new size object to array
    toast.success('New size field added'); // Show success notification
  };

  // Function to remove a size and quantity input field
  const removeSizeField = (index) => {
    if (sizes.length > 1) {
      // Only remove if more than one size field exists
      setSizes(sizes.filter((_, i) => i !== index)); // Remove size field at given index
      toast.success('Size field removed'); // Show success notification
    } else {
      toast.error('At least one size is required'); // Show error if trying to remove the last size field
    }
  };

  // Function to handle product submission to the backend
  const addProduct = async () => {
    setLoading(true); // Set loading state to true
    const loadingToast = toast.loading('Adding product...'); // Show loading toast
    try {
      // Validate required fields
      if (!productDetails.name.trim() || !productDetails.brand.trim() || !productDetails.new_price || !productDetails.description.trim() || !image) {
        toast.error('Please fill all required fields and upload an image', { id: loadingToast });
        setLoading(false);
        return;
      }

      // Validate price
      const price = parseFloat(productDetails.new_price);
      if (isNaN(price) || price <= 0) {
        toast.error('Price must be a positive number', { id: loadingToast });
        setLoading(false);
        return;
      }

      // Validate sizes and quantities
      for (const size of sizes) {
        if (!size.size.trim()) {
          toast.error('Size cannot be empty', { id: loadingToast });
          setLoading(false);
          return;
        }
        const qty = parseInt(size.quantity);
        if (isNaN(qty) || qty < 0) {
          toast.error('Quantity must be a non-negative number', { id: loadingToast });
          setLoading(false);
          return;
        }
      }

      // Prepare form data for submission
      const formData = new FormData();
      formData.append('product', image); // Add image file
      formData.append('name', productDetails.name.trim()); // Add trimmed product name
      formData.append('category', productDetails.category); // Add category
      formData.append('brand', productDetails.brand.trim()); // Add trimmed brand
      formData.append('new_price', price); // Add price as number
      formData.append('description', productDetails.description.trim()); // Add trimmed description
      formData.append('sizes', JSON.stringify(sizes.map((s) => ({ size: s.size.trim(), quantity: parseInt(s.quantity) })))); // Add sizes as JSON string

      // Send POST request to backend
      const response = await fetch('http://localhost:5000/addproduct', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Product added successfully', { id: loadingToast }); // Show success notification
        // Reset form fields
        setProductDetails({
          name: '',
          category: 'men',
          brand: '',
          new_price: '',
          description: '',
        });
        setSizes([{ size: '', quantity: '' }]); // Reset sizes to one empty field
        setImage(null); // Clear image
      } else {
        // Handle specific error messages
        if (data.message.includes('already exists in this category')) {
          toast.error('A product with this name already exists in this category. You can use the same name in a different category (men/women/kid).', { id: loadingToast });
        } else {
          toast.error(data.message || 'Failed to add product', { id: loadingToast });
        }
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error adding product:', error);
      toast.error('Error adding product: ' + error.message, { id: loadingToast });
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // JSX rendering of the component
  return (
    // Main container for the add product form
    <div className="add-product">
      {/* Product title input */}
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
      {/* Brand input */}
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
      {/* Price input */}
      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input
            value={productDetails.new_price}
            onChange={handleInputChange}
            type="number"
            name="new_price"
            placeholder="Type Here..."
            min="0.01" // Minimum price value
            step="0.01" // Allow decimal places
          />
        </div>
      </div>
      {/* Category selection dropdown */}
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
      {/* Product description textarea */}
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
      {/* Sizes and quantities input section */}
      <div className="addproduct-itemfield">
        <p>Sizes and Quantities</p>
        {sizes.map((size, index) => (
          // Render input fields for each size and quantity pair
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
              min="0" // Prevent negative quantities
              className="quantity-input"
            />
            {sizes.length > 1 && (
              // Button to remove size field (only if more than one field exists)
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
        {/* Button to add a new size field */}
        <button type="button" onClick={addSizeField} className="add-size-btn">
          Add Size
        </button>
      </div>
      {/* Image upload section */}
      <div className="addproduct-itemfield">
        <label htmlFor="file-input">
          {/* Display selected image or placeholder */}
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
          accept="image/jpeg,image/png" // Restrict to JPEG and PNG
          hidden // Hide the input, use label for styling
        />
      </div>
      {/* Submit button to add product */}
      <button onClick={addProduct} className="addproduct-btn" disabled={loading}>
        {loading ? 'Adding Product...' : 'ADD PRODUCT'}
      </button>
    </div>
  );
};

export default AddProduct;