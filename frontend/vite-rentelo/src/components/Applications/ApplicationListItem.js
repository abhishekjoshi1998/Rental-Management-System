import React from 'react';
import { Link } from 'react-router-dom';

const ApplicationListItem = ({ application }) => {
  return (
    <div className="card">
      <h4>Application ID: {application._id}</h4>
      <p>Property: {application.property?.address?.street || 'N/A'}</p>
      <p>Applicant: {application.applicant?.firstName} {application.applicant?.lastName}</p>
      <p>Status: <span style={{fontWeight: 'bold'}}>{application.status}</span></p>
      <p>Date: {new Date(application.applicationDate).toLocaleDateString()}</p>
      <Link to={`/applications/${application._id}`}>View Details</Link>
    </div>
  );
};

export default ApplicationListItem;