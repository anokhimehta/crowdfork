import React, {useState} from "react";
import "./ReviewForm.css"; // styles below

export default function ReviewForm() {
    const [overallRating, setOverallRating] = useState(0);
    const [foodRating, setFoodRating] = useState(0);
    const [ambienceRating, setAmbienceRating] = useState(0);
    const [serviceRating, setServiceRating] = useState(0);
    const [experience, setExperience] = useState("");
    const [recommendedDishes, setRecommendedDishes] = useState("");
    const [priceRange, setPriceRange] = useState("");

    const handleSubmit = () => {
        console.log({
            overallRating,
            foodRating,
            ambienceRating,
            serviceRating,
            experience,
            recommendedDishes,
            priceRange
        });
        // Here you would typically handle form submission, e.g., send data to backend
        alert("Review submitted!");
    }

    //star rating component
    const StarRating = ({rating, setRating, label}) => {
        return (
            <div className="rating-row">
                <label className="rating-label">{label}</label>
                <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`star-button ${star <= rating ? 'filled' : ''}`}
                            onClick={() => setRating(star)}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="review-form-wrap">
            {/* Header with X button and restaurant name */}
            <div className="review-header">
                <button className="close-button" onClick={() => window.history.back()}>
                    ✕
                </button>
                <h1 className="restaurant-title">L'industrie Pizzeria Brooklyn</h1>
            </div>

            {/* User Info */}
            <div className="user-info">
                <div className="user-avatar"></div>
                <span className="user-name">Anokhi Mehta</span>
            </div>

            {/* Review Form */}
            <div className="form-content-horizontal">
                {/*Left column*/}
                <div className="left-column">
                    {/* Star Ratings */}
                    <div className="star-ratings">
                        <StarRating label="Overall" rating={overallRating} setRating={setOverallRating} />
                        <StarRating label="Food" rating={foodRating} setRating={setFoodRating} />
                        <StarRating label="Ambience" rating={ambienceRating} setRating={setAmbienceRating} />
                        <StarRating label="Service" rating={serviceRating} setRating={setServiceRating} />
                    </div>
                </div>
                
                {/*Right column*/}
                <div className="right-column">
                    {/* Text Areas */}
                    <textarea
                        className="review-textarea"
                        placeholder="Describe your experience..."
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        rows={4}
                    />  

                    {/* Add Photos Button */}
                    <button className="add-photos-button">
                        <span className="media-icon">🖼️</span>
                        Add photos & videos
                    </button>

                    {/* Recommended Dishes */}
                    <input
                        type="text"
                        className="recommended-dishes-input"
                        placeholder="Recommended dishes (comma separated)"
                        value={recommendedDishes}
                        onChange={(e) => setRecommendedDishes(e.target.value)}
                    />

                    {/* Price Range */}
                    <div className="price-section">
                        <p className="price-label">How much did you pay per person?</p>
                        <div className="price-options">
                            {['<$5', '$5 - $10', '$10 - $20', '$20 - $50', '>$50'].map((range) => (
                                <button
                                    key={range}
                                    type="button"
                                    className={`price-button ${priceRange === range ? 'selected' : ''}`}
                                    onClick={() => setPriceRange(range)}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="submit-section">
                {/* Submit Button */}
                <button className="submit-review-button" onClick={handleSubmit}>
                    Submit
                </button>
            </div>
        </div>
    );
}