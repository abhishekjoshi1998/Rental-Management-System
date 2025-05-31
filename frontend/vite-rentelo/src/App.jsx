import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import PrivateRoute from "./components/Common/PrivateRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage"; // Create this
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage"; // Create this

import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";

import PropertiesListPage from "./components/Properties/PropertiesListPage";
import PropertyDetailPage from "./components/Properties/PropertyDetailPage";
// import ManagePropertiesPage from './pages/Properties/ManagePropertiesPage'; // For landlord
// import CreatePropertyPage from './pages/Properties/CreatePropertyPage'; // For landlord

import SubmitApplicationPage from "./components/Applications/SubmitApplicationPage";
import ApplicationsListPage from "./components/Applications/ApplicationsListPage";
import ApplicationDetailPage from "./components/Applications/ApplicationDetailPage";

import MakePaymentPage from "./pages/Payments/MakePaymentPage";
import PaymentHistoryPage from "./pages/Payments/PaymentHistoryPage";
import PaymentSuccessPage from "./pages/Payments/PaymentSuccessPage";

import LeasesListPage from "./components/Leases/LeasesListPage";
import LeaseDetailPage from "./components/Leases/LeaseDetailPage";

import SubmitMaintenancePage from "./pages/Maintenance/SubmitMaintenancePage";
import MaintenanceRequestsListPage from "./pages/Maintenance/MaintenanceRequestsListPage";
import MaintenanceRequestDetailPage from "./pages/Maintenance/MaintenanceRequestDetailPage";

import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

import useAuth from "./hooks/useAuth";
import LoadingSpinner from "./components/Common/LoadingSpinner";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route path="/properties" element={<PropertiesListPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route
            path="/applications/submit"
            element={
              <PrivateRoute allowedRoles={["tenant"]}>
                <SubmitApplicationPage />
              </PrivateRoute>
            }
          />
          <Route path="/applications" element={<ApplicationsListPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />

          <Route
            path="/payments/make"
            element={
              <PrivateRoute allowedRoles={["tenant"]}>
                <MakePaymentPage />
              </PrivateRoute>
            }
          />
          <Route path="/payments/history" element={<PaymentHistoryPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />

          <Route path="/leases" element={<LeasesListPage />} />
          <Route path="/leases/:id" element={<LeaseDetailPage />} />

          <Route
            path="/maintenance/submit"
            element={
              <PrivateRoute allowedRoles={["tenant"]}>
                <SubmitMaintenancePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/maintenance"
            element={<MaintenanceRequestsListPage />}
          />
          <Route
            path="/maintenance/:id"
            element={<MaintenanceRequestDetailPage />}
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
