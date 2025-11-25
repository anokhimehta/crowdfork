import React, { useState, useEffect } from "react";
import "./Search.css"; // Import the CSS file
import logo from '../assets/logo.png';
import { api } from "../api";

export default function Search() {
    const [searchQuery, setSearchQuery] = useState("");
    const [location, setLocation] = useState("NYC");
    const [activeTab, setActiveTab] = useState("home");
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const localPicks = Array(7).fill(null);

    useEffect(() => {
        loadRestaurants();
    }, []);

    const loadRestaurants = async () => {
        setLoading(true);
        try {
            const data = await api.getRestaurants();
            setRestaurants(data);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to load restaurants");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        if (e.key === 'Enter') {
            setLoading(true);
            try {
                const locationToUse = location.trim() ? location.trim() : "NYC";
                const query = searchQuery.trim();
                if (query) {
                    // For now, using location as default NYC, can be improved later
                    const data = await api.searchRestaurants(searchQuery, locationToUse);
                    setRestaurants(data.businesses || []);
                } else {
                    loadRestaurants();
                }
            } catch (err) {
                console.error(err);
                setError("Search failed");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="search-container">
            {/* Header */}
            <div className="header">
                <img
                    src={logo}
                    alt="CrowdFork Logo"
                    className="logo-image"
                />
            </div>

            {/* Search Bar */}
            <div className="search-bar-container">
                <div className="search-row">
                    <input
                        type="text"
                        placeholder="Search for restaurants, cuisines, or locations"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        className="search-input main-input"
                    />

                    <input
                        type="text"
                        placeholder="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyDown={handleSearch}
                        className="search-input location-input"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Local Picks Section */}
                <div className="local-picks-section">
                    <h2 className="section-title">Local Picks</h2>
                    <div className="local-picks-container">
                        {localPicks.map((_, index) => (
                            <div key={index} className="local-pick-card" />
                        ))}
                    </div>
                </div>

                {/* Trending Restaurants Section */}
                <div className="trending-section">
                    <h2 className="section-title">Trending This Week</h2>
                    <div className="restaurant-grid">
                        {loading && <p>Loading...</p>}
                        {error && <p className="error-message">{error}</p>}
                        {!loading && !error && restaurants.map((restaurant) => (
                            <div key={restaurant.id} className="restaurant-card">
                                <div className="restaurant-image" style={{ backgroundImage: `url(${restaurant.image_url || ''})` }} />
                                <div className="restaurant-info">
                                    <h3 className="restaurant-name">
                                        {restaurant.name}
                                    </h3>
                                    <p className="restaurant-location">
                                        {restaurant.cuisine_type || (restaurant.categories && restaurant.categories[0]?.title)} - {restaurant.address || (restaurant.location && restaurant.location.address1)}
                                    </p>
                                    <p className="restaurant-review">
                                        {restaurant.rating ? `Rating: ${restaurant.rating}` : "No rating yet"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Navigation Bar */}
                <nav className="bottom-nav">
                    <button
                        className={`nav-button ${activeTab === "home" ? "active" : ""}`}
                        onClick={() => setActiveTab("home")}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span className="nav-label">Home</span>
                    </button>

                    <button
                        className={`nav-button ${activeTab === "search" ? "active" : ""}`}
                        onClick={() => setActiveTab("search")}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <span className="nav-label">Search</span>
                    </button>

                    <button
                        className={`nav-button ${activeTab === "saved" ? "active" : ""}`}
                        onClick={() => setActiveTab("saved")}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span className="nav-label">Saved</span>
                    </button>

                    <button
                        className={`nav-button ${activeTab === "profile" ? "active" : ""}`}
                        onClick={() => setActiveTab("profile")}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span className="nav-label">Profile</span>
                    </button>
                </nav>
            </div>
        </div>
    );
}