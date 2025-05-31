// src/pages/Leases/CreateLeasePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLease } from '../../api/leaseService';
import AlertMessage from '../../components/Common/AlertMessage';

const CreateLeasePage = () => {
  const navigate = useNavigate();
  // Highly simplified form state
  const [propertyId, setPropertyId] = useState('');
  const [tenantIds, setTenantIds] = useState(''); // Comma-separated string of IDs
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const tenantsArray = tenantIds.split(',').map(id => id.trim()).filter(id => id);
      if (tenantsArray.length === 0) {
         setError('At least one tenant ID is required.');
         setLoading(false);
         return;
      }
      const leaseData = { propertyId, tenants: tenantsArray, startDate, endDate, rentAmount, rentDueDate: 1 }; // rentDueDate default 1
      const response = await createLease(leaseData);
      navigate(`/leases/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create lease.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New Lease Agreement</h2>
      {error && <AlertMessage type="error" message={error} />}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Property ID:</label>
          <input type="text" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required />
        </div>
        <div>
          <label>Tenant IDs (comma-separated):</label>
          <input type="text" value={tenantIds} onChange={(e) => setTenantIds(e.target.value)} required />
        </div>
        <div>
          <label>Start Date:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label>End Date:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
        <div>
          <label>Rent Amount ($):</label>
          <input type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} required />
        </div>
        {/* ... Add more lease fields ... */}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Lease'}
        </button>
      </form>
    </div>
  );
};

export default CreateLeasePage;