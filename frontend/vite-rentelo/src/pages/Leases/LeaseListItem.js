import React from 'react';
import { Link } from 'react-router-dom';

const LeaseListItem = ({ lease }) => {
  return (
    <div className="card">
      <h4>Lease for: {lease.property?.address?.street || 'N/A'}</h4>
      <p>Tenant(s): {lease.tenants?.map(t => `${t.firstName} ${t.lastName}`).join(', ') || 'N/A'}</p>
      <p>Start Date: {new Date(lease.startDate).toLocaleDateString()}</p>
      <p>End Date: {new Date(lease.endDate).toLocaleDateString()}</p>
      <p>Rent: ${lease.rentAmount}</p>
      <p>Status: {lease.isActive ? 'Active' : 'Inactive'}</p>
      <Link to={`/leases/${lease._id}`}>View Details</Link>
    </div>
  );
};

export default LeaseListItem;