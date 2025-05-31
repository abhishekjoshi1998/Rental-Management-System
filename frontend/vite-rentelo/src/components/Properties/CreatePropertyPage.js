// src/pages/Properties/CreatePropertyPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProperty } from '../../api/propertyService';
import AlertMessage from '../../components/Common/AlertMessage';

const CreatePropertyPage = () => {
  const navigate = useNavigate();
  // Basic form state, would need to be much more comprehensive
  const [addressStreet, setAddressStreet] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [type, setType] = useState('apartment');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [photos, setPhotos] = useState([]); // For file uploads
  // ... other property fields

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
     setPhotos(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('address.street', addressStreet); // Backend expects nested structure
    formData.append('address.city', "Your City"); // Example, add more fields
    formData.append('address.state', "Your State");
    formData.append('address.zipCode', "00000");
    formData.append('rentAmount', rentAmount);
    formData.append('type', type);
    formData.append('bedrooms', bedrooms);
    formData.append('bathrooms', bathrooms);
    photos.forEach(photo => formData.append('photos', photo));
    // Append all other necessary fields...

    try {
      const response = await createProperty(formData);
      navigate(`/properties/${response.data._id}`); // Redirect to the new property's detail page
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create property.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Add New Property</h2>
      {error && <AlertMessage type="error" message={error} />}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Street Address:</label>
          <input type="text" value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} required />
        </div>
        {/* Add city, state, zip inputs */}
        <div>
          <label>Rent Amount ($):</label>
          <input type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} required />
        </div>
         <div>
          <label>Type:</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
             <option value="apartment">Apartment</option>
             <option value="house">House</option>
             <option value="condo">Condo</option>
             <option value="townhouse">Townhouse</option>
          </select>
        </div>
        <div>
          <label>Bedrooms:</label>
          <input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} required />
        </div>
        <div>
          <label>Bathrooms:</label>
          <input type="number" min="0.5" step="0.5" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} required />
        </div>
        <div>
             <label>Photos:</label>
             <input type="file" multiple onChange={handlePhotoChange} accept="image/*" />
        </div>
        {/* ... Add many more fields for a complete property form ... */}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Property'}
        </button>
      </form>
    </div>
  );
};

export default CreatePropertyPage;