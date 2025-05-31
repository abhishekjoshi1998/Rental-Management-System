import React, { useState, useEffect } from "react";
import { getProperties } from "../../api/propertyService";
import PropertyListItem from "../../components/Properties/PropertyListItem";
import LoadingSpinner from "../Common/LoadingSpinner";
import AlertMessage from "../../components/Common/AlertMessage";

const PropertiesListPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await getProperties({ isAvailable: true }); // Fetch only available
        setProperties(response.data.properties || response.data);
      } catch (err) {
        setError("Failed to fetch properties.");
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error} />;

  return (
    <div>
      <h2>Available Properties for Rent</h2>
      {properties.length === 0 ? (
        <p>No properties currently available.</p>
      ) : (
        <div className="properties-grid">
          {properties.map((prop) => (
            <PropertyListItem key={prop._id} property={prop} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertiesListPage;
