import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMaintenanceRequestDetails, updateMaintenanceRequestStatus, addMaintenanceFeedback } from '../../api/maintenanceService';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import AlertMessage from '../../components/Common/AlertMessage';

const MaintenanceRequestDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [newStatus, setNewStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState(''); // For landlord to assign

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState('');


  const fetchRequest = async () => {
    setLoading(true);
    try {
      const response = await getMaintenanceRequestDetails(id);
      setRequest(response.data);
      setNewStatus(response.data.status);
    } catch (err) {
      setError('Failed to fetch maintenance request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRequest();
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setActionError(''); setActionSuccess('');
    try {
      await updateMaintenanceRequestStatus(id, { status: newStatus, notes: updateNotes, assignedTo: assignedTo || undefined });
      setActionSuccess('Request updated successfully!');
      fetchRequest();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update request.');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setActionError(''); setActionSuccess('');
    if (feedbackRating < 1 || feedbackRating > 5) {
        setActionError('Please provide a rating between 1 and 5.');
        return;
    }
    try {
        await addMaintenanceFeedback(id, { rating: feedbackRating, comments: feedbackComments });
        setActionSuccess('Feedback submitted successfully!');
        fetchRequest();
    } catch (err) {
        setActionError(err.response?.data?.message || 'Failed to submit feedback.');
    }
  };

  const canManage = user?.role === 'landlord' || user?.role === 'property_manager' || user?.role === 'admin';
  const isTenantOwner = user && request && request.tenant?._id === user._id;


  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error} />;
  if (!request) return <AlertMessage type="error" message="Request not found." />;

  return (
    <div>
      <h2>Maintenance Request - ID: {request._id}</h2>
      <p><strong>Property:</strong> {request.property?.address?.street}</p>
      <p><strong>Tenant:</strong> {request.tenant?.firstName} {request.tenant?.lastName}</p>
      <p><strong>Issue:</strong> {request.issueDescription}</p>
      <p><strong>Category:</strong> {request.category}</p>
      <p><strong>Urgency:</strong> {request.urgency}</p>
      <p><strong>Status:</strong> {request.status}</p>
      <p><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleString()}</p>
      {request.assignedTo && <p><strong>Assigned To:</strong> {request.assignedTo?.firstName} {request.assignedTo?.lastName}</p>}
      {request.completionDate && <p><strong>Completed On:</strong> {new Date(request.completionDate).toLocaleString()}</p>}

      <h3>Photos:</h3>
      {request.photos?.length > 0 ? (
        request.photos.map(photo => (
          <img key={photo._id} src={`${process.env.REACT_APP_API_URL?.replace('/api', '')}${photo.filePath}`} alt={photo.fileName} style={{width: '150px', margin: '5px'}}/>
        ))
      ) : <p>No photos attached.</p>}

      <h3>Updates:</h3>
      {request.updates?.length > 0 ? (
        <ul>
            {request.updates.map((upd, idx) => (
                <li key={idx}>
                    {new Date(upd.timestamp).toLocaleString()} by {upd.updatedBy?.firstName || 'System'}: Status set to {upd.status}. Notes: {upd.notes}
                </li>
            ))}
        </ul>
      ) : <p>No updates yet.</p>}


      {canManage && (
        <div style={{marginTop: '20px', border: '1px solid #ccc', padding: '15px'}}>
          <h3>Manage Request</h3>
          {actionError && <AlertMessage type="error" message={actionError} />}
          {actionSuccess && <AlertMessage type="success" message={actionSuccess} />}
          <form onSubmit={handleStatusUpdate}>
            <div>
              <label>Update Status:</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="submitted">Submitted</option>
                <option value="received">Received</option>
                <option value="in_progress">In Progress</option>
                <option value="assigned">Assigned</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
                <label>Assign To (User ID - optional):</label>
                <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Enter User ID of assignee"/>
            </div>
            <div>
              <label>Notes:</label>
              <textarea value={updateNotes} onChange={(e) => setUpdateNotes(e.target.value)} />
            </div>
            <button type="submit">Update Request</button>
          </form>
        </div>
      )}

      {isTenantOwner && request.status === 'completed' && !request.feedback?.rating && (
         <div style={{marginTop: '20px', border: '1px solid #ccc', padding: '15px'}}>
            <h3>Submit Feedback</h3>
            {actionError && <AlertMessage type="error" message={actionError} />}
            {actionSuccess && <AlertMessage type="success" message={actionSuccess} />}
            <form onSubmit={handleFeedbackSubmit}>
                <div>
                    <label>Rating (1-5):</label>
                    <input type="number" min="1" max="5" value={feedbackRating} onChange={(e) => setFeedbackRating(Number(e.target.value))} required/>
                </div>
                <div>
                    <label>Comments:</label>
                    <textarea value={feedbackComments} onChange={(e) => setFeedbackComments(e.target.value)} />
                </div>
                <button type="submit">Submit Feedback</button>
            </form>
         </div>
      )}
      {isTenantOwner && request.feedback?.rating && (
        <div style={{marginTop: '20px'}}>
            <h4>Your Feedback:</h4>
            <p>Rating: {request.feedback.rating}/5</p>
            <p>Comments: {request.feedback.comments}</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceRequestDetailPage;