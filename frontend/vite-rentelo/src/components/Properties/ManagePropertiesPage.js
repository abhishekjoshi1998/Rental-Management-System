// src/pages/Properties/ManagePropertiesPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProperties, deleteProperty } from '../../api/propertyService'; // Assuming getProperties can filter by landlord
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';

const ManagePropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const fetchMyProperties = async () => {
     setLoading(true);
     try {
       // Backend needs to filter properties by landlord/PM ID from token
       const response = await getProperties({ landlordId: user._id }); // Or however your backend filters
       setProperties(response.data.properties || response.data);
     } catch (err) {
       setError('Failed to fetch your properties.');
     } finally {
       setLoading(false);
     }
  };

  useEffect(() => {
    if (user) {
      fetchMyProperties();
    }
  }, [user]);

  const handleDelete = async (propertyId) => {
     if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
         try {
             await deleteProperty(propertyId);
             fetchMyProperties(); // Refresh list
         } catch (err) {
             setError(err.response?.data?.message || 'Failed to delete property.');
         }
     }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error} />;

  return (
    <div>
      <h2>Manage My Properties</h2>
      <Link to="/manage-properties/create" style={{ display: 'inline-block', marginBottom: '20px', padding: '10px', background: '#5cb85c', color: 'white', textDecoration: 'none' }}>
        + Add New Property
      </Link>
      {properties.length === 0 ? (
        <p>You have not added any properties yet.</p>
      ) : (
        properties.map(prop => (
          <div key={prop._id} className="card">
            <h3>{prop.address?.street}, {prop.address?.city}</h3>
            <p>Status: {prop.status}</p>
            <p>Rent: ${prop.rentAmount}</p>
            <Link to={`/properties/${prop._id}`}>View</Link> |{' '}
            <Link to={`/manage-properties/edit/${prop._id}`}>Edit</Link> |{' '}
            <button onClick={() => handleDelete(prop._id)} style={{color: 'red', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
};

export default ManagePropertiesPage;