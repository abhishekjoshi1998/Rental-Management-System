import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLeaseDetails, terminateLease, renewLease, requestLeaseSignatureApi } from '../../api/leaseService';
import useAuth from '../hooks/useAuth.js';
import LoadingSpinner from '../../components/Common/LoadingSpinner.jsx';
import AlertMessage from '../../components/Common/AlertMessage.jsx';

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
      console.error("Fetch Lease Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLease();
    }
  }, [id]);

  const handleTerminate = async () => {
    if (window.confirm('Are you sure you want to terminate this lease?')) {
      setActionError('');
      setActionSuccess('');
      try {
        await terminateLease(id, { terminationReason: 'Terminated by manager/landlord' });
        setActionSuccess('Lease terminated successfully.');
        fetchLease(); // Refresh lease details
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
    setActionError('');
    setActionSuccess('');
    try {
        await requestLeaseSignatureApi(id, signerEmail);
        setActionSuccess(`Signature request sent to ${signerEmail}.`);
        fetchLease(); // Refresh lease details to show updated signature status
    } catch (err) {
        setActionError(err.response?.data?.message || 'Failed to request signature.');
    }
  };

  const canManage = user?.role === 'landlord' || user?.role === 'property_manager' || user?.role === 'admin';

  if (loading) return <LoadingSpinner />;
  if (error && !lease) return <AlertMessage type="error" message={error} />; // Show error only if lease hasn't loaded at all
  if (!lease) return <AlertMessage type="error" message="Lease not found or still loading." />;


  return (
    <div>
      <h2>Lease Details - ID: {lease._id}</h2>
      {error && <AlertMessage type="error" message={error} />} {/* Display fetch error here if lease data is partially available */}
      <p><strong>Property:</strong> {lease.property?.address?.street || 'N/A'}</p>
      <p><strong>Landlord:</strong> {lease.landlord?.firstName || ''} {lease.landlord?.lastName || ''}</p>
      <p><strong>Tenants:</strong></p>
      <ul>
        {lease.tenants?.map(t => <li key={t._id}>{t.firstName} {t.lastName} ({t.email})</li>)}
      </ul>
      <p><strong>Start Date:</strong> {new Date(lease.startDate).toLocaleDateString()}</p>
      <p><strong>End Date:</strong> {new Date(lease.endDate).toLocaleDateString()}</p>
      <p><strong>Rent Amount:</strong> ${lease.rentAmount} due on day {lease.rentDueDate} of month</p>
      <p><strong>Security Deposit:</strong> ${lease.securityDeposit}</p>
      <p><strong>Status:</strong> {lease.isActive ? 'Active' : `Inactive ${lease.terminationReason ? `(${lease.terminationReason})` : ''}`}</p>
      <div><strong>Terms:</strong> <pre style={{whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: '10px', border: '1px solid #eee'}}>{lease.termsAndConditions || 'N/A'}</pre></div>

      <h3 style={{marginTop: '20px'}}>Signatures:</h3>
      {lease.signatures?.length > 0 ? (
        <ul>
          {lease.signatures.map(sig => {
            let signerDisplay = 'Unknown Signer';
            const sigUserId = sig.userId?._id || sig.userId; // Handle populated vs unpopulated userId

            const tenantSigner = lease.tenants?.find(t => t._id === sigUserId);
            if (tenantSigner) {
              signerDisplay = `${tenantSigner.firstName} ${tenantSigner.lastName} (${tenantSigner.email})`;
            } else if (lease.landlord?._id === sigUserId) {
              signerDisplay = `Landlord: ${lease.landlord.firstName} ${lease.landlord.lastName} (${lease.landlord.email})`;
            }

            return (
              <li key={sigUserId}>
                {signerDisplay} -
                Status: <strong>{sig.eSignatureStatus || 'Not Requested'}</strong>
                {sig.signedAt && ` - Signed on: ${new Date(sig.signedAt).toLocaleString()}`}
              </li>
            );
          })}
        </ul>
      ) : <p>No signature process initiated or no signatures recorded.</p>}


      {canManage && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
          <h3>Manage Lease</h3>
          {actionError && <AlertMessage type="error" message={actionError} />}
          {actionSuccess && <AlertMessage type="success" message={actionSuccess} />}
          {lease.isActive && <button onClick={handleTerminate} style={{marginRight: '10px'}}>Terminate Lease</button>}
          <Link to={`/leases/${lease._id}/renew`} className="button-like" style={{marginRight: '10px'}}>Renew Lease</Link>

          <h4 style={{marginTop: '15px'}}>Request Signatures:</h4>
          {lease.tenants?.map(t => {
            const signature = lease.signatures?.find(s => (s.userId?._id || s.userId) === t._id);
            const alreadyRequestedOrSigned = signature && (signature.eSignatureStatus === 'sent' || signature.eSignatureStatus === 'completed');
            return (
             <button
                key={t._id}
                onClick={() => handleRequestSignature(t.email)}
                style={{marginRight: '5px', marginBottom: '5px'}}
                disabled={alreadyRequestedOrSigned}
                title={alreadyRequestedOrSigned ? `Signature ${signature.eSignatureStatus}` : `Request signature from ${t.firstName}`}
              >
                {alreadyRequestedOrSigned ? `Requested from ${t.firstName} (${signature.eSignatureStatus})` : `Request from ${t.firstName}`}
             </button>
          )})}
          {lease.landlord && (() => {
            const signature = lease.signatures?.find(s => (s.userId?._id || s.userId) === lease.landlord._id);
            const alreadyRequestedOrSigned = signature && (signature.eSignatureStatus === 'sent' || signature.eSignatureStatus === 'completed');
            return (
             <button
                onClick={() => handleRequestSignature(lease.landlord.email)}
                style={{marginRight: '5px', marginBottom: '5px'}}
                disabled={alreadyRequestedOrSigned}
                title={alreadyRequestedOrSigned ? `Signature ${signature.eSignatureStatus}` : `Request signature from Landlord`}
             >
                {alreadyRequestedOrSigned ? `Requested from Landlord (${signature.eSignatureStatus})` : `Request from Landlord`}
             </button>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default LeaseDetailPage;