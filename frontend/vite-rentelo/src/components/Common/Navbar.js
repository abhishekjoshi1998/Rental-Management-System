import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav>
      <div className="nav-brand">
        <Link to="/">Rental Management</Link>
      </div>
      <div className="nav-links-main">
        <Link to="/properties">Properties</Link>
        {isAuthenticated && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            {user?.role === 'tenant' && (
                <>
                    <Link to="/applications">My Applications</Link>
                    <Link to="/payments/history">Payment History</Link>
                    <Link to="/maintenance">My Maintenance</Link>
                </>
            )}
            {(user?.role === 'landlord' || user?.role === 'property_manager') && (
                <>
                    <Link to="/manage-properties">Manage Properties</Link>
                    <Link to="/applications">View Applications</Link>
                    <Link to="/leases">Manage Leases</Link>
                    <Link to="/maintenance">View Maintenance</Link>
                    <Link to="/payments/history">All Payments</Link>
                </>
            )}
             {user?.role === 'admin' && (
                <>
                    {/* Admin specific links here */}
                </>
            )}
          </>
        )}
      </div>
      <div className="auth-links">
        {isAuthenticated ? (
          <>
            <Link to="/profile" style={{marginRight: '10px'}}>
                Hi, {user?.firstName || user?.email}!
            </Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;