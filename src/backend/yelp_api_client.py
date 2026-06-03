import os
from typing import Any

import httpx

# Load environment variables
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

YELP_API_KEY = os.getenv("YELP_API_KEY")
YELP_API_HOST = "https://api.yelp.com"
SEARCH_PATH = "/v3/businesses/search"
AUTOCOMPLETE_PATH = "/v3/autocomplete"
BUSINESS_DETAILS_PATH = "/v3/businesses"

# Warn if API key is not set
if not YELP_API_KEY:
    print(
        "Warning: YELP_API_KEY environment variable not set. Make sure .env file is in src/backend"
    )


# Yelp Search Query model
class YelpSearchQuery(BaseModel):
    """Pydantic model for Yelp search query parameters"""

    term: str = Field(..., description="Search term, e.g., 'pizza' or 'coffee'")
    location: str = Field(..., description="Location to search, e.g., 'New York City' or 'NYC'")
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
    distance: float | None = None
    coordinates: dict[str, float]
    location: dict[str, Any]
    url: str | None = None
    categories: list[dict[str, str]] = []


# Response model for Yelp search
class YelpSearchResponse(BaseModel):
    businesses: list[YelpBusiness]
    total: int
    region: dict[str, Any]


# Response model for Yelp autocomplete
class YelpAutocompleteResponse(BaseModel):
    terms: list[dict[str, str]]
    businesses: list[dict[str, Any]]
    categories: list[dict[str, Any]]


# Yelp Business Detail model
class YelpBusinessDetail(BaseModel):
    id: str
    name: str
    image_url: str | None = None
    url: str | None = None
    phone: str = ""
    display_phone: str = ""
    review_count: int
    categories: list[dict[str, Any]] = []
    rating: float
    location: dict[str, Any]
    coordinates: dict[str, float]
    photos: list[str] = []  # Multiple photos!
    price: str | None = None
    hours: list[dict[str, Any]] = []
    is_closed: bool


# Function to search Yelp API
async def search_yelp(
    term: str | None = None,
    location: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    sort_by: str | None = None,
    attributes: str | None = None,
    limit: int = 10,
) -> YelpSearchResponse:
    url = f"{YELP_API_HOST}{SEARCH_PATH}"
    headers = {"Authorization": f"Bearer {YELP_API_KEY}"}

    params = {"limit": limit}
    if term:
        params["term"] = term
    if location:
        params["location"] = location
    if latitude and longitude:
        params["latitude"] = latitude
        params["longitude"] = longitude
    if sort_by:
        params["sort_by"] = sort_by
    if attributes:
        params["attributes"] = attributes

    # async with httpx.AsyncClient() as client:
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)
    response.raise_for_status()
    data = response.json()
    return YelpSearchResponse(**data)


# Function to autocomplete Yelp API
async def autocomplete_yelp(
    text: str, latitude: float | None = None, longitude: float | None = None
) -> YelpAutocompleteResponse:
    url = f"{YELP_API_HOST}{AUTOCOMPLETE_PATH}"
    headers = {"Authorization": f"Bearer {YELP_API_KEY}"}

    params = {"text": text}
    if latitude is not None and longitude is not None:
        params["latitude"] = latitude
        params["longitude"] = longitude

    # async with httpx.AsyncClient() as client:
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)
    response.raise_for_status()
    data = response.json()
    return YelpAutocompleteResponse(**data)


# Function to get business details by ID
async def get_business_details(yelp_id: str) -> YelpBusinessDetail:
    """
    Get full details for a specific business by ID.
    Includes photos, hours, price, etc.
    """
    if not YELP_API_KEY:
        raise Exception("YELP_API_KEY is not configured.")

    # Endpoint: /v3/businesses/{id}
    url = f"{YELP_API_HOST}{BUSINESS_DETAILS_PATH}/{yelp_id}?locale=en_US"
    headers = {"Authorization": f"Bearer {YELP_API_KEY}"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            if not data.get("photos") or len(data["photos"]) == 0:
                if data.get("image_url"):
                    data["photos"] = [data["image_url"]]

            return YelpBusinessDetail(**data)
        except Exception as e:
            print(f"Yelp Detail Error: {e}")
            raise e


# Example usage
if __name__ == "__main__":
    try:
        search_result = search_yelp("coffee", "San Francisco, CA", limit=5)
        for business in search_result.businesses:
            print(f"{business.name} - {business.rating} stars")
    except httpx.HTTPError as e:
        print(f"An error occurred: {e}")
