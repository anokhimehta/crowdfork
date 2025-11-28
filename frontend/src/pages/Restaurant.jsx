import React, {useState} from "react";
import "./Restaurant.css"; // styles below
import { useNavigate, useParams } from "react-router-dom";

export default function Restaurant() {
    const navigate = useNavigate();
    const [activeImage, setActiveImage] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);
    const images = [
        "/images/restaurant1.jpg",
        "/images/restaurant2.jpg",
        "/images/restaurant3.jpg",
        "/images/restaurant4.jpg"
    ];

    const { id } = useParams();

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

    const StarRating = ({rating}) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= rating ? 'filled' : ''}>★</span>
                ))}
            </div>
        );
    }

    const toggleFavorite = () => {
        setIsFavorited(!isFavorited);
    }

    return (
        <div className="restaurant-page">
            <div className="restaurant-detail-container">
                {/* Header Section */}
                <div className="restaurant-header">
                    <div className="header-left">
                        <h1 className="restaurant-name">L'industrie Pizzeria Brooklyn</h1>
                        <p className="restaurant-location">Brooklyn, NY</p>
                        <div className="restaurant-tags">
                            <span className="tag">Italian</span>
                            <span className="tag">Pizza</span>
                            <span className="tag">Casual Dining</span>
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
                            <button className="nav-arrow left-arrow" onClick={() => setActiveImage(Math.max(0, activeImage - 1))}>
                                ‹
                            </button>
                            <div className="image-display">
                                {images.map((img, index) => (
                                    <div 
                                        key={index} 
                                        className={`image-placeholder ${index === activeImage ? 'active' : ''}`}
                                    >
                                        {img}
                                    </div>
                                ))}
                            </div>
                            <button className="nav-arrow right-arrow" onClick={() => setActiveImage(Math.min(images.length - 1, activeImage + 1))}>
                                ›
                            </button>
                        </div>

                        {/* Restaurant Description */}
                        <div className="restaurant-info-box">
                            <div className="info-item">
                                <span className="info-label">Rating:</span>
                                <StarRating rating={4.5} />
                            </div>
                            <div className="info-item">
                                <span className="info-label">Hours:</span>
                                <span className="info-text">Mon-Sun: 11am - 11pm</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Address:</span>
                                <span className="info-text">123 Brooklyn St, Brooklyn, NY</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Contact:</span>
                                <span className="info-text">(123) 456-7890</span>
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
                            <div className="recommendation-buttons">
                                <button className="recommendation-button">Lucali</button>
                                <button className="recommendation-button">Slicehaus</button>
                                <button className="recommendation-button">Mama's TOO</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}