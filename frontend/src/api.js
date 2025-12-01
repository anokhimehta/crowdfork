const API_BASE_URL = "http://127.0.0.1:8000";

const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

const isAuthenticated = () => {
    return !!getAuthToken();
};

const handleUnauthorized = () => {
    console.warn("Unauthorized access detected. Redirecting to login.");
    localStorage.removeItem('authToken');
    window.location.href = "/login";
    
    throw new Error("Session expired or unauthorized. Redirecting..."); 
}


const fetchWithAuth = async (url, options = {}) => {
    const token = getAuthToken();
    if (!token) {
        handleUnauthorized();
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        handleUnauthorized();
    }
    
    return response;
};

export const api = {
    baseUrl: API_BASE_URL,

    isAuthenticated: isAuthenticated, 

    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Login failed");
        }
        return response.json();
    },

    async signup(email, password) {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Signup failed");
        }
        return response.json();
    },

    async searchRestaurants(term, location, latitude = null, longitude = null) {
        const params = new URLSearchParams({ term });
        
        // If we have coordinates use them. Otherwise use the location string.
        if (latitude && longitude) {
            params.append("latitude", latitude);
            params.append("longitude", longitude);
        } else {
            // Default to NYC if location is empty and no coordinatess provided
            params.append("location", location || "NYC"); 
        }

        const response = await fetch(`${API_BASE_URL}/search/restaurants?${params}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Search failed");
        }
        return response.json();
    },

    async getRestaurants(limit = 20, cuisineType = null) {
        let url = `${API_BASE_URL}/restaurants?limit=${limit}`;
        if (cuisineType) {
            url += `&cuisine_type=${cuisineType}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to fetch restaurants");
        }
        return response.json();
    },

    async getAutoCompleteSuggestions(query, latitude = null, longitude = null) {
        if (!query || query.trim() === "") {
            return [];  // frontend expects an array
        }

        const params = new URLSearchParams({ text: query });
        if (latitude !== null && longitude !== null) {
            params.append("latitude", latitude);
            params.append("longitude", longitude);
        }

        let url = `${API_BASE_URL}/autocomplete/restaurants?${params.toString()}`;

        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to fetch autocomplete suggestions");
        }
        return response.json();
    },

    async getYelpBusinessDetails(yelpId) {
        const response = await fetch(`${API_BASE_URL}/yelp/restaurants/${yelpId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to fetch business details");
        }
        return response.json();
    },

    async getLocalPicks(latitude, longitude, limit = 10) {
        const params = new URLSearchParams({ latitude, longitude, limit });
        const response = await fetch(`${API_BASE_URL}/recommendations/localpicks?${params}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to fetch local picks");
        }
        return response.json();
    }, 
    
    async addFavorite(restaurantId) {
        const url = `${API_BASE_URL}/favorites/${restaurantId}`;
        const response = await fetchWithAuth(url, { method: "POST" });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to add favorite");
        }
        return response.json();
    },

    async removeFavorite(restaurantId) {
        const url = `${API_BASE_URL}/favorites/${restaurantId}`;
        const response = await fetchWithAuth(url, { method: "DELETE" });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to remove favorite");
        }
    },

    async getUsersFavoritesList() {
        const url = `${API_BASE_URL}/users/me/favorites/ids`;
        const response = await fetchWithAuth(url, { method: "GET" });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to get favorites list");
        }
        return response.json();
    },

    async getSimilarRestaurants(restaurantId, limit = 5) {
        const params = new URLSearchParams({ limit });
        const url = `${API_BASE_URL}/restaurants/similar/${restaurantId}?${params}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to fetch similar restaurants");
        }
        return response.json();
    },


};
