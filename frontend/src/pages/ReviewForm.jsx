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
    }
}