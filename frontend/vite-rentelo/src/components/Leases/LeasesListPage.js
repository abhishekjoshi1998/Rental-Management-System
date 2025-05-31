import React, { useState, useEffect } from "react";
import { getLeases } from "../../api/leaseService";
import useAuth from "../../hooks/useAuth";
import LeaseListItem from "./LeaseListItem";
import LoadingSpinner from "../Common/LoadingSpinner";
import AlertMessage from "../../components/Common/AlertMessage";
import { Link } from "react-router-dom";

const LeasesListPage = () => {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        const response = await getLeases();
        setLeases(response.data.leases || response.data);
      } catch (err) {
        setError("Failed to fetch leases.");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchLeases();
    else {
      setLoading(false);
      setError("Not authenticated");
    }
  }, [user]);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error} />;

  return (
    <div>
      <h2>My Leases</h2>
      {(user?.role === "landlord" || user?.role === "property_manager") && (
        <Link to="/leases/create" className="button-like">
          Create New Lease
        </Link>
      )}
      {leases.length === 0 ? (
        <p>No leases found.</p>
      ) : (
        leases.map((lease) => <LeaseListItem key={lease._id} lease={lease} />)
      )}
    </div>
  );
};

export default LeasesListPage;
