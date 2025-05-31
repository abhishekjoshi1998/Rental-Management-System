import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getApplicationDetails,
  updateApplicationStatus,
  initiateBackgroundCheckForApp,
} from "../../api/applicationService";
import useAuth from "../hooks/useAuth";
import LoadingSpinner from "../Common/LoadingSpinner";
import AlertMessage from "../Common/AlertMessage";

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");

  const fetchApplication = async () => {
    try {
      const response = await getApplicationDetails(id);
      setApplication(response.data);
      setNewStatus(response.data.status);
    } catch (err) {
      setError("Failed to fetch application details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchApplication();
    }
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");
    if (!newStatus) {
      setActionError("Please select a status.");
      return;
    }
    try {
      await updateApplicationStatus(id, { status: newStatus, notes });
      setActionSuccess("Application status updated successfully!");
      fetchApplication();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to update status.");
    }
  };

  const handleBackgroundCheck = async () => {
    setActionError("");
    setActionSuccess("");
    try {
      await initiateBackgroundCheckForApp(id);
      setActionSuccess(
        "Background check initiated! Status may take time to update."
      );
      fetchApplication();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to initiate background check."
      );
    }
  };

  const canManage =
    user?.role === "landlord" ||
    user?.role === "property_manager" ||
    user?.role === "admin";

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error} />;
  if (!application)
    return <AlertMessage type="error" message="Application not found." />;

  return (
    <div>
      <h2>Application Details - ID: {application._id}</h2>
      <p>
        <strong>Applicant:</strong> {application.applicant?.firstName}{" "}
        {application.applicant?.lastName} ({application.applicant?.email})
      </p>
      <p>
        <strong>Property:</strong> {application.property?.address?.street}
      </p>
      <p>
        <strong>Submitted:</strong>{" "}
        {new Date(application.applicationDate).toLocaleString()}
      </p>
      <p>
        <strong>Current Status:</strong> {application.status}
      </p>
      <p>
        <strong>Background Check:</strong>{" "}
        {application.backgroundCheckStatus || "Not Started"}
      </p>
      {application.creditCheckScore && (
        <p>
          <strong>Credit Score:</strong> {application.creditCheckScore}
        </p>
      )}

      <h3>Personal Info:</h3>
      <p>Full Name: {application.personalInfo?.fullName}</p>
      <p>Email: {application.personalInfo?.email}</p>
      <p>Phone: {application.personalInfo?.phone}</p>
      {canManage && application.personalInfo?.ssn && (
        <p>SSN: {application.personalInfo.ssn} </p>
      )}

      <h3>Documents:</h3>
      {application.documents?.length > 0 ? (
        <ul>
          {application.documents.map((doc) => (
            <li key={doc._id}>
              <a
                href={`${process.env.REACT_APP_API_URL?.replace("/api", "")}${
                  doc.filePath
                }`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {doc.fileName} ({doc.documentType})
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No documents uploaded.</p>
      )}

      {canManage && (
        <div
          style={{
            marginTop: "20px",
            border: "1px solid #ccc",
            padding: "15px",
          }}
        >
          <h3>Manage Application</h3>
          {actionError && <AlertMessage type="error" message={actionError} />}
          {actionSuccess && (
            <AlertMessage type="success" message={actionSuccess} />
          )}
          <form onSubmit={handleStatusUpdate}>
            <div>
              <label>Update Status:</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="waitlisted">Waitlisted</option>
              </select>
            </div>
            <div>
              <label>Notes (Optional):</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <button type="submit">Update Status</button>
          </form>
          <button onClick={handleBackgroundCheck} style={{ marginTop: "10px" }}>
            Initiate Background Check
          </button>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetailPage;
