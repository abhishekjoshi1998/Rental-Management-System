// src/pages/Leases/RenewLeasePage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLeaseDetails, renewLease } from '../../api/leaseService';
import AlertMessage from '../../components/Common/AlertMessage';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const RenewLeasePage = () => {
  const { id: originalLeaseId } = useParams();
  const navigate = useNavigate();
  const [originalLease, setOriginalLease] = useState(null);
  const [newEndDate, setNewEndDate] = useState('');
  const [newRentAmount, setNewRentAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    const fetchOriginalLease = async () => {
      try {
        const response = await getLeaseDetails(originalLeaseId);
        setOriginalLease(response.data);
        setNewRentAmount(response.data.rentAmount); // Pre-fill with current rent
      } catch (err) {
        setError('Failed to load original lease details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOriginalLease();
  }, [originalLeaseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRenewing(true);
    setError('');
    try {
      const renewalData = { newEndDate, newRentAmount };
      const response = await renewLease(originalLeaseId, renewalData);
      navigate(`/leases/${response.data.renewedLease._id}`); // Navigate to the NEW lease
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to renew lease.');
      setRenewing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !originalLease) return <AlertMessage type="error" message={error} />;
  if (!originalLease) return <p>Original lease not found.</p>;

  return (
    <div>
      <h2>Renew Lease for Property: {originalLease.property?.address?.street}</h2>
      <p>Original End Date: {new Date(originalLease.endDate).toLocaleDateString()}</p>
      {error && <AlertMessage type="error" message={error} />}
      <form onSubmit={handleSubmit}>
        <div>
          <label>New End Date:</label>
          <input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} required />
        </div>
        <div>
          <label>New Rent Amount ($):</label>
          <input type="number" value={newRentAmount} onChange={(e) => setNewRentAmount(e.target.value)} required />
        </div>
        {/* Add field for newTerms if applicable */}
        <button type="submit" disabled={renewing}>
          {renewing ? 'Renewing...' : 'Renew Lease'}
        </button>
      </form>
    </div>
  );
};

export default RenewLeasePage;