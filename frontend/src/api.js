const API_BASE_URL = "http://127.0.0.1:8000";

export const api = {
    baseUrl: API_BASE_URL,

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

    async searchRestaurants(term, location) {
        const params = new URLSearchParams({ term, location });
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
    }
};
