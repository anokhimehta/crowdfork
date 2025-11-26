import httpx
import os
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Load environment variables
from dotenv import load_dotenv

load_dotenv()

YELP_API_KEY = os.getenv("YELP_API_KEY")
YELP_API_HOST = "https://api.yelp.com"
SEARCH_PATH = "/v3/businesses/search"

# Warn if API key is not set
if not YELP_API_KEY:
    print(
        "Warning: YELP_API_KEY environment variable not set. Make sure .env file is in src/backend"
    )


# Yelp Search Query model
class YelpSearchQuery(BaseModel):
    """Pydantic model for Yelp search query parameters"""

    term: str = Field(..., description="Search term, e.g., 'pizza' or 'coffee'")
    location: str = Field(
        ..., description="Location to search, e.g., 'New York City' or 'NYC'"
    )
    limit: int = 20


# Yelp Business model
class YelpBusiness(BaseModel):
    id: str
    name: str
    image_url: str
    is_closed: bool
    review_count: int
    rating: float
    phone: str
    display_phone: str
    distance: Optional[float] = None
    coordinates: Dict[str, float]
    location: Dict[str, Any]
    url: Optional[str] = None


# Response model for Yelp search
class YelpSearchResponse(BaseModel):
    businesses: List[YelpBusiness]
    total: int
    region: Dict[str, Any]


# Function to search Yelp API
async def search_yelp(term: str, location: str, limit: int = 10) -> YelpSearchResponse:
    url = f"{YELP_API_HOST}{SEARCH_PATH}"
    headers = {"Authorization": f"Bearer {YELP_API_KEY}"}
    params = {"term": term, "location": location, "limit": limit}
    response = httpx.get(url, headers=headers, params=params)
    response.raise_for_status()
    data = response.json()
    return YelpSearchResponse(**data)


# Example usage
if __name__ == "__main__":
    try:
        search_result = search_yelp("coffee", "San Francisco, CA", limit=5)
        for business in search_result.businesses:
            print(f"{business.name} - {business.rating} stars")
    except httpx.HTTPError as e:
        print(f"An error occurred: {e}")
