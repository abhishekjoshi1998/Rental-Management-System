import React from 'react';
import ApplicationForm from '../../components/Applications/ApplicationForm';
import { useLocation, Navigate } from 'react-router-dom';

const SubmitApplicationPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const propertyId = queryParams.get('propertyId') || location.state?.propertyId;

  if (!propertyId) {
    return <Navigate to="/properties" state={{ message: "Please select a property to apply for." }} />;
  }

  return (
    <div>
      <h2>Submit Rental Application</h2>
      <ApplicationForm propertyId={propertyId} />
    </div>
  );
};

export default SubmitApplicationPage;