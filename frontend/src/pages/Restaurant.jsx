import React, {useEffect, useState, useCallback} from "react";
import "./Restaurant.css"; // styles below
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api"; // needed for fetching restaurant data

export default function Restaurant() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeImage, setActiveImage] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favoritesError, setFavoritesError] = useState(null);
    const [recs, setRecs] = useState([]);

      const handleGoBack = () => {
        navigate(-1);
    };


    const reviews = [
        {
            id: 1,
            username: "foodie123",
            rating: 5,
            text: "Amazing food and great atmosphere! Highly recommend the pasta.",
            date: "2024-06-15"
        },
        {
            id: 2,
            username: "gourmet_gal",
            rating: 4,
            text: "Delicious dishes but a bit pricey. Loved the dessert though!",
            date: "2024-06-10"
        }
    ];

    const formatTime = (t) => {
        const hour = parseInt(t.substring(0, 2));
        const minute = t.substring(2);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minute} ${ampm}`;
    };

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const formatHours = (hoursArray) => {
        if (!hoursArray || hoursArray.length === 0) return "Not available";
        const openTimes = hoursArray[0].open; // Yelp always puts "open" inside hours[0]
        const grouped = {};

        openTimes.forEach(({ day, start, end }) => {
            const dayName = dayNames[day];
            grouped[dayName] = `${formatTime(start)} – ${formatTime(end)}`;
        });
        return grouped;
    };

    const StarRating = ({rating}) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= rating ? 'filled' : ''}>★</span>
                ))}
            </div>
        );
    }

    const checkFavoriteStatus = useCallback(async () => {

        try {
            const response = await api.getUsersFavoritesList(); // <-- NOTE: We need a new backend endpoint for *just* the IDs
            const favoriteIds = response.favorite_ids || [];
            const isFav = favoriteIds.includes(id);
            // const isFav = response.data.some(fav => fav.id === id);
            console.log(response);
            console.log("Favorite status for restaurant", id, "is", isFav);
            setIsFavorited(isFav);

        } catch (err) {
           
            setFavoritesError("Could not check favorite status. Please log in.");
            console.error("Error checking favorite status:", err);
        }
    }, [id]);

    const toggleFavorite = async () => {

        try {
            if (isFavorited) {
                // DELETE request to remove the favorite
                await api.removeFavorite(id);
                setIsFavorited(false);
            } else {
                // POST request to add the favorite
                await api.addFavorite(id);
                setIsFavorited(true);
            }
            setFavoritesError(null);
        } catch (err) {
            setFavoritesError("Failed to update favorites.");
            console.error("Error toggling favorite:", err);
        }
    }


    useEffect(() => {
        // Fetch restaurant data from API
        const fetchRestaurant = async () => {
            try {
                setLoading(true);
                const data = await api.getYelpBusinessDetails(id);
                setRestaurant(data);

                const recData = await api.getSimilarRestaurants(id, 5);
                setRecs(recData);

                setError(null);
            } catch (err) {
                setError(err.message);
                console.log("Error fetching restaurant data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchRestaurant();
            checkFavoriteStatus(); 
        }
    }, [id, checkFavoriteStatus]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if(!restaurant) {
        return <div>No restaurant data available.</div>;
    }

    return (
        <div className="restaurant-page">
            <button 
          className="back-button"
          onClick={handleGoBack}
      >
          ← Go Back
      </button>
            <div className="restaurant-detail-container">
                {/* Header Section */}
                <div className="restaurant-header">
                    <div className="header-left">
                        <h1 className="restaurant-name">{restaurant?.name}</h1>
                        <p className="restaurant-location">{restaurant?.location?.display_address?.join(", ")}</p>
                        <div className="restaurant-tags">
                            {restaurant?.categories?.map((c) => (
                                <span key={c.alias} className="tag">{c.title}</span>
                            ))}
                        </div>
                    </div>
                    <div className="header-right">
                        <button 
                            className="favorite-button" 
                            onClick={toggleFavorite}
                        >
                            {isFavorited ? "❤️" : "🤍"}
                        </button>
                        <button className="compare-button">Compare</button>
                        <button 
                            className="review-button" 
                            onClick={() => navigate("/review")}
                            >Write a Review</button>  
                    </div>
                </div>
            
                {/* Main Content */}
                <div className="main-content">
                    <div className="top-content">
                        {/* Image Gallery */}
                        <div className="image-gallery">
                            <button 
                                className="nav-arrow left-arrow" 
                                onClick={() => setActiveImage((i) => Math.max(0, i - 1))}
                            >
                                ‹
                            </button>
                            <div className="image-display">
                                {restaurant?.photos?.map((photo, index) => (
                                    <img
                                        key={index}
                                        src={photo}
                                        alt={restaurant?.name}
                                        className={`gallery-image ${index === activeImage ? "active" : ""}`}
                                    />
                                ))}
                            </div>
                            <button 
                                className="nav-arrow right-arrow" 
                                onClick={() => setActiveImage((i) => Math.min(restaurant?.photos?.length - 1, i + 1))}
                            >
                                ›
                            </button>
                        </div>

                        {/* Restaurant Description */}
                        <div className="restaurant-info-box">
                            <div className="info-item">
                                <span className="info-label">Rating:</span>
                                <StarRating rating={restaurant?.rating} />
                            </div>
                            <div className="info-item">
                                <span className="info-label">Hours:</span>
                                <div className="hours-list">
                                    {restaurant?.hours
                                        ? Object.entries(formatHours(restaurant.hours)).map(([day, hours]) => (
                                            <div key={day} className="hour-row">
                                                <span className="hour-day">{day}:</span>
                                                <span className="hour-time">{hours}</span>
                                            </div>
                                        ))
                                        : "No hours listed"}
                                </div>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Address:</span>
                                <span className="info-text">{restaurant?.location?.display_address?.join(", ")}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Contact:</span>
                                <span className="info-text">{restaurant?.display_phone || "N/A"}</span>
                            </div>
                        </div>
                    </div>              
                        
                    {/* Reviews Section */}
                    <div className="bottom-content">
                        <div className="reviews-header">
                            <h2 className="reviews-title">User Reviews</h2>
                            <button className="add-review-button"
                                onClick={() => navigate("/review")}
                                >Add a Review</button>
                        </div>
                        <div className="reviews-list">
                            {reviews.map((review) => (
                                <div key={review.id} className="review-card">
                                    <div className="review-header-line">
                                        <span className="review-username">{review.username}</span>
                                        <StarRating rating={review.rating} />
                                    </div>
                                    <p className="review-text">{review.text}</p>
                                    <span className="review-date">{review.date}</span>
                                </div>
                            ))}
                        </div>

                        {/* Recommendations Section */}
                        <div className="recommendations">
                            <h3>You might also like...</h3>
                            <div className="recommendation-list">
                                {recs.length === 0 ? (
                                    <p>No similar restaurants found.</p>
                                ) : (
                                    recs.map((rec) => (
                                        <div 
                                            key={rec.id} 
                                            className="recommendation-card"
                                            onClick={() => navigate(`/restaurant/${rec.id}`)}
                                        >
                                            <img 
                                                src={rec.image_url || ""} 
                                                alt={rec.name} 
                                                className="recommendation-img" 
                                            />
                                            <div className="recommendation-info">
                                                <h4 className="rec-name">{rec.name}</h4>
                                                <p className="rec-rating">⭐ {rec.rating} ({rec.review_count})</p>
                                                {rec.price && <p className="rec-price">{rec.price}</p>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}