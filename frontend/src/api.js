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

    async getAutoCompleteSuggestions(query) {
        if (!query || query.trim() === "") {
            return [];  // frontend expects an array
        }

        let url = `${API_BASE_URL}/autocomplete/restaurants?text=${encodeURIComponent(query)}`;

        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to fetch autocomplete suggestions");
        }
        return response.json();
    },

    async getLocalPicks(latitude, longitude, limit=10) {
        const params = new URLSearchParams({ latitude, longitude, limit });
        const response = await fetch(`${API_BASE_URL}/recommendations/nearby?${params}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to fetch local picks");
        }
        return response.json();
    }
};
