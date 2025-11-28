import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

// --- CONFIGURATION ---
const API_BASE_URL = 'http://localhost:8000'; 

// Function to get the stored token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// --- API Helper Function ---
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// ----------------------------

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // --- Data Fetching Logic ---
  const fetchData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError('You are not logged in. Please sign in.');
      setLoading(false);
      return;
    }

    try {
      // Fetch all three pieces of data concurrently for speed
      const [profileRes, reviewsRes, favoritesRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users/me/reviews?limit=5'),
        api.get('/users/me/favorites'),
      ]);

      setProfile(profileRes.data);
      setReviews(reviewsRes.data);
      setFavorites(favoritesRes.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please log in again.');
        handleSignOut(); // Automatically sign out on 401
      } else {
        setError('Failed to fetch profile data.');
        console.error("API Fetch Error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    
    navigate('/login'); 
  };
  
//Remove favourite
  const handleRemoveFavorite = async (restaurantId) => {
    try {
      await api.delete(`/favorites/${restaurantId}`);

      setFavorites(favorites.filter(fav => fav.id !== restaurantId));
    } catch (err) {
      setError('Failed to remove favorite.');
      console.error("Remove Favorite Error:", err);
    }
  };



  if (loading) return <div className="loading-spinner">Loading Profile...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!profile) return <div>No profile data found.</div>;


  return (
    <div className="user-profile-container">
      
      <section className="profile-header">
        {profile.image_url ? (
          <img 
            src={profile.image_url} 
            alt={`${profile.email}'s profile`} 
            className="profile-avatar"
            // Simple inline style for a placeholder size
            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div className="profile-avatar-placeholder" style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
            👤
          </div>
        )}
        
        <h1>👋 Welcome, {profile.email.split('@')[0]}!</h1>
        
        {profile.tagline && <p className="tagline">"{profile.tagline}"</p>}
        
        {profile.location && <p className="location">📍 From: {profile.location}</p>}
        
      </section>
      
      {/* The Sign Out button should follow the main profile info */}
      <button onClick={handleSignOut} className="sign-out-btn">
        Sign Out
      </button>

      {/* --- Account Mail Section (Kept for email/ID display) --- */}
      <section className="account-info">
        <h2>📧 Account Details</h2>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>User ID:</strong> {profile.user_id}</p>
      </section>
      
      <hr/>

      {/* --- Your Reviews Section --- */}
      <section className="my-reviews">
        <h2>✍️ My Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p>You haven't posted any reviews yet.</p>
        ) : (
          <ul className="review-list">
            {reviews.map((review) => (
              <li key={review.review_id} className="review-card">
                <h3>{review.restaurant_name}</h3>
                <p>Rating: {'⭐️'.repeat(review.rating)}</p>
                <p>"{review.text}"</p>
                <small>Reviewed on: {new Date(review.created_at).toLocaleDateString()}</small>
                
              </li>
            ))}
          </ul>
        )}
      </section>
      
      <hr/>

      {/* --- Your Favorites Section --- */}
      <section className="my-favorites">
        <h2>💖 Your Favorites ({favorites.length})</h2>
        {favorites.length === 0 ? (
          <p>You haven't favorited any restaurants yet.</p>
        ) : (
          <ul className="favorite-list">
            {favorites.map((fav) => (
              <li key={fav.id} className="favorite-item">
                <span className="restaurant-name">{fav.name}</span>
                <button 
                  onClick={() => handleRemoveFavorite(fav.id)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default UserProfile;