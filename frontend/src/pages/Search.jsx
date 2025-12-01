import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams  } from "react-router-dom";
import axios from 'axios';
import "./Search.css"; // Import the CSS file
import logo from '../assets/logo.png';
import { api} from "../api";


const API_BASE_URL = 'http://localhost:8000'; 


// --- API Helper Function ---
const getAuthToken = () => localStorage.getItem('authToken');

const base_api = axios.create({ baseURL: API_BASE_URL });
base_api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [location, setLocation] = useState("NYC");
    const [activeTab, setActiveTab] = useState("home");
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const suggestionsRef = useRef(null);
    // const [localPicks, setLocalPicks] = useState([]);
    const navigate = useNavigate();
    const [coordinates, setCoordinates] = useState({ lat: null, lon: null });
    const [isUsingLocation, setIsUsingLocation] = useState(false);


    // useEffect(() => {
    //     // If the user is NOT authenticated (token is missing or false)
    //     if (typeof api.isAuthenticated() !== 'undefined' && !api.isAuthenticated()) {
    //         // Redirect them to the login page immediately
    //         navigate('/login');
    //     }
    // }, [navigate]);

     const performSearch = useCallback(async (term, loc) => {
        if (!api.isAuthenticated()) { 
            setError("Please log in to perform searches.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await api.searchRestaurants(term, loc); 
            setRestaurants(data.businesses || []);
            
            setSearchParams({ q: term, loc: loc });
            
        } catch (err) {
            console.error(err);
            setError("Search failed");
            setRestaurants([]);
        } finally {
            setLoading(false);
        }
    }, [setSearchParams]);
    
    useEffect(() => {
        if (typeof api.isAuthenticated !== 'undefined' && !api.isAuthenticated()) {
            navigate('/login');
            return;
        }

        const query = searchParams.get('q');
        const loc = searchParams.get('loc');
        
        if (query) {
           
            setSearchQuery(query);
            setLocation(loc || "NYC");
            performSearch(query, loc || "NYC");
        } else {
            
            loadRestaurants();
        }
    }, [navigate, searchParams, performSearch]);



    //when user starts typing, show suggestions
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setSearchSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const data = await api.getAutoCompleteSuggestions(searchQuery);
                const suggestions = (data.terms || []).map(t => 
                    ({ value: t.text })
                );
                setSearchSuggestions(suggestions);
                setShowSuggestions(true);
            } catch (err) {
                console.error(err);
            }
        };

        const delayDebounce = setTimeout(fetchSuggestions, 250); // debounce typing
        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);  


    //when user clicks outside suggestions box, hide suggestions
    useEffect(() => {
        function handleClickOutside(event) {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }   

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [suggestionsRef]);

    useEffect(() => {
        loadRestaurants();
        // loadLocalPicks();
    }, []);

    const getRatingValue = (restaurant) => {
        if (restaurant.rating) {
            return restaurant.rating;
        }
        if (restaurant.description?.startsWith("Rating:")) {
            return Number(restaurant.description.replace("Rating:", "").trim());
        }
        return null;
    };

    const starRating = (rating) => {
        const fullStars = Math.round(rating);
        const emptyStars = 5 - fullStars;

        return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
    };

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

    // const loadLocalPicks = async () => {
    //     setLoading(true);
    //     try {
    //         const lat = 40.7128; // Example latitude for NYC
    //         const lon = -74.0060; // Example longitude for NYC
    //         const data = await api.getLocalPicks(lat, lon, 10);
    //         setLocalPicks(data.businesses || []);
    //     } catch (err) {
    //         console.error(err);
    //         setError(err.message || "Failed to load local picks");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    


    const handleGeolocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCoordinates({ lat: latitude, lon: longitude });
                setLocation("Current Location"); // will set text in location box to indicate GPS usage instead of user inputed location
                setIsUsingLocation(true);
                setLoading(false);
                
            },
            (err) => {
                console.error(err);
                setError("Unable to retrieve your location");
                setLoading(false);
            }
        );
    };

    const handleSearch = async (e, directLat = null, directLon = null) => {
        // Allow calling without an event (e.g. after geolocation)
        if (e && e.key !== 'Enter') return;

        setLoading(true);
        try {
            const query = searchQuery.trim();
            
            // Determine which location data to use
            const latToUse = directLat || (isUsingLocation ? coordinates.lat : null);
            const lonToUse = directLon || (isUsingLocation ? coordinates.lon : null);
            const locationToUse = location.trim();

            if (query) {
                // Pass lat/lon to the api function we updated in Step 2
                const data = await api.searchRestaurants(
                    query, 
                    locationToUse, 
                    latToUse, 
                    lonToUse
                );
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
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion.value);
        setShowSuggestions(false);
        setLoading(true);

        // Logic to determine if we should send coordinates, based on isUsingLocation state.
        const latToUse = isUsingLocation ? coordinates.lat : null;
        const lonToUse = isUsingLocation ? coordinates.lon : null;
        const locationToUse = location.trim() ? location.trim() : "NYC"; // Default to NYC if location is empty

        // passes all 4 arguments: query, location, lat, lon
        api.searchRestaurants(suggestion.value, locationToUse, latToUse, lonToUse)
            .then((data) => {
                setRestaurants(data.businesses || []);
            })
            .catch((err) => {
                console.error(err);
                setError("Search failed");
            })
            .finally(() => {
                setLoading(false);
            });
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
            <div className="search-bar-container" ref={suggestionsRef}>
                <div className="search-row">
                    <input
                        type="text"
                        placeholder="Search for restaurants, cuisines, or locations"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery && setShowSuggestions(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch(e);
                            }
                        }}
                        className="search-input main-input"
                    />

                    <div className="location-wrapper">
                        <input
                            type="text"
                            placeholder="Location"
                            value={location}
                            onChange={(e) => {
                                setLocation(e.target.value);
                                setIsUsingLocation(false); // Stop using GPS coords if user types
                                setCoordinates({ lat: null, lon: null });
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch(e);
                                }
                            }}
                            className="search-input location-input"
                        />
                        
                        <button 
                            className={`geo-button ${isUsingLocation ? 'active' : ''}`}
                            onClick={handleGeolocation}
                            title="Use my current location"
                        >
                            {/* SVG Pin Icon */}
                            <svg 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>

                {showSuggestions && searchSuggestions.length > 0 && (
                    <ul className="suggestions-dropdown">
                        {searchSuggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                className="suggestion-item"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                <span className="suggestion-text">{suggestion.value}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* no results */}
                {showSuggestions && searchSuggestions.length === 0 && (
                    <ul className="suggestions-dropdown">
                        <li className="no-suggestion-item">
                            <span className="suggestion-text">No suggestions found</span>
                        </li>
                    </ul>
                )}
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Local Picks Section
                <div className="local-picks-section">
                    <h2 className="section-title">Local Picks</h2>
                    <div className="local-picks-container">
                        {localPicks.map((restaurant) => (
                            <div
                                key={restaurant.id}
                                className="local-pick-card"
                                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                            >
                                <div
                                    className="local-pick-image"
                                    style={{ backgroundImage: `url(${restaurant.image_url || ''})` }}
                                />
                                <h4 className="local-pick-name">{restaurant.name}</h4>
                            </div>
                        ))}
                    </div>
                </div> */}

                {/* Trending Restaurants Section */}
                <div className="trending-section">
                    <h2 className="section-title">Trending This Week</h2>
                    {loading && <p>Loading...</p>}
                    {error && <p className="error-message">{error}</p>}
                    <div className="restaurant-grid">
                        {!loading && !error && restaurants.map((restaurant) => (
                            <div key=
                                {restaurant.id} 
                                className="restaurant-card"
                                onClick={() => navigate(`/restaurant/${restaurant.id}?fromQ=${encodeURIComponent(searchQuery)}&fromL=${encodeURIComponent(location)}`)}
                                style={{ cursor: 'pointer' }}
                                >
                                <div className="restaurant-image" style={{ backgroundImage: `url(${restaurant.image_url || ''})` }} />
                                <div className="restaurant-info">
                                    <h3 className="restaurant-name">
                                        {restaurant.name}
                                    </h3>
                                    <p className="restaurant-location">
                                        {restaurant.cuisine_type || (restaurant.categories && restaurant.categories[0]?.title)} - {restaurant.address || (restaurant.location && restaurant.location.address1)}
                                    </p>
                                    <div className="restaurant-rating">
                                        {getRatingValue(restaurant) ? (
                                            <>
                                                <span className="rating-number">
                                                    {getRatingValue(restaurant).toFixed(1)}
                                                </span>
                                                <span className="rating-stars">
                                                    {starRating(getRatingValue(restaurant))}
                                                </span>
                                            </>
                                        ) : (
                                            "No rating"
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Bar */}
            <nav className="bottom-nav">
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
                    onClick={() => navigate("/saved")}
                >
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span className="nav-label">Saved</span>
                </button>

                <button
                    className={`nav-button ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => navigate("/profile")}
                >
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span className="nav-label">Profile</span>
                </button>
            </nav>
        </div>
    );
}