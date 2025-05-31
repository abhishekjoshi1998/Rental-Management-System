import React, { useState } from 'react';
import { submitNewMaintenanceRequest } from '../../api/maintenanceService';
import AlertMessage from '../Common/AlertMessage';

const MaintenanceRequestForm = ({ propertyId, leaseId }) => {
  const [formData, setFormData] = useState({
    issueDescription: '',
    category: 'other',
    urgency: 'medium',
    preferredAvailability: '',
  });
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPhotos(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const submissionData = new FormData();
    submissionData.append('propertyId', propertyId);
    if (leaseId) submissionData.append('leaseId', leaseId);
    submissionData.append('issueDescription', formData.issueDescription);
    submissionData.append('category', formData.category);
    submissionData.append('urgency', formData.urgency);
    submissionData.append('preferredAvailability', formData.preferredAvailability);

    photos.forEach(photo => {
      submissionData.append('photos', photo);
    });

    try {
      await submitNewMaintenanceRequest(submissionData);
      setSuccess('Maintenance request submitted successfully!');
      setFormData({ issueDescription: '', category: 'other', urgency: 'medium', preferredAvailability: '' });
      setPhotos([]);
      document.getElementById('maintenance-photos-input').value = null; // Reset file input
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Submit Maintenance Request</h3>
      {error && <AlertMessage type="error" message={error} />}
      {success && <AlertMessage type="success" message={success} />}
      <div>
        <label>Issue Description:</label>
        <textarea name="issueDescription" value={formData.issueDescription} onChange={handleChange} required />
      </div>
      <div>
        <label>Category:</label>
        <select name="category" value={formData.category} onChange={handleChange}>
          <option value="plumbing">Plumbing</option>
          <option value="electrical">Electrical</option>
          <option value="hvac">HVAC</option>
          <option value="appliance">Appliance</option>
          <option value="structural">Structural</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label>Urgency:</label>
        <select name="urgency" value={formData.urgency} onChange={handleChange}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>
      <div>
        <label>Preferred Availability (Optional):</label>
        <input type="text" name="preferredAvailability" value={formData.preferredAvailability} onChange={handleChange} />
      </div>
      <div>
        <label>Attach Photos (Optional):</label>
        <input type="file" id="maintenance-photos-input" name="photos" onChange={handleFileChange} multiple accept="image/*" />
      </div>
      <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</button>
    </form>
  );
};

export default MaintenanceRequestForm;