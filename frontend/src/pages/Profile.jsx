import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { api } from "../api";

// --- CONFIGURATION ---
const API_BASE_URL = 'http://localhost:8000'; 
const DEFAULT_AVATAR = "https://testingbot.com/free-online-tools/random-avatar/1"; // Hardcoded image for now
// ---------------------

// --- API Helper Function ---
const getAuthToken = () => localStorage.getItem('authToken');

const base_api = axios.create({ baseURL: API_BASE_URL });
base_api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// ---------------------------------------------------------


export default function Profile() {
  const navigate = useNavigate();
  // State for the authenticated user's data (read-only state)
  const [user, setUser] = useState(null); 
  // State for the editable form data
  const [editData, setEditData] = useState(null); 
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleViewFavorites = () => {
    navigate('/saved');
  };


  // 1. DATA FETCHING (Runs on component mount)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await base_api.get('/users/me');
        const reviewCountRes = await base_api.get('/users/me/reviews/count');
        const favoritesCountRes = await api.getUsersFavoritesList();

        const userData = response.data;
        const reviewCount = reviewCountRes.data.reviewCount;
        const favoritesCount =  favoritesCountRes.favorite_ids ? favoritesCountRes.favorite_ids.length : 0;

        const formatDate = (isoString) => {
            if (!isoString) {
                return "N/A";
            }
            try {
                // "2025-11-28T18:00:06..." -> "2025-11-28"
                return isoString.substring(0, 10);
            } catch (e) {
                console.error("String slicing failed:", e);
                return "Unknown Date";
            }
        };
        
        // Map backend fields to frontend state fields
        const mappedUser = {
          id: userData.user_id,
          name: userData.name || "User Name", // Use name if available
          email: userData.email,
          tagline: userData.tagline || "No tagline yet.", 
          location: userData.location || "Unknown",
          // The joined date isn't easily accessible/editable here, use a placeholder
          joinedDate: formatDate(userData.joined_date) || "Unknown", 
          avatar: userData.image_url || DEFAULT_AVATAR, // Image_URL -> Avatar
          // Placeholder stats - link these to real counts later
          reviewCount: reviewCount || 0, 
          favoritesCount: favoritesCount || 0,
        };

        setUser(mappedUser);
        setEditData(mappedUser); // Initialize form data
      } catch (err) {
        console.error("Profile Fetch Error:", err);
        setError("Failed to load profile data.");
        // Redirect if unauthorized
        if (err.response && err.response.status === 401) {
             navigate('/login'); 
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]); 


  // 2. HANDLERS
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleCancel = () => {
    // Reset form data to the last saved user state
    setEditData({ ...user }); 
    setIsEditing(false);
    setError(null);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    // Payload mapping frontend state to backend model (UserUpdateSchema)
    const payload = {
      name: editData.name,
      email: editData.email,
      tagline: editData.tagline, 
      location: editData.location,
      image_url: editData.avatar, 
    };
    
    try {
      const response = await base_api.put('/users/me', payload);
      
      
      const updatedUser = {
          ...editData, 
          email: response.data.email, 
      };
      
      setUser(updatedUser);
      setEditData(updatedUser);
      setIsEditing(false);
      
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to save profile changes.";
      setError(detail);
      console.error("Save Error:", err);
    } finally {
      setIsSaving(false);
    }
  };


  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error && !user) return <div className="profile-error">Error: {error}</div>;
  if (!user) return <div className="profile-error">Please log in.</div>; 

  return (
    <div className="profile-container">
      <button 
          className="back-button"
          onClick={handleGoBack}
      >
          ← Go Back
      </button>
      {error && <div className="error-message-bar">{error}</div>}

      <div className="profile-header">
    
        <img 
          src={isEditing ? editData.avatar : user.avatar} 
          alt={user.name} 
          className="profile-avatar" 
        />
        <div className="profile-header-info">
          <h1 className="profile-name">{isEditing ? editData.name : user.name}</h1>
          <p className="profile-email">{isEditing ? editData.email : user.email}</p>
          <p className="profile-location">📍 {isEditing ? editData.location : user.location}</p>
        </div>
        <button
          className="edit-button"
          onClick={() => setIsEditing(!isEditing)}
          disabled={isSaving}
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* Tagline Section */}
      <div className="profile-bio-section">
        {isEditing ? (
          <textarea
            name="bio"
            value={editData.tagline}
            onChange={handleEditChange}
            className="edit-textarea"
            placeholder="Enter your tagline"
          />
        ) : (
          <p className="profile-bio">{user.tagline}</p>
        )}
      </div>


      <div className="profile-stats">
        <div className="stat-card">
          <p className="stat-number">{user.reviewCount}</p>
          <p className="stat-label">Reviews</p>
        </div>

               
        <div className="stat-card" onClick={handleViewFavorites} style={{ cursor: 'pointer' }}>
          <p className="stat-number">{user.favoritesCount}</p>
          <p className="stat-label">Favorites</p>
        </div>

      </div>

      {/* Editable Fields Section */}
      {isEditing && (
        <div className="edit-section">
            
          {/* Avatar URL Edit Field */}
          <div className="form-group">
            <label htmlFor="avatar">Avatar URL</label>
            <input
              id="avatar"
              type="url"
              name="avatar"
              value={editData.avatar}
              onChange={handleEditChange}
              className="edit-input"
            />
          </div>
          {/* End Avatar URL Edit Field */}
            
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
              className="edit-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={editData.email}
              onChange={handleEditChange}
              className="edit-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              name="location"
              value={editData.location}
              onChange={handleEditChange}
              className="edit-input"
            />
          </div>
                    
          <div className="edit-actions">
            <button 
                className="save-button" 
                onClick={handleSave} 
                disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Additional Info (Read-Only) */}
      {!isEditing && (
        <div className="profile-details">
          <div className="detail-item">
            <span className="detail-label">Joined:</span>
            <span className="detail-value">{user.joinedDate}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{user.email}</span>
          </div>
        </div>
      )}
    
    </div>
  );
}