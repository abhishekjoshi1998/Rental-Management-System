import React from 'react';
import { Link } from 'react-router-dom';

const PropertyListItem = ({ property }) => {
  const imageUrl = property.photos && property.photos.length > 0
    ? `${process.env.REACT_APP_API_URL?.replace('/api', '')}${property.photos[0].filePath}`
    : 'https://via.placeholder.com/150?text=No+Image';

  return (
    <div className="card">
      <img src={imageUrl} alt={property.address?.street} style={{ width: '100%', height: '200px', objectFit: 'cover' }}/>
      <h3>{property.address?.street}, {property.address?.city}</h3>
      <p>Type: {property.type}</p>
      <p>Rent: ${property.rentAmount}/month</p>
      <p>{property.bedrooms} bed, {property.bathrooms} bath</p>
      <Link to={`/properties/${property._id}`}>View Details</Link>
      <Link to={`/applications/submit?propertyId=${property._id}`} style={{marginLeft: '10px'}}>Apply Now</Link>
    </div>
  );
};

export default PropertyListItem;