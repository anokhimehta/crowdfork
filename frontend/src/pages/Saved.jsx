import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams  } from "react-router-dom";
import { api } from "../api"; 
import './Saved.css';


const StarRating = ({ rating }) => {
    
    const roundedRating = Math.round(rating);
    return (
        <div className="star-rating-small">
            {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= roundedRating ? 'filled' : ''}>★</span>
            ))}
        </div>
    );
};

const FavoriteRestaurantCard = ({ restaurant, onToggleFavorite }) => {
    const navigate = useNavigate();
    
    const handleRemove = async (e) => {
        e.stopPropagation(); 
        
        onToggleFavorite(restaurant.id, false);
    };

    const handleCardClick = () => {
        navigate(`/restaurant/${restaurant.id}`);
    };

    const displayAddress = restaurant.location?.display_address?.join(", ") || "Address not available"; 
    const categories = restaurant.categories?.map(c => c.title) || [];
    
    const displayRating = restaurant.rating || 4.5; 

    return (
        <div className="favorite-card" onClick={handleCardClick} role="button" tabIndex="0">
            <div className="card-image-placeholder">
                 <img 
                    src={restaurant.image_url || `https://placehold.co/100x100/A0E7E5/000?text=${restaurant.name.substring(0,1)}`} 
                    alt={restaurant.name}
                    className="restaurant-thumbnail"
                 />
            </div>

            <div className="card-info">
                <div className="info-header">
                    <h3 className="restaurant-name-small">
                        {restaurant.name}
                    </h3>
                    <button 
                        className="remove-favorite-btn" 
                        onClick={handleRemove}
                        title="Remove from Favorites"
                    >
                        ❤️
                    </button>
                </div>

                <p className="restaurant-location-small">📍 {displayAddress}</p>
                
                <div className="restaurant-tags-small">
                    {categories.map((title, index) => (
                        <span key={index} className="tag-small">{title}</span>
                    ))}
                </div>

                <div className="card-rating">
                    <StarRating rating={displayRating} />
                    <span className="rating-value">({displayRating.toFixed(1)})</span>
                </div>
            </div>
        </div>
    );
};


export default function FavoritesPage() {
    const navigate = useNavigate();
    const locationHook = useLocation();
    const [searchParams] = useSearchParams(locationHook.search); 
    const [favorites, setFavorites] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

const handleGoBack = () => {
       const fromQuery = searchParams.get('fromQ');
        const fromLocation = searchParams.get('fromL');
        
        if (fromQuery) {
            // If we have saved search data, navigate back to search with the state preserved in the URL
            navigate(`/search?q=${fromQuery}&loc=${fromLocation}`);
        } else {
            // Default browser back if no search data was saved
            navigate(-1);
        }
    };



    const fetchFavorites = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            
            const idsResponse = await api.getUsersFavoritesList(); 
            const favoriteIds = idsResponse.favorite_ids || [];

            if (favoriteIds.length === 0) {
                 setFavorites([]);
                 return;
            }

            
            const detailPromises = favoriteIds.map(id => api.getYelpBusinessDetails(id));
            
            
            const detailedFavorites = await Promise.all(detailPromises);
            
            
            if (Array.isArray(detailedFavorites)) {
                 
                 setFavorites(detailedFavorites.filter(Boolean)); 
            } else {
                 console.error("API returned non-array data for detailed favorites:", detailedFavorites);
                 setFavorites([]); 
            }
        } catch (err) {
            
            setError("Failed to load favorite restaurant details. Please check the backend configuration or Yelp API key.");
            console.error("Error fetching detailed favorites:", err);
            setFavorites([]); 
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);



    const handleToggleFavorite = async (restaurantId, isAdding) => {
        
        if (isAdding) return; 

        try {
            await api.removeFavorite(restaurantId);
            
            setFavorites(prevFavorites => prevFavorites.filter(
                fav => fav.id !== restaurantId
            ));
        } catch (err) {
            setError(`Failed to remove restaurant. Please try again.`);
            console.error("Removal error:", err);
        }
    };


    // --- Render Logic ---
    if (loading) {
        return <div className="favorites-page-container"><h2>Loading Favorites...</h2></div>;
    }

    if (error) {
        return <div className="favorites-page-container"><h2 className="error-message">{error}</h2></div>;
    }

    return (
        <div className="favorites-page-container">
            <button className="back-button" onClick={handleGoBack}>
                ← Go Back
            </button>
            <h1 className="favorites-title"> My Favorite Restaurants ({favorites.length})</h1>

            {favorites.length === 0 ? (
                <p className="no-favorites-message">
                    You haven't saved any restaurants yet. Find something great to eat!
                </p>
            ) : (
                <div className="favorites-list-grid">
                    
                    {favorites.map((restaurant) => (
                        <FavoriteRestaurantCard 
                            key={restaurant.id} 
                            restaurant={restaurant} 
                            onToggleFavorite={handleToggleFavorite}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}