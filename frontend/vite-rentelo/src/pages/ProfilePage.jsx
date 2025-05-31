// src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import useAuth from '../components/hooks/useAuth';
import { getProfile, updateUserProfile } from '../api/authService';
import AlertMessage from '../components/Common/AlertMessage';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const ProfilePage = () => {
  const { user, token, setUser: setAuthUser, verifyAndSetUser } = useAuth();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
    }
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const apiBaseUrl = process.env.REACT_APP_API_URL?.replace('/api', '');

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && token) {
        setLoading(true);
        try {
          const response = await getProfile();
          const fetchedUser = response.data;
          setProfileData({
            firstName: fetchedUser.firstName || '',
            lastName: fetchedUser.lastName || '',
            email: fetchedUser.email || '',
            phone: fetchedUser.phone || '',
            address: {
                street: fetchedUser.address?.street || '',
                city: fetchedUser.address?.city || '',
                state: fetchedUser.address?.state || '',
                zipCode: fetchedUser.address?.zipCode || '',
            }
          });
          if (fetchedUser.profilePicture) {
            setPreviewImage(apiBaseUrl + fetchedUser.profilePicture);
          }
        } catch (err) {
          setError('Failed to load profile. Please try refreshing.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, token, apiBaseUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
        const addressField = name.split(".")[1];
        setProfileData(prev => ({
            ...prev,
            address: { ...prev.address, [addressField]: value }
        }));
    } else {
        setProfileData({ ...profileData, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setProfilePictureFile(null);
      // Revert to original picture if file selection is cancelled
      if (user && user.profilePicture) {
        setPreviewImage(apiBaseUrl + user.profilePicture);
      } else {
        setPreviewImage('');
      }
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);

    const formData = new FormData();
    formData.append('firstName', profileData.firstName);
    formData.append('lastName', profileData.lastName);
    formData.append('phone', profileData.phone);
    // Backend might not allow email update or have specific logic for it
    // formData.append('email', profileData.email);
    if (profileData.address) {
        formData.append('address', JSON.stringify(profileData.address));
    }


    if (profilePictureFile) {
      formData.append('profilePicture', profilePictureFile);
    }

    try {
      const response = await updateUserProfile(formData);
      setSuccess('Profile updated successfully!');
      // Update user in AuthContext and localStorage
      await verifyAndSetUser(token); // This will re-fetch and set the user

      if (response.data.profilePicture) {
        setPreviewImage(apiBaseUrl + response.data.profilePicture);
      }
      setProfilePictureFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (!currentPassword || !newPassword) {
        setPasswordError('All password fields are required.');
        return;
    }

    setPasswordUpdating(true);
    try {
      setPasswordSuccess('Password change functionality not yet implemented in backend.');
     
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordUpdating(false);
    }
  };


  if (loading && !user) return <LoadingSpinner />; // Show spinner only if user data isn't even partially loaded

  return (
    <div className="profile-page-container">
      <h2>My Profile</h2>
      {error && <AlertMessage type="error" message={error} />}
      {success && <AlertMessage type="success" message={success} />}

      <form onSubmit={handleProfileSubmit} className="profile-form">
        <h3>Update Information</h3>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <img
            src={previewImage || 'https://via.placeholder.com/150?text=No+Image'}
            alt="Profile Preview"
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
          />
        </div>
        <div>
          <label htmlFor="profilePictureFile">Change Profile Picture:</label>
          <input type="file" id="profilePictureFile" name="profilePictureFile" onChange={handleFileChange} accept="image/*" />
        </div>
        <div>
          <label htmlFor="firstName">First Name:</label>
          <input type="text" name="firstName" value={profileData.firstName} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="lastName">Last Name:</label>
          <input type="text" name="lastName" value={profileData.lastName} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" name="email" value={profileData.email} readOnly disabled title="Email cannot be changed." />
        </div>
        <div>
          <label htmlFor="phone">Phone:</label>
          <input type="tel" name="phone" value={profileData.phone} onChange={handleChange} />
        </div>

        <h4>Address</h4>
        <div>
            <label htmlFor="address.street">Street:</label>
            <input type="text" name="address.street" value={profileData.address.street} onChange={handleChange} />
        </div>
        <div>
            <label htmlFor="address.city">City:</label>
            <input type="text" name="address.city" value={profileData.address.city} onChange={handleChange} />
        </div>
        <div>
            <label htmlFor="address.state">State:</label>
            <input type="text" name="address.state" value={profileData.address.state} onChange={handleChange} />
        </div>
        <div>
            <label htmlFor="address.zipCode">Zip Code:</label>
            <input type="text" name="address.zipCode" value={profileData.address.zipCode} onChange={handleChange} />
        </div>


        <button type="submit" disabled={updating}>
          {updating ? 'Updating Profile...' : 'Save Profile Changes'}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="password-form" style={{marginTop: '30px'}}>
        <h3>Change Password</h3>
        {passwordError && <AlertMessage type="error" message={passwordError} />}
        {passwordSuccess && <AlertMessage type="success" message={passwordSuccess} />}
        <div>
          <label htmlFor="currentPassword">Current Password:</label>
          <input type="password" name="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label htmlFor="newPassword">New Password:</label>
          <input type="password" name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
          <label htmlFor="confirmNewPassword">Confirm New Password:</label>
          <input type="password" name="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={passwordUpdating}>
          {passwordUpdating ? 'Updating Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;