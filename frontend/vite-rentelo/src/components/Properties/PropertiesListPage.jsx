// src/pages/Properties/PropertiesListPage.jsx
import React, { useState, useEffect } from 'react';
import { getProperties } from '../../api/propertyService.js'; // Ensure this path is correct
import PropertyListItem from '../../components/Properties/PropertyListItem.jsx'; // Ensure this path and extension are correct
import LoadingSpinner from '../../components/Common/LoadingSpinner.jsx'; // Ensure this path and extension are correct
import AlertMessage from '../../components/Common/AlertMessage.jsx'; // Ensure this path and extension are correct

const PropertiesListPage = () => {
  const [properties, setProperties] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1); // For pagination (if backend supports)
  const [totalPages, setTotalPages] = useState(1); // For pagination

  const fetchProperties = async (currentPage = 1) => {
    setLoading(true);
    setError('');
    try {
      // Pass pagination params if your backend supports them
      const params = { isAvailable: true, page: currentPage, limit: 10 };
      const responseData = await getProperties(params);

      // Log the raw response to help debug
      console.log("Raw API response for properties:", responseData);

      let propertiesArray = [];
      if (responseData && Array.isArray(responseData.properties)) {
        // Common structure: { properties: [], ... }
        propertiesArray = responseData.properties;
        if (responseData.totalPages) setTotalPages(responseData.totalPages);
        if (responseData.currentPage) setPage(responseData.currentPage);
      } else if (responseData && Array.isArray(responseData.data)) {
        // Another common structure: { data: [], ... }
        propertiesArray = responseData.data;
        if (responseData.totalPages) setTotalPages(responseData.totalPages);
        // Adjust if currentPage is named differently or not present
      } else if (Array.isArray(responseData)) {
        // API returns an array directly
        propertiesArray = responseData;
      } else {
        // Unexpected format
        console.error("Properties data received is not in a recognized array format:", responseData);
        setError('Received invalid data format for properties. Displaying no properties.');
        propertiesArray = []; // Default to empty array
      }
      setProperties(propertiesArray);

    } catch (err) {
      console.error("Failed to fetch properties:", err);
      setError(err.response?.data?.message || 'Failed to fetch properties. Please try again later.');
      setProperties([]); // Ensure properties is an array even on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(page);
  }, [page]); // Re-fetch when page changes

  // Handlers for pagination (basic example)
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
    }
  };


  if (loading && properties.length === 0) { // Show loader only on initial load or when properties are empty
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h2>Available Properties for Rent</h2>
      {error && <AlertMessage type="error" message={error} />}

      {/* Basic Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <button onClick={handlePrevPage} disabled={page === 1 || loading}>
            Previous
          </button>
          <span style={{ margin: '0 10px' }}>
            Page {page} of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={page === totalPages || loading}>
            Next
          </button>
        </div>
      )}

      {!loading && properties.length === 0 && !error && ( // Check !loading here to avoid showing "No properties" during load
        <p>No properties currently available matching your criteria.</p>
      )}

      {properties.length > 0 && (
        <div className="properties-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {properties.map(prop => (
            <PropertyListItem key={prop._id} property={prop} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertiesListPage;