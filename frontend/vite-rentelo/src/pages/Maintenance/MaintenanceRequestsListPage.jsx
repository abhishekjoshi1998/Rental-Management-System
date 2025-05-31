import React, { useState, useEffect } from 'react';
import { getMaintenanceRequests } from '../../api/maintenanceService';
import useAuth from '../../components/hooks/useAuth';
import MaintenanceRequestListItem from '../../pages/Maintenance/MaintenanceRequestListItem';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';
import { Link } from 'react-router-dom';

const MaintenanceRequestsListPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await getMaintenanceRequests(); // Add params for landlord filtering
        setRequests(response.data.requests || response.data);
      } catch (err) {
        setError('Failed to fetch maintenance requests.');
      } finally {
        setLoading(false);
      }
    };
    if(user) fetchRequests();
    else { setLoading(false); setError("Not authenticated"); }
  }, [user]);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error} />;

  return (
    <div>
      <h2>Maintenance Requests</h2>
      {user?.role === 'tenant' && (
        <Link to="/maintenance/submit" className="button-like">Submit New Request</Link>
      )}
      {requests.length === 0 ? (
        <p>No maintenance requests found.</p>
      ) : (
        requests.map(req => (
          <MaintenanceRequestListItem key={req._id} request={req} />
        ))
      )}
    </div>
  );
};

export default MaintenanceRequestsListPage;