import React from 'react';
import { Link } from 'react-router-dom';

const MaintenanceRequestListItem = ({ request }) => {
  return (
    <div className="card">
      <h4>Request ID: {request._id}</h4>
      <p>Property: {request.property?.address?.street || 'N/A'}</p>
      <p>Issue: {request.issueDescription.substring(0, 100)}{request.issueDescription.length > 100 ? '...' : ''}</p>
      <p>Category: {request.category}</p>
      <p>Status: <span style={{fontWeight: 'bold'}}>{request.status}</span></p>
      <p>Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
      <Link to={`/maintenance/${request._id}`}>View Details</Link>
    </div>
  );
};

export default MaintenanceRequestListItem;