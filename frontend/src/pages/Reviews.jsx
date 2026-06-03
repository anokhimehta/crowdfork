import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from 'axios';
import './Reviews.css';

const API_BASE_URL = 'http://localhost:8000';
const getAuthToken = () => localStorage.getItem('authToken');

const base_api = axios.create({ baseURL: API_BASE_URL });
base_api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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

const ReviewCard = ({ review, onDelete }) => {
    const navigate = useNavigate();

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this review?")) {
            onDelete(review.id);
        }
    };

    const handleCardClick = () => {
        navigate(`/restaurant/${review.restaurant_id}`);
    };

    return (
        <div className="review-card" onClick={handleCardClick} role="button" tabIndex="0">
            <div className="review-card-header">
                <div>
                    <h3 className="restaurant-name">{review.restaurant_name}</h3>
                    <StarRating rating={review.rating} />
                </div>
                <button 
                    className="delete-review-btn" 
                    onClick={handleDelete}
                    title="Delete Review"
                >
                    🗑️
                </button>
            </div>

            <p className="review-text">{review.text}</p>

            {review.recommended_dishes && review.recommended_dishes.length > 0 && (
                <p className="review-dishes">
                    <strong>Recommended:</strong> {review.recommended_dishes.join(", ")}
                </p>
            )}

            {review.price_range && (
                <p className="review-price">
                    <strong>Price:</strong> {review.price_range}
                </p>
            )}

            <div className="review-ratings-detail">
                {review.food_rating && (
                    <span>Food: <StarRating rating={review.food_rating} /></span>
                )}
                {review.ambience_rating && (
                    <span>Ambience: <StarRating rating={review.ambience_rating} /></span>
                )}
                {review.service_rating && (
                    <span>Service: <StarRating rating={review.service_rating} /></span>
                )}
            </div>

            <span className="review-date">
                {new Date(review.created_at).toLocaleDateString()}
            </span>
        </div>
    );
};

export default function ReviewsPage() {
    const navigate = useNavigate();
    const locationHook = useLocation();
    const [searchParams] = useSearchParams(locationHook.search);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleGoBack = () => {
        const fromQuery = searchParams.get('fromQ');
        const fromLocation = searchParams.get('fromL');

        if (fromQuery) {
            navigate(`/search?q=${fromQuery}&loc=${fromLocation}`);
        } else {
            navigate(-1);
        }
    };

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await base_api.get('/users/me/reviews');
            setReviews(response.data || []);
        } catch (err) {
            setError("Failed to load reviews. Please try again.");
            console.error("Error fetching reviews:", err);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleDeleteReview = async (reviewId) => {
        try {
            await base_api.delete(`/review/${reviewId}`);
            setReviews(prevReviews => prevReviews.filter(rev => rev.id !== reviewId));
        } catch (err) {
            setError(`Failed to delete review. Please try again.`);
            console.error("Delete error:", err);
        }
    };

    if (loading) {
        return <div className="reviews-page-container"><h2>Loading Reviews...</h2></div>;
    }

    if (error) {
        return <div className="reviews-page-container"><h2 className="error-message">{error}</h2></div>;
    }

    return (
        <div className="reviews-page-container">
            <button className="back-button" onClick={handleGoBack}>
                ← Go Back
            </button>
            <h1 className="reviews-title">My Reviews ({reviews.length})</h1>

            {reviews.length === 0 ? (
                <p className="no-reviews-message">
                    You haven't written any reviews yet. Share your dining experiences!
                </p>
            ) : (
                <div className="reviews-list-grid">
                    {reviews.map((review) => (
                        <ReviewCard 
                            key={review.id} 
                            review={review}
                            onDelete={handleDeleteReview}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}