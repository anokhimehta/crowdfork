import React, { useState } from "react";
import "./Search.css"; // Import the CSS file
import logo from '../assets/logo.png';

export default function Search() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("home");

    const localPicks = Array(7).fill(null);

    const trendingRestaurants = [
        {
            id: 1,
            name: 'Restaurant A',
            cuisine: 'Italian',
            location: 'New York, NY',
            review: 'Great food and ambiance!',
            username: 'foodie123'
        },
        {
            id: 2,
            name: 'Restaurant B',
            cuisine: 'Chinese',
            location: 'San Francisco, CA',
            review: 'Delicious and authentic flavors.',
            username: 'cheflover'
        },
        {
            id: 3,
            name: 'Restaurant C',
            cuisine: 'Mexican',
            location: 'Austin, TX',
            review: 'Amazing tacos and margaritas!',
            username: 'spicyfan'
        },
        {
            id: 4,
            name: 'Restaurant D',
            cuisine: 'Indian',
            location: 'Chicago, IL',
            review: 'Aromatic and flavorful dishes.',
            username: 'curryenthusiast'
        }
    ];

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
                <input
                    type="text"
                    placeholder="Search for restaurants, cuisines, or locations"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
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
                        {trendingRestaurants.map((restaurant) => (
                            <div key={restaurant.id} className="restaurant-card">
                                <div className="restaurant-image" />
                                <div className="restaurant-info">
                                    <h3 className="restaurant-name">
                                        {restaurant.name}
                                    </h3>
                                    <p className="restaurant-location">
                                        {restaurant.cuisine} - {restaurant.location}
                                    </p>
                                    <p className="restaurant-review">
                                        "{restaurant.review}" - {restaurant.username}
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