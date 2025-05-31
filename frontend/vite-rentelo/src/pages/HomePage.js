// src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Optional: to customize view based on auth state

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <h1>Welcome to the Rental Management System</h1>
      <p style={{ fontSize: '1.2em', margin: '20px 0' }}>
        Your one-stop solution for finding rental properties and managing your tenancies or property listings.
      </p>

      <div style={{ marginTop: '30px' }}>
        <Link
          to="/properties"
          style={{
            padding: '10px 20px',
            margin: '0 10px',
            fontSize: '1em',
            textDecoration: 'none',
            color: 'white',
            backgroundColor: '#007bff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          View Available Properties
        </Link>

        {!isAuthenticated && (
          <Link
            to="/register"
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              fontSize: '1em',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: '#28a745',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Register Now
          </Link>
        )}

        {isAuthenticated && (
            <Link
                to="/dashboard"
                style={{
                padding: '10px 20px',
                margin: '0 10px',
                fontSize: '1em',
                textDecoration: 'none',
                color: 'white',
                backgroundColor: '#17a2b8',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                }}
            >
                Go to Dashboard
            </Link>
        )}
      </div>

      {isAuthenticated && user && (
        <p style={{ marginTop: '40px', fontSize: '0.9em', color: '#555' }}>
          Logged in as: {user.firstName} {user.lastName} ({user.email})
        </p>
      )}
    </div>
  );
};

export default HomePage;