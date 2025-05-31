
import React, { useState, useEffect } from 'react';
import { submitNewApplication } from '../../api/applicationService';
import AlertMessage from '../Common/AlertMessage.jsx'; 
import useAuth from '../hooks/useAuth.js';

const ApplicationForm = ({ propertyId, propertyAddress }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    personalInfo: {
      fullName: user ? `${user.firstName} ${user.lastName}` : '',
      email: user ? user.email : '',
      phone: user ? user.phone || '' : '',
    },
    currentAddress: { street: '', city: '', state: '', zipCode: '', duration: '', reasonForLeaving: '' },
    employmentHistory: [{ employer: '', position: '', startDate: '', endDate: '', supervisorName: '', supervisorPhone: '', monthlyIncome: '' }],
    references: [{ name: '', relationship: '', phone: '', email: '' }],
  });

  const [files, setFiles] = useState({
    identification_doc: null, // For ID
    income_proof_doc: null,   // For proof of income
    reference_letter_doc: null, // For reference letters
    other_doc: null,          // For any other documents
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill from user profile if user exists
    if (user) {
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email || '',
          phone: user.phone || '',
        }
      }));
    }
  }, [user]);


  const handleChange = (e, section, index, field) => {
    const { name, value } = e.target;
    if (section) {
      if (index !== undefined) {
        const list = [...formData[section]];
        list[index] = { ...list[index], [field || name]: value };
        setFormData(prev => ({ ...prev, [section]: list }));
      } else {
        setFormData(prev => ({
          ...prev,
          [section]: { ...prev[section], [name || field]: value }
        }));
      }
    } else {
       // Should not happen if sections are always used for structured data
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    // For single file input by name
    setFiles(prev => ({ ...prev, [e.target.name]: e.target.files[0] }));
    // If you had a multi-file input for 'other_docs', you'd handle e.target.files (an array)
  };

  const addEmploymentEntry = () => {
    setFormData(prev => ({
      ...prev,
      employmentHistory: [...prev.employmentHistory, { employer: '', position: '', startDate: '', endDate: '', supervisorName: '', supervisorPhone: '', monthlyIncome: '' }]
    }));
  };
  const removeEmploymentEntry = (index) => {
    setFormData(prev => ({
      ...prev,
      employmentHistory: prev.employmentHistory.filter((_, i) => i !== index)
    }));
  };

  const addReferenceEntry = () => {
    setFormData(prev => ({
      ...prev,
      references: [...prev.references, { name: '', relationship: '', phone: '', email: '' }]
    }));
  };
  const removeReferenceEntry = (index) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const submissionData = new FormData();
    submissionData.append('propertyId', propertyId);

    // Append structured data as JSON strings
    submissionData.append('personalInfo', JSON.stringify(formData.personalInfo));
    submissionData.append('currentAddress', JSON.stringify(formData.currentAddress));
    submissionData.append('employmentHistory', JSON.stringify(formData.employmentHistory.filter(emp => emp.employer))); // Filter out empty entries
    submissionData.append('references', JSON.stringify(formData.references.filter(ref => ref.name))); // Filter out empty entries

    // Append files
    if (files.identification_doc) submissionData.append('identification_doc', files.identification_doc);
    if (files.income_proof_doc) submissionData.append('income_proof_doc', files.income_proof_doc);
    if (files.reference_letter_doc) submissionData.append('reference_letter_doc', files.reference_letter_doc);
    if (files.other_doc) submissionData.append('other_doc', files.other_doc);


    try {
      await submitNewApplication(submissionData);
      setSuccess('Application submitted successfully! The property manager will review it shortly.');
      // Optionally reset form or navigate
      // setFormData({ personalInfo: { ... }, ...}); // Reset logic
      // setFiles({ identification_doc: null, ... });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application. Please check your entries.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      <h3>Apply for: {propertyAddress || `Property ID: ${propertyId}`}</h3>
      {error && <AlertMessage type="error" message={error} />}
      {success && <AlertMessage type="success" message={success} />}

      <h4>Personal Information</h4>
      <div>
        <label>Full Name:</label>
        <input type="text" name="fullName" value={formData.personalInfo.fullName} onChange={(e) => handleChange(e, 'personalInfo')} required />
      </div>
      <div>
        <label>Email:</label>
        <input type="email" name="email" value={formData.personalInfo.email} onChange={(e) => handleChange(e, 'personalInfo')} required />
      </div>
      <div>
        <label>Phone:</label>
        <input type="tel" name="phone" value={formData.personalInfo.phone} onChange={(e) => handleChange(e, 'personalInfo')} required />
      </div>
      {/* Add SSN, DOB inputs if required by backend, ensure encryption */}

      <h4>Current Address</h4>
      <div>
        <label>Street:</label>
        <input type="text" name="street" value={formData.currentAddress.street} onChange={(e) => handleChange(e, 'currentAddress')} />
      </div>
      <div>
        <label>City:</label>
        <input type="text" name="city" value={formData.currentAddress.city} onChange={(e) => handleChange(e, 'currentAddress')} />
      </div>
      <div>
        <label>State:</label>
        <input type="text" name="state" value={formData.currentAddress.state} onChange={(e) => handleChange(e, 'currentAddress')} />
      </div>
      <div>
        <label>Zip Code:</label>
        <input type="text" name="zipCode" value={formData.currentAddress.zipCode} onChange={(e) => handleChange(e, 'currentAddress')} />
      </div>
      <div>
        <label>Duration at Address:</label>
        <input type="text" name="duration" value={formData.currentAddress.duration} onChange={(e) => handleChange(e, 'currentAddress')} />
      </div>
      <div>
        <label>Reason for Leaving:</label>
        <textarea name="reasonForLeaving" value={formData.currentAddress.reasonForLeaving} onChange={(e) => handleChange(e, 'currentAddress')} />
      </div>


      <h4>Employment History</h4>
      {formData.employmentHistory.map((entry, index) => (
        <div key={index} style={{border: '1px dashed #ccc', padding: '10px', marginBottom: '10px'}}>
          <h5>Employment #{index + 1}</h5>
          <div><label>Employer:</label><input type="text" value={entry.employer} onChange={(e) => handleChange(e, 'employmentHistory', index, 'employer')} /></div>
          <div><label>Position:</label><input type="text" value={entry.position} onChange={(e) => handleChange(e, 'employmentHistory', index, 'position')} /></div>
          <div><label>Monthly Income ($):</label><input type="number" value={entry.monthlyIncome} onChange={(e) => handleChange(e, 'employmentHistory', index, 'monthlyIncome')} /></div>
          <div><label>Start Date:</label><input type="date" value={entry.startDate} onChange={(e) => handleChange(e, 'employmentHistory', index, 'startDate')} /></div>
          <div><label>End Date (if applicable):</label><input type="date" value={entry.endDate} onChange={(e) => handleChange(e, 'employmentHistory', index, 'endDate')} /></div>
          {formData.employmentHistory.length > 1 && <button type="button" onClick={() => removeEmploymentEntry(index)} style={{background: '#dc3545'}}>Remove</button>}
        </div>
      ))}
      <button type="button" onClick={addEmploymentEntry}>+ Add Employment</button>

      <h4>References</h4>
      {formData.references.map((entry, index) => (
        <div key={index} style={{border: '1px dashed #ccc', padding: '10px', marginBottom: '10px'}}>
          <h5>Reference #{index + 1}</h5>
          <div><label>Name:</label><input type="text" value={entry.name} onChange={(e) => handleChange(e, 'references', index, 'name')} /></div>
          <div><label>Relationship:</label><input type="text" value={entry.relationship} onChange={(e) => handleChange(e, 'references', index, 'relationship')} /></div>
          <div><label>Phone:</label><input type="tel" value={entry.phone} onChange={(e) => handleChange(e, 'references', index, 'phone')} /></div>
          <div><label>Email:</label><input type="email" value={entry.email} onChange={(e) => handleChange(e, 'references', index, 'email')} /></div>
           {formData.references.length > 1 && <button type="button" onClick={() => removeReferenceEntry(index)} style={{background: '#dc3545'}}>Remove</button>}
        </div>
      ))}
      <button type="button" onClick={addReferenceEntry}>+ Add Reference</button>

      <h4 style={{marginTop: '20px'}}>Upload Documents</h4>
      <div>
        <label>Identification (ID/Driver's License/Passport):</label>
        <input type="file" name="identification_doc" onChange={handleFileChange} />
      </div>
      <div>
        <label>Proof of Income (Recent Payslips/Bank Statements):</label>
        <input type="file" name="income_proof_doc" onChange={handleFileChange} />
      </div>
      <div>
        <label>Reference Letter (Optional):</label>
        <input type="file" name="reference_letter_doc" onChange={handleFileChange} />
      </div>
      <div>
        <label>Other Supporting Document (Optional):</label>
        <input type="file" name="other_doc" onChange={handleFileChange} />
      </div>

      <p style={{fontSize: '0.9em', color: '#555', marginTop: '15px'}}>
        By submitting this application, I affirm that all information provided is true and accurate to the best of my knowledge.
        I authorize the landlord/property manager to verify all information provided, including performing background and credit checks as necessary.
      </p>

      <button type="submit" disabled={loading} style={{marginTop: '20px'}}>{loading ? 'Submitting Application...' : 'Submit Application'}</button>
    </form>
  );
};

export default ApplicationForm;