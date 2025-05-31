import React, { useState, useEffect } from 'react';
import MaintenanceRequestForm from '../../components/Maintenance/MaintenanceRequestForm';
import useAuth from '../../hooks/useAuth';
import { getLeases } from '../../api/leaseService'; // To find active lease
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';


const SubmitMaintenancePage = () => {
  const { user } = useAuth();
  const [activeLease, setActiveLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActiveLease = async () => {
      if (user?.role === 'tenant') {
        try {
          const response = await getLeases({ tenants: user._id, isActive: true });
          if (response.data.leases && response.data.leases.length > 0) {
            setActiveLease(response.data.leases[0]); // Assume first active lease
          } else {
            setError('No active lease found. Cannot submit maintenance request.');
          }
        } catch (err) {
          setError('Could not fetch lease information.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchActiveLease();
  }, [user]);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error} />;

  if (user?.role !== 'tenant') {
    return <AlertMessage type="error" message="Only tenants can submit maintenance requests." />;
  }
  if (!activeLease) {
    return <AlertMessage type="info" message="You need an active lease to submit a maintenance request." />;
  }

  return (
    <div>
      <h2>Submit Maintenance Request</h2>
      <p>For property: {activeLease.property?.address?.street}</p>
      <MaintenanceRequestForm propertyId={activeLease.property._id} leaseId={activeLease._id} />
    </div>
  );
};

export default SubmitMaintenancePage;