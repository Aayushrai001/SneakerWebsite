import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UserDetails.css'

const UserDetails = ({ userData, setUserData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData.name || '',
    phone: userData.phone || '',
    address: userData.address || '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Update preview image when userData changes
  useEffect(() => {
    setPreviewImage(userData.profileImage || null);
  }, [userData.profileImage]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Please upload only JPG or PNG images');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      
      // Append image if selected
      if (selectedImage) {
        formDataToSend.append('profileImage', selectedImage);
      }

      const response = await fetch('http://localhost:5000/user/update', {
        method: 'PUT',
        headers: { 'auth-token': token },
        body: formDataToSend,
      });
      
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
        setSelectedImage(null); // Reset selected image after successful update
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating user details:', error);
      toast.error('Error updating profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedImage(null);
    setPreviewImage(userData.profileImage || null);
  };

  return (
    <div className="user-details">
      <ToastContainer position="top-right" />
      <h3>User Information</h3>
      {isEditing ? (
        <div className="edit-form">
          <div className="profile-image-section">
            <div className="profile-image-container">
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt="Profile" 
                  className="profile-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f0f0f0'/%3E%3Ctext x='75' y='75' font-family='Arial' font-size='14' fill='%23666' text-anchor='middle' alignment-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <div className="profile-image-placeholder">
                  <span>No Image</span>
                </div>
              )}
            </div>
            <div className="image-upload">
              <label htmlFor="profile-image" className="upload-button">
                Upload Image
              </label>
              <input
                type="file"
                id="profile-image"
                accept=".jpg,.jpeg,.png"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <p className="image-hint">Supported formats: JPG, PNG (Max 5MB)</p>
            </div>
          </div>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input type="email" value={userData.email} disabled />
          </div>
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Address:</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-buttons">
            <button onClick={handleUpdate} className="save-button">Save</button>
            <button onClick={handleCancel} className="cancel-button">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="profile-image-section">
            <div className="profile-image-container">
              {userData.profileImage ? (
                <img 
                  src={userData.profileImage} 
                  alt="Profile" 
                  className="profile-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f0f0f0'/%3E%3Ctext x='75' y='75' font-family='Arial' font-size='14' fill='%23666' text-anchor='middle' alignment-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <div className="profile-image-placeholder">
                  <span>No Image</span>
                </div>
              )}
            </div>
          </div>
          <div className="user-info">
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Phone:</strong> {userData.phone || 'Not provided'}</p>
            <p><strong>Address:</strong> {userData.address || 'Not provided'}</p>
          </div>
          <button className="edit-button" onClick={() => setIsEditing(true)}>
            Edit Details
          </button>
        </>
      )}
    </div>
  );
};

export default UserDetails;