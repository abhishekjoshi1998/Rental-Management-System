import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import PrivateRoute from './components/Common/PrivateRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage'; // Create this
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage'; // Create this
import SubmitApplicationPage from './pages/Applications/SubmitApplicationPage'; // Create this
import ApplicationsListPage from './pages/Applications/ApplicationsListPage'; // Create this
import MakePaymentPage from './pages/Payments/MakePaymentPage'; // Create this


import useAuth from './hooks/useAuth';
import LoadingSpinner from './components/Common/LoadingSpinner';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <MainLayout><LoadingSpinner /></MainLayout>;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Tenant Routes */}
          <Route path="/applications/submit" element={
            <PrivateRoute allowedRoles={['tenant']}><SubmitApplicationPage /></PrivateRoute> // Example of role specific private route
          } />
           <Route path="/applications" element={
            <PrivateRoute allowedRoles={['tenant', 'landlord', 'property_manager']}><ApplicationsListPage /></PrivateRoute>
          } />
           <Route path="/payments/make" element={
            <PrivateRoute allowedRoles={['tenant']}><MakePaymentPage /></PrivateRoute>
          } />
          {/* Add more routes for Leases, Maintenance etc. */}
        </Route>

        <Route path="*" element={<Navigate to="/" />} /> {/* Or a NotFoundPage */}
      </Routes>
    </MainLayout>
  );
}

export default App;