from fastapi import FastAPI, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import Optional, List, Any
import firebase_admin
from firebase_admin import credentials, auth, firestore
import pyrebase
from models import SignUpSchema, LoginSchema, Review, ReviewResponse, Restaurant, RestaurantResponse, RestaurantUpdate
from yelp_api_client import (
    search_yelp, YelpSearchResponse, YelpSearchQuery, 
    autocomplete_yelp, YelpAutocompleteResponse,
    YelpBusinessDetail, get_business_details
)
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime
import firebaseconfig as firebaseconfig
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Add CORS middleware
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
    "*" # Allow all for now to be safe
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows specific origins
    allow_credentials=True,  # Allows cookies and authorization headers
    allow_methods=["*"],  # Allows all HTTP methods (POST, GET, etc.)
    allow_headers=["*"],  # Allows all request headers
)


security = HTTPBearer()

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")  # add your service account key
    firebase_admin.initialize_app(cred)

# Initialize Pyrebase for authentication
firebase = pyrebase.initialize_app(firebaseconfig.firebaseConfig)

# Initialize Firestore
db = firestore.client()

reviews = []

# --------- Auth Related Functions ---------


# (Auth) Dependency to get current user from Firebase ID token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Verify Firebase ID token and return user info"""
    token = credentials.credentials
    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(token)
        return {
            "user_id": decoded_token["uid"],
            "email": decoded_token.get("email", ""),
        }
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token. Please login again.",
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please login again.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Please login.",
        )


# Create a new user account
@app.post("/signup")
async def create_an_account(user_data: SignUpSchema):
    email = user_data.email
    password = user_data.password
    try:
        user = auth.create_user(email=email, password=password)
        return JSONResponse(
            content={"message": f"User account successfully for User {user.uid}"},
            status_code=201,
        )
    except auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=400, detail=f"Account already created for the email {email}"
        )


# Create a login token for existing user
@app.post("/login")
async def create_access_token(user_data: LoginSchema):
    email = user_data.email
    password = user_data.password
    try:
        user = firebase.auth().sign_in_with_email_and_password(email=email, password=password)

        token = user["idToken"]
        return JSONResponse(content={"token": token}, status_code=200)
    except:
        raise HTTPException(status_code=400, detail="Invalid username or password")


# This might be an unused/unnecssary endpoint, similar to get_current_user
"""@app.post('/ping')
async def validate_token(request: Request):
    headers = request.headers
    jwt = headers.get('authorization')
    user = auth.verify_id_token(jwt)
    return user["uid"]"""


@app.get("/")
def root():
    return {"Hello": "Worlds"}


# ------------------ Yelp API Integration ---------------------


@app.get("/search/restaurants", response_model=YelpSearchResponse)
async def search_restaurants_yelp(
    term: str = Query(..., description="Search term, e.g., 'pizza'"),
    location: str = Query(..., description="Location, e.g., 'NYC' or 'San Francisco'"),
):
    """
    Search for restaurants using the Yelp API.
    """
    try:
        yelp_results = await search_yelp(term=term, location=location, limit=20)
        return yelp_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch from Yelp: {str(e)}")


@app.get("/recommendations/nearby", response_model=YelpSearchResponse)
async def get_local_picks(
    latitude: float,
    longitude: float,
    limit: int = 10
):
    """
    Local Picks - gets highly rated places nearby without a search term.
    """
    try:
        # We call search_yelp but without a 'term', and sort by rating
        return await search_yelp(
            latitude=latitude, 
            longitude=longitude, 
            sort_by="rating",
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/autocomplete/restaurants", response_model=YelpAutocompleteResponse)
async def autocomplete_restaurants_yelp(
    text: str = Query(..., min_length=1, description="Partial text to autocomplete, e.g., 'piz'"),
    latitude: Optional[float] = Query(None, description="Latitude for location biasing"),
    longitude: Optional[float] = Query(None, description="Longitude for location biasing")
):
    """
    Autocomplete keywords/category/resturant names using the Yelp API.
    """
    try:
        yelp_results = await autocomplete_yelp(text=text, latitude=latitude, longitude=longitude)
        return yelp_results
    except Exception as e:
        raise HTTPException(
            status_code=500, # error can vary based on issue (text too short, etc)
            detail=f"Autocomplete failed: {str(e)}" 
        )

@app.get("/search/restaurants/{yelp_id}", response_model=YelpBusinessDetail)
async def get_yelp_business_details(yelp_id: str):
    """
    Get full details for a specific restaurant from Yelp.
    Used when a user clicks on a search result.
    """
    try:
        return await get_business_details(yelp_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch details from Yelp: {str(e)}"
        )

@app.get("/recommendations/trending", response_model=YelpSearchResponse)
async def get_trending_restaurants(
    latitude: float,
    longitude: float,
    limit: int = 10
):
    """
    Find restaurant to populate "Top Picks" in search page
    Uses Yelp's 'hot_and_new' attribute to find trending places.
    """
    try:
        return await search_yelp(
            latitude=latitude,
            longitude=longitude,
            attributes="hot_and_new", # popular businesses which recently joined Yelp
            sort_by="best_match",
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------- Helper function to verify restaurant existence ----------


async def verify_restaurant_exists(restaurant_id: str) -> bool:
    """Check if restaurant exists in Firestore"""
    try:
        restaurant_ref = db.collection("restaurants").document(restaurant_id)
        restaurant = restaurant_ref.get()
        return restaurant.exists
    except Exception as e:
        print(f"Error checking restaurant: {e}")
        return False


# -------------- Crud Operations for Reviews ----------------


@app.post("/restaurants/{restaurant_id}/reviews", response_model=ReviewResponse)
async def create_review(
    restaurant_id: str, review: Review, current_user: dict = Depends(get_current_user)
) -> Any:
    """Create a review for a specific restaurant (requires authentication)"""

    # Verify the restaurant_id in the path matches the one in the body
    if review.restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=400,
            detail="Restaurant ID in path does not match the one in request body",
        )

    # Check if restaurant exists
    if not await verify_restaurant_exists(restaurant_id):
        raise HTTPException(status_code=404, detail=f"Restaurant with ID {restaurant_id} not found")

    # Validate rating
    if review.rating < 0 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 0 and 5")

    # Create review
    try:
        review_data = {
            "restaurant_id": restaurant_id,
            "user_id": current_user["user_id"],
            "rating": review.rating,
            "text": review.text,
            "created_at": datetime.utcnow().isoformat(),
        }

        # Add to Firestore
        review_ref = db.collection("reviews").add(review_data)
        review_id = review_ref[1].id

        return ReviewResponse(id=review_id, **review_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create review: {str(e)}")


@app.delete("/reviews/{review_id}")
async def delete_review(review_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a review (only the review author can delete)"""

    try:
        review_ref = db.collection("reviews").document(review_id)
        review = review_ref.get()

        if not review.exists:
            raise HTTPException(status_code=404, detail="Review not found")

        review_data = review.to_dict()

        # Check if the current user is the author of the review
        if review_data["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="You can only delete your own reviews")

        # Delete the review
        review_ref.delete()

        return JSONResponse(content={"message": "Review deleted successfully"}, status_code=200)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete review: {str(e)}")


@app.get("/users/me/reviews", response_model=List[ReviewResponse])
async def list_user_reviews(limit: int = 10, current_user: dict = Depends(get_current_user)):
    """Get all reviews by the current logged-in user"""

    try:
        # Query reviews by this user
        reviews_ref = (
            db.collection("reviews")
            .where("user_id", "==", current_user["user_id"])
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )

        reviews = []
        for doc in reviews_ref.stream():
            review_data = doc.to_dict()
            reviews.append(ReviewResponse(id=doc.id, **review_data))

        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviews: {str(e)}")


@app.get("/restaurants/{restaurant_id}/reviews", response_model=List[ReviewResponse])
async def list_user_reviews(
    restaurant_id: str, limit: int = 10, current_user: dict = Depends(get_current_user)
):
    # Check if restaurant exists
    if not await verify_restaurant_exists(restaurant_id):
        raise HTTPException(status_code=404, detail=f"Restaurant with ID {restaurant_id} not found")

    """Get all reviews by the current logged-in user"""

    try:
        # Query reviews by the restaurant
        reviews_ref = (
            db.collection("reviews")
            .where("restaurant_id", "==", restaurant_id)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )

        reviews = []
        for doc in reviews_ref.stream():
            review_data = doc.to_dict()
            reviews.append(ReviewResponse(id=doc.id, **review_data))

        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviews: {str(e)}")


# in memory reviews list for testing purpose?? can be removed later
"""@app.post("/reviews", response_model=List[Review])
def create_review(review: Review) -> Any:
    reviews.append(review)
    return reviews

@app.get("/reviews", response_model=List[Review])
def list_reviews(limit: int = 10):
    return reviews[0: limit]

@app.get("/reviews/{review_id}", response_model=Review)
def get_review(review_id: int) -> Any:
    if review_id < len(reviews):
        return reviews[review_id]
    else:
        raise HTTPException(status_code=404, detail="Item not found")"""


# --------------- Crud Operations for Restaurants ----------------
# Resturant crated in the system, no connection to Yelp API data
# No authentication required for restaurant operations


@app.post("/restaurants", response_model=RestaurantResponse, status_code=201)
async def create_restaurant(restaurant: Restaurant):
    """Create a new restaurant (no authentication required)"""

    try:
        restaurant_data = {
            "name": restaurant.name,
            "address": restaurant.address,
            "cuisine_type": restaurant.cuisine_type,
            "description": restaurant.description,
            "phone": restaurant.phone,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        # Add to Firestore
        restaurant_ref = db.collection("restaurants").add(restaurant_data)
        restaurant_id = restaurant_ref[1].id

        return RestaurantResponse(id=restaurant_id, **restaurant_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create restaurant: {str(e)}")


@app.get("/restaurants", response_model=List[RestaurantResponse])
async def list_restaurants(limit: int = 20, cuisine_type: Optional[str] = None):
    """Get all restaurants from local db (no authentication required for browsing)"""

    try:
        try:
            query = db.collection('restaurants')
            
            # Filter by cuisine type if provided
            if cuisine_type:
                query = query.where('cuisine_type', '==', cuisine_type)
            
            query = query.order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
            
            restaurants = []
            for doc in query.stream():
                restaurant_data = doc.to_dict()
                restaurants.append(RestaurantResponse(
                    id=doc.id,
                    **restaurant_data
                ))
            
            return restaurants
        except Exception as db_error:
            print(f"Firestore error: {db_error}. Falling back to Yelp.")
            # Fallback to Yelp
            yelp_results = await search_yelp(term="restaurants", location="NYC", limit=limit)
            
            mapped_restaurants = []
            for business in yelp_results.businesses:
                # Map Yelp business to RestaurantResponse
                address = ", ".join(business.location.get("display_address", []))
                cuisine = "Unknown"
                if business.categories:
                    cuisine = business.categories[0].get("title", "Unknown")
                
                mapped_restaurants.append(RestaurantResponse(
                    id=business.id,
                    name=business.name,
                    address=address,
                    cuisine_type=cuisine,
                    description=f"Rating: {business.rating}",
                    phone=business.phone,
                    image_url=business.image_url,
                    created_at=datetime.utcnow().isoformat(),
                    updated_at=datetime.utcnow().isoformat()
                ))
            return mapped_restaurants

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch restaurants: {str(e)}")


@app.get("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(restaurant_id: str):
    """Get a specific restaurant by ID from local db (no authentication required)"""

    try:
        restaurant_ref = db.collection("restaurants").document(restaurant_id)
        restaurant = restaurant_ref.get()

        if not restaurant.exists:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        restaurant_data = restaurant.to_dict()
        return RestaurantResponse(id=restaurant.id, **restaurant_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch restaurant: {str(e)}")


@app.put("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
async def update_restaurant(restaurant_id: str, restaurant_update: RestaurantUpdate):
    """Update a restaurant (no authentication required)"""

    try:
        restaurant_ref = db.collection("restaurants").document(restaurant_id)
        restaurant = restaurant_ref.get()

        if not restaurant.exists:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        # Build update data from non-None feilds
        update_data = {"updated_at": datetime.utcnow().isoformat()}

        if restaurant_update.name is not None:
            update_data["name"] = restaurant_update.name
        if restaurant_update.address is not None:
            update_data["address"] = restaurant_update.address
        if restaurant_update.cuisine_type is not None:
            update_data["cuisine_type"] = restaurant_update.cuisine_type
        if restaurant_update.description is not None:
            update_data["description"] = restaurant_update.description
        if restaurant_update.phone is not None:
            update_data["phone"] = restaurant_update.phone

        # Update in Firestore
        restaurant_ref.update(update_data)

        # Fetch updated restaurant
        updated_restaurant = restaurant_ref.get()
        restaurant_data = updated_restaurant.to_dict()

        return RestaurantResponse(id=restaurant_id, **restaurant_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update restaurant: {str(e)}")


@app.delete("/restaurants/{restaurant_id}")
async def delete_restaurant(restaurant_id: str):
    """Delete a restaurant (no authentication required)"""

    try:
        restaurant_ref = db.collection("restaurants").document(restaurant_id)
        restaurant = restaurant_ref.get()

        if not restaurant.exists:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        # Delete all reviews associated with this restaurant first
        reviews_ref = db.collection("reviews").where("restaurant_id", "==", restaurant_id)
        for review in reviews_ref.stream():
            review.reference.delete()

        # Delete the restaurant
        restaurant_ref.delete()

        return JSONResponse(
            content={"message": "Restaurant and associated reviews deleted successfully"},
            status_code=200,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete restaurant: {str(e)}")
