import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPropertyById } from "../../api/propertyService";
import LoadingSpinner from "../Common/LoadingSpinner";
import AlertMessage from "../Common/AlertMessage";

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await getPropertyById(id);
        setProperty(response.data);
      } catch (err) {
        setError("Failed to fetch property details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchProperty();
    }
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertMessage type="error" message={error} />;
  if (!property)
    return <AlertMessage type="error" message="Property not found." />;

  const primaryImage =
    property.photos?.find((p) => p.isPrimary)?.filePath ||
    property.photos?.[0]?.filePath;
  const imageUrl = primaryImage
    ? `${process.env.REACT_APP_API_URL?.replace("/api", "")}${primaryImage}`
    : "https://via.placeholder.com/600x400?text=No+Image";

  return (
    <div className="property-detail">
      <h2>
        {property.address.street}, {property.address.city},{" "}
        {property.address.state}
      </h2>
      <img
        src={imageUrl}
        alt="Property"
        style={{ maxWidth: "600px", width: "100%", marginBottom: "20px" }}
      />

      <p>
        <strong>Rent:</strong> ${property.rentAmount} / month
      </p>
      <p>
        <strong>Type:</strong> {property.type}
      </p>
      <p>
        <strong>Bedrooms:</strong> {property.bedrooms}
      </p>
      <p>
        <strong>Bathrooms:</strong> {property.bathrooms}
      </p>
      {property.squareFootage && (
        <p>
          <strong>Sq. Footage:</strong> {property.squareFootage} sq ft
        </p>
      )}
      <p>
        <strong>Description:</strong> {property.description || "N/A"}
      </p>
      {property.amenities && property.amenities.length > 0 && (
        <p>
          <strong>Amenities:</strong> {property.amenities.join(", ")}
        </p>
      )}
      {property.availableDate && (
        <p>
          <strong>Available From:</strong>{" "}
          {new Date(property.availableDate).toLocaleDateString()}
        </p>
      )}

      <Link
        to={`/applications/submit?propertyId=${property._id}`}
        className="button-link"
      >
        Apply Now
      </Link>

      {property.photos && property.photos.length > 1 && (
        <div>
          <h3>More Photos</h3>
          {property.photos.map((photo, index) => (
            <img
              key={index}
              src={`${process.env.REACT_APP_API_URL?.replace("/api", "")}${
                photo.filePath
              }`}
              alt={`Property view ${index + 1}`}
              style={{
                width: "150px",
                height: "100px",
                objectFit: "cover",
                margin: "5px",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyDetailPage;
