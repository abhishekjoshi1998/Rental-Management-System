// src/pages/DashboardPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AlertMessage from '../components/Common/AlertMessage'; // For potential messages

const DashboardPage = () => {
  const { user } = useAuth();

  if (!user) {
    // This case should ideally be handled by PrivateRoute, but as a fallback:
    return <AlertMessage type="error" message="You are not logged in. Redirecting..." />;
    // Or navigate('/login'); if you import useNavigate
  }

  return (
    <div className="dashboard-container">
      <h2 style={{ marginBottom: '20px' }}>Dashboard</h2>
      <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>
        Welcome back, <strong>{user.firstName} {user.lastName}</strong>!
      </p>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3>Account</h3>
          <ul>
            <li><Link to="/profile">View/Edit Profile</Link></li>
            {/* Add link to change password if you implement that feature */}
          </ul>
        </div>

        {user.role === 'tenant' && (
          <div className="dashboard-section">
            <h3>Tenant Portal</h3>
            <ul>
              <li><Link to="/properties">View Available Properties</Link></li>
              <li><Link to="/applications/submit">Submit New Application</Link></li>
              <li><Link to="/applications">My Submitted Applications</Link></li>
              <li><Link to="/leases">My Leases</Link></li>
              <li><Link to="/payments/make">Make a Payment</Link></li>
              <li><Link to="/payments/history">Payment History</Link></li>
              <li><Link to="/maintenance/submit">Submit Maintenance Request</Link></li>
              <li><Link to="/maintenance">My Maintenance Requests</Link></li>
            </ul>
          </div>
        )}

        {(user.role === 'landlord' || user.role === 'property_manager') && (
          <div className="dashboard-section">
            <h3>Property Management</h3>
            <ul>
              <li><Link to="/manage-properties">Manage My Properties</Link></li>
              <li><Link to="/manage-properties/create">Add New Property</Link></li>
              <li><Link to="/applications">View Tenant Applications</Link></li>
              <li><Link to="/leases">Manage Leases</Link></li>
              <li><Link to="/leases/create">Create New Lease</Link></li>
              <li><Link to="/payments/history">View All Payments</Link></li>
              {/* Add manual payment recording link if desired */}
              <li><Link to="/maintenance">View Maintenance Requests</Link></li>
            </ul>
          </div>
        )}

        {user.role === 'admin' && (
          <div className="dashboard-section">
            <h3>Admin Panel</h3>
            <ul>
              <li><Link to="/admin/users">Manage Users</Link></li>
              <li><Link to="/admin/properties">Manage All Properties</Link></li>
              <li><Link to="/admin/settings">System Settings</Link></li>
              {/* More admin-specific links */}
            </ul>
          </div>
        )}
      </div>
      <style jsx>{`
        .dashboard-container {
          padding: 20px;
        }
        .dashboard-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .dashboard-section {
          border: 1px solid #e0e0e0;
          padding: 15px;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        .dashboard-section h3 {
          margin-top: 0;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .dashboard-section ul {
          list-style: none;
          padding: 0;
        }
        .dashboard-section ul li {
          margin-bottom: 8px;
        }
        .dashboard-section ul li a {
          text-decoration: none;
          color: #007bff;
        }
        .dashboard-section ul li a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;