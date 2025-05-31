import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLeaseDetails, terminateLease, renewLease, requestLeaseSignatureApi } from '../../api/leaseService';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';

const LeaseDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchLease = async () => {
    setLoading(true);
    try {
      const response = await getLeaseDetails(id);
      setLease(response.data);
    } catch (err) {
      setError('Failed to fetch lease details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLease();
  }, [id]);

  const handleTerminate = async () => {
    if (window.confirm('Are you sure you want to terminate this lease?')) {
      setActionError(''); setActionSuccess('');
      try {
        await terminateLease(id, { terminationReason: 'Terminated by manager/landlord' });
        setActionSuccess('Lease terminated successfully.');
        fetchLease();
      } catch (err) {
        setActionError(err.response?.data?.message || 'Failed to terminate lease.');
      }
    }
  };

  const handleRequestSignature = async (signerEmail) => {
    if (!signerEmail) {
        setActionError("Signer email is required.");
        return;
    }
    setActionError(''); setActionSuccess('');
    try {
        await requestLeaseSignatureApi(id, signerEmail);
        setActionSuccess(`Signature request sent to ${signerEmail}.`);
        fetchLease();
    } catch (err) {
        setActionError(err.response?.data?.message || 'Failed to request signature.');
    }
  };


  const canManage = user?.role === 'landlord' || user?.role === 'property_manager' || user?.role === 'admin';

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error} />;
  if (!lease) return <AlertMessage type="error" message="Lease not found." />;

  return (
    <div>
      <h2>Lease Details - ID: {lease._id}</h2>
      <p><strong>Property:</strong> {lease.property?.address?.street}</p>
      <p><strong>Landlord:</strong> {lease.landlord?.firstName} {lease.landlord?.lastName}</p>
      <p><strong>Tenants:</strong></p>
      <ul>
        {lease.tenants?.map(t => <li key={t._id}>{t.firstName} {t.lastName} ({t.email})</li>)}
      </ul>
      <p><strong>Start Date:</strong> {new Date(lease.startDate).toLocaleDateString()}</p>
      <p><strong>End Date:</strong> {new Date(lease.endDate).toLocaleDateString()}</p>
      <p><strong>Rent Amount:</strong> ${lease.rentAmount} due on day {lease.rentDueDate} of month</p>
      <p><strong>Security Deposit:</strong> ${lease.securityDeposit}</p>
      <p><strong>Status:</strong> {lease.isActive ? 'Active' : `Inactive ${lease.terminationReason ? `(${lease.terminationReason})` : ''}`}</p>
      <p><strong>Terms:</strong> <pre>{lease.termsAndConditions || 'N/A'}</pre></p>

      <h3>Signatures:</h3>
      {lease.signatures?.length > 0 ? (
        <ul>
            {lease.signatures.map(sig => (
                <li key={sig.userId._id || sig.userId}>
                    {lease.tenants.find(t=>t._id === sig.userId)?.email || lease.landlord?.email (if landlord id matches sig.userId)} -
                    Status: {sig.eSignatureStatus || 'Not Requested'}
                    {sig.signedAt && ` - Signed on: ${new Date(sig.signedAt).toLocaleString()}`}
                </li>
            ))}
        </ul>
      ) : <p>No signature process initiated or no signatures recorded.</p>}


      {canManage && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
          <h3>Manage Lease</h3>
          {actionError && <AlertMessage type="error" message={actionError} />}
          {actionSuccess && <AlertMessage type="success" message={actionSuccess} />}
          {lease.isActive && <button onClick={handleTerminate}>Terminate Lease</button>}
          <Link to={`/leases/${id}/renew`} style={{marginLeft: '10px'}}>Renew Lease</Link>
          <h4>Request Signatures</h4>
          {lease.tenants?.map(t => (
             <button key={t._id} onClick={() => handleRequestSignature(t.email)} style={{marginRight: '5px'}}>
                Request from {t.firstName}
             </button>
          ))}
          {lease.landlord && (
             <button onClick={() => handleRequestSignature(lease.landlord.email)}>
                Request from Landlord ({lease.landlord.firstName})
             </button>
          )}

        </div>
      )}
    </div>
  );
};

export default LeaseDetailPage;