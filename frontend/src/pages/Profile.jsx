import React, { useState } from "react";
import "./Profile.css";

export default function Profile() {
  // Mock user data - replace with actual data from API/context
  const [user, setUser] = useState({
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    bio: "Food enthusiast. Always looking for the next great dining experience!",
    location: "Brooklyn, NY",
    joinedDate: "November, 2025",
    avatar: "https://via.placeholder.com/150?text=JD",
    reviewCount: 24,
    followersCount: 156,
    followingCount: 89,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...user });

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleSave = () => {
    setUser(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ ...user });
    setIsEditing(false);
  };

  return (
    <div className="profile-container">
      {/* Header / Avatar Section */}
      <div className="profile-header">
        <img src={user.avatar} alt={user.name} className="profile-avatar" />
        <div className="profile-header-info">
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-location">📍 {user.location}</p>
        </div>
        <button
          className="edit-button"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* Bio Section */}
      <div className="profile-bio-section">
        {isEditing ? (
          <textarea
            name="bio"
            value={editData.bio}
            onChange={handleEditChange}
            className="edit-textarea"
            placeholder="Enter your bio"
          />
        ) : (
          <p className="profile-bio">{user.bio}</p>
        )}
      </div>

      {/* Stats Section */}
      <div className="profile-stats">
        <div className="stat-card">
          <p className="stat-number">{user.reviewCount}</p>
          <p className="stat-label">Reviews</p>
        </div>
        <div className="stat-card">
          <p className="stat-number">{user.followersCount}</p>
          <p className="stat-label">Followers</p>
        </div>
        <div className="stat-card">
          <p className="stat-number">{user.followingCount}</p>
          <p className="stat-label">Following</p>
        </div>
      </div>

      {/* Editable Fields Section */}
      {isEditing && (
        <div className="edit-section">
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

          <div className="form-group">
            <label htmlFor="joinedDate">Joined</label>
            <input
              id="joinedDate"
              type="text"
              name="joinedDate"
              value={editData.joinedDate}
              onChange={handleEditChange}
              className="edit-input"
            />
          </div>

          <div className="edit-actions">
            <button className="save-button" onClick={handleSave}>
              Save Changes
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

      {/* Action Buttons */}
      {!isEditing && (
        <div className="profile-actions">
          <button className="action-button primary">Follow</button>
          <button className="action-button secondary">Message</button>
        </div>
      )}
    </div>
  );
}
