from fastapi import FastAPI, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import Optional, List, Any

from fastapi.requests import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from datetime import datetime
import firebase_admin
import firebaseconfig as firebaseconfig
import pyrebase
from dotenv import load_dotenv

from firebase_admin import auth, credentials, firestore
from models import (
    LoginSchema,
    Restaurant,
    RestaurantResponse,
    RestaurantUpdate,
    Review,
    ReviewResponse,
    ReviewWithRestaurantInfo,
    SignUpSchema,
    UserUpdateSchema,
    
)
from yelp_api_client import (
    YelpAutocompleteResponse,
    YelpSearchResponse,
    autocomplete_yelp,
    search_yelp,
    YelpSearchQuery,
    YelpBusinessDetail,
    get_business_details
)
from typing import List, Optional

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Add CORS middleware

origins = [
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
    "*",  # Allow all for now to be safe
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
    except auth.InvalidIdTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token. Please login again.",
        ) from err
    except auth.ExpiredIdTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please login again.",
        ) from err
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Please login.",
        ) from err


# Create a new user account
@app.post("/signup")
async def create_an_account(user_data: SignUpSchema):
    email = user_data.email
    password = user_data.password
    # image_url = user_data.image_url
    name = user_data.name
    tagline = user_data.tagline
    location = user_data.location
    current_time = datetime.utcnow().isoformat()
    
    try:
        user = auth.create_user(email=email, password=password)
        
        user_doc_ref = db.collection("users").document(user.uid)
        user_doc_ref.set({
            "email": email,
            "favorites": [], 
            "created_at": datetime.utcnow().isoformat(),
            # "image_url": image_url,
            "name": name,
            "tagline": tagline,
            "location": location,
            "created_at": current_time, 
            "joined_date": current_time,
            
            
        })
        
        return JSONResponse(
            content={"message": f"User account successfully for User {user.uid}"},
            status_code=201,
        )
    except auth.EmailAlreadyExistsError as err:
        raise HTTPException(
            status_code=400, detail=f"Account already created for the email {email}"
        ) from err


# Create a login token for existing user
@app.post("/login")
async def create_access_token(user_data: LoginSchema):
    email = user_data.email
    password = user_data.password
    try:
        user = firebase.auth().sign_in_with_email_and_password(email=email, password=password)

        token = user["idToken"]
        return JSONResponse(content={"token": token}, status_code=200)
    except Exception as err:
        raise HTTPException(status_code=400, detail="Invalid username or password") from err


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


# --------------- Favorite Restaurants Operations ----------------

@app.get("/users/me/favorites/ids")
async def list_user_favorite_ids(current_user: dict = Depends(get_current_user)):
    """
    Retrieves a list of all restaurant IDs saved as favorites by the current user.
    """
    user_id = current_user["user_id"]
    
    try:
        user_doc = db.collection("users").document(user_id).get()

        if not user_doc.exists:
            return {"favorite_ids": []}
        
        favorite_ids = user_doc.to_dict().get("favorites", [])
        print(f"Favorite IDs for user {user_id}: {favorite_ids}")
        
        return {"favorite_ids": favorite_ids}
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch favorite IDs: {str(e)}"
        ) from e
@app.post("/favorites/{restaurant_id}")
async def add_favorite_restaurant(
    restaurant_id: str, current_user: dict = Depends(get_current_user)
):
    """Adds a restaurant ID to the user's favorites list."""
    user_id = current_user["user_id"]
    user_doc_ref = db.collection("users").document(user_id)

    try:
        # Check if restaurant exists 
        # if not await verify_restaurant_exists(restaurant_id):
        #     raise HTTPException(status_code=404, detail="Restaurant not found in local DB")

        # Use Firestore Array Union to safely add the ID if it's not already there
        user_doc_ref.update({
            "favorites": firestore.ArrayUnion([restaurant_id])
        })

        return JSONResponse(
            content={"message": f"Restaurant {restaurant_id} added to favorites"}, 
            status_code=200
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add favorite: {str(e)}")

@app.delete("/favorites/{restaurant_id}")
async def remove_favorite_restaurant(
    restaurant_id: str, current_user: dict = Depends(get_current_user)
):
    """Removes a restaurant ID from the user's favorites list."""
    user_id = current_user["user_id"]
    user_doc_ref = db.collection("users").document(user_id)

    try:
        # Use Firestore Array Remove to safely remove the ID
        user_doc_ref.update({
            "favorites": firestore.ArrayRemove([restaurant_id])
        })

        return JSONResponse(
            content={"message": f"Restaurant {restaurant_id} removed from favorites"}, 
            status_code=200
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove favorite: {str(e)}")
#--------------- User Profile Operations ----------------

@app.put("/users/me")
async def update_user_profile(
    user_update: UserUpdateSchema, current_user: dict = Depends(get_current_user)
):
    """Update the current user's profile details in Firestore."""
    user_id = current_user["user_id"]
    user_doc_ref = db.collection("users").document(user_id)
    
    update_data = {}

    # Map frontend fields to Firestore fields
    if user_update.name is not None:
        update_data["name"] = user_update.name
    if user_update.tagline is not None:
        update_data["tagline"] = user_update.tagline
    if user_update.location is not None:
        update_data["location"] = user_update.location
    if user_update.image_url is not None:
        update_data["image_url"] = user_update.image_url

    # Handle Email Change (Requires Firebase Auth update)
    if user_update.email is not None and user_update.email != current_user["email"]:
        try:
            auth.update_user(user_id, email=user_update.email)
            update_data["email"] = user_update.email
        except auth.EmailAlreadyExistsError:
            raise HTTPException(status_code=400, detail="Email is already in use by another account.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to update email in Auth: {str(e)}")

    if not update_data:
        return JSONResponse(content={"message": "No data provided for update."}, status_code=200)

    try:
        user_doc_ref.update(update_data)
        
        updated_doc = user_doc_ref.get().to_dict()
        return {**current_user, **updated_doc} # Merge current token info with new Firestore data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}") from e

@app.get("/users/me")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the profile information of the current logged-in user, 
    including new fields from Firestore.
    """
    user_id = current_user["user_id"]
    user_doc = db.collection("users").document(user_id).get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User profile data missing")

    user_data = user_doc.to_dict()

    return {
        "user_id": user_id,
        "email": current_user["email"],
        "name": user_data.get("name"),
        "tagline": user_data.get("tagline"),
        "location": user_data.get("location"),
        "joined_date": user_data.get("joined_date"),
        "image_url": user_data.get("image_url"),
    }

@app.get("/users/me/reviews/count")
async def get_user_reviews_count(current_user: dict = Depends(get_current_user)):
    """
    Get the total count of reviews posted by the current logged-in user.
    """
    user_id = current_user["user_id"]

    try:

        reviews_ref = db.collection("reviews").where("user_id", "==", user_id)
    
        count = 0
        for _ in reviews_ref.stream():
            count += 1
            
        return {"reviewCount": count}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch review count: {str(e)}") from e
    

@app.get("/users/me/favorites", response_model=List[RestaurantResponse])
async def list_user_favorites(current_user: dict = Depends(get_current_user)):
    """
    Get all favorite restaurants (details) for the current logged-in user.
    """
    user_id = current_user["user_id"]
    
    try:
        # 1. Fetch the user document to get the list of favorite IDs
        user_doc = db.collection("users").document(user_id).get()
        if not user_doc.exists:
            # This should ideally not happen if signup is successful
            raise HTTPException(status_code=404, detail="User profile not found")
            
        favorite_ids = user_doc.to_dict().get("favorites", [])
        
        if not favorite_ids:
            return [] # User has no favorites

        # 2. Batch fetch restaurant details for each favorited ID
        restaurant_refs = [db.collection("restaurants").document(rid) for rid in favorite_ids]
        
        favorite_restaurants = []
        fetched_restaurants = db.get_all(restaurant_refs)
        
        # 3. Compile the response
        for doc in fetched_restaurants:
            if doc.exists:
                data = doc.to_dict()
                favorite_restaurants.append(RestaurantResponse(id=doc.id, **data))
        
        return favorite_restaurants
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch favorites: {str(e)}")
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch from Yelp: {str(e)}") from e


@app.get("/recommendations/nearby", response_model=YelpSearchResponse)
async def get_local_picks(latitude: float, longitude: float, limit: int = 10):
    """
    Local Picks - gets highly rated places nearby without a search term.
    """
    try:
        # We call search_yelp but without a 'term', and sort by rating
        return await search_yelp(
            latitude=latitude, longitude=longitude, sort_by="rating", limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


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
            status_code=500,  # error can vary based on issue (text too short, etc)
            detail=f"Autocomplete failed: {str(e)}",
        ) from e


@app.get("/yelp/restaurants/{yelp_id}", response_model=YelpBusinessDetail)
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

@app.get("/recommendations/localpicks", response_model=YelpSearchResponse)
async def get_localpicks_restaurants(
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
        raise HTTPException(status_code=500, detail=f"Failed to create review: {str(e)}") from e


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
        raise HTTPException(status_code=500, detail=f"Failed to delete review: {str(e)}") from e



@app.get("/users/me/reviews", response_model=List[ReviewWithRestaurantInfo])
async def list_user_reviews(limit: int = 10, current_user: dict = Depends(get_current_user)):
    """
    Get all reviews by the current logged-in user, including the restaurant name.
    """
    user_id = current_user["user_id"]

    try:
        reviews_ref = (
            db.collection("reviews")
            .where("user_id", "==", user_id)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )
        review_docs = list(reviews_ref.stream())

        if not review_docs:
            return []

        restaurant_ids = list(set(doc.to_dict()["restaurant_id"] for doc in review_docs))

        restaurant_map = {}
        restaurant_refs = [db.collection("restaurants").document(rid) for rid in restaurant_ids]
        
        fetched_restaurants = db.get_all(restaurant_refs)
        for doc in fetched_restaurants:
            if doc.exists:
                restaurant_map[doc.id] = doc.to_dict().get("name", "Unknown Restaurant")

        enhanced_reviews = []
        for doc in review_docs:
            review_data = doc.to_dict()
            restaurant_id = review_data["restaurant_id"]
            
            enhanced_reviews.append(
                ReviewWithRestaurantInfo(
                    id=doc.id, # Map to review_id in the Pydantic model
                    restaurant_id=restaurant_id,
                    restaurant_name=restaurant_map.get(restaurant_id, "Deleted Restaurant"),
                    rating=review_data["rating"],
                    text=review_data["text"],
                    created_at=review_data["created_at"],
                )
            )

        return enhanced_reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user's reviews: {str(e)}") from e


@app.get("/restaurants/{restaurant_id}/reviews", response_model=List[ReviewResponse])
async def list_restaurant_reviews(
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviews: {str(e)}") from e


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
        raise HTTPException(status_code=500, detail=f"Failed to create restaurant: {str(e)}") from e


@app.get("/restaurants", response_model=List[RestaurantResponse])
async def list_restaurants(limit: int = 20, cuisine_type: Optional[str] = None, location: str = "NYC"):
    """Get all restaurants from local db (no authentication required for browsing)"""

    try:
        # try:
        #     query = db.collection("restaurants")

        #     # Filter by cuisine type if provided
        #     if cuisine_type:
        #         query = query.where("cuisine_type", "==", cuisine_type)

        #     query = query.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)

        #     restaurants = []
        #     for doc in query.stream():
        #         restaurant_data = doc.to_dict()
        #         restaurants.append(RestaurantResponse(id=doc.id, **restaurant_data))

        #     return restaurants
        # except Exception as db_error:
        #     print(f"Firestore error: {db_error}. Falling back to Yelp.")
        #     # Fallback to Yelp
        term = "restaurants"
        if cuisine_type:
            term = cuisine_type

        yelp_results = await search_yelp(term="restaurants", location=location, limit=limit)

        mapped_restaurants: list[RestaurantResponse] = []
        for business in yelp_results.businesses:
            # Map Yelp business to RestaurantResponse
            address = ", ".join(business.location.get("display_address", []))
            cuisine = "Unknown"
            if business.categories:
                cuisine = business.categories[0].get("title", "Unknown")

            mapped_restaurants.append(
                RestaurantResponse(
                    id=business.id,
                    name=business.name,
                    address=address,
                    cuisine_type=cuisine,
                    description=f"Rating: {business.rating}",
                    phone=business.phone,
                    image_url=business.image_url,
                    created_at=datetime.utcnow().isoformat(),
                    updated_at=datetime.utcnow().isoformat(),
                )
            )
        return mapped_restaurants

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch restaurants: {str(e)}") from e

# we don't need this
# @app.get("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
# async def get_restaurant(restaurant_id: str):
#     """Get a specific restaurant by ID from local db (no authentication required)"""

#     try:
#         restaurant_ref = db.collection("restaurants").document(restaurant_id)
#         restaurant = restaurant_ref.get()

#         if not restaurant.exists:
#             raise HTTPException(status_code=404, detail="Restaurant not found")

#         restaurant_data = restaurant.to_dict()
#         return RestaurantResponse(id=restaurant.id, **restaurant_data)
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch restaurant: {str(e)}") from e


# @app.put("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
# async def update_restaurant(restaurant_id: str, restaurant_update: RestaurantUpdate):
#     """Update a restaurant (no authentication required)"""

#     try:
#         restaurant_ref = db.collection("restaurants").document(restaurant_id)
#         restaurant = restaurant_ref.get()

#         if not restaurant.exists:
#             raise HTTPException(status_code=404, detail="Restaurant not found")

#         # Build update data from non-None feilds
#         update_data = {"updated_at": datetime.utcnow().isoformat()}

#         if restaurant_update.name is not None:
#             update_data["name"] = restaurant_update.name
#         if restaurant_update.address is not None:
#             update_data["address"] = restaurant_update.address
#         if restaurant_update.cuisine_type is not None:
#             update_data["cuisine_type"] = restaurant_update.cuisine_type
#         if restaurant_update.description is not None:
#             update_data["description"] = restaurant_update.description
#         if restaurant_update.phone is not None:
#             update_data["phone"] = restaurant_update.phone

#         # Update in Firestore
#         restaurant_ref.update(update_data)

#         # Fetch updated restaurant
#         updated_restaurant = restaurant_ref.get()
#         restaurant_data = updated_restaurant.to_dict()

#         return RestaurantResponse(id=restaurant_id, **restaurant_data)
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to update restaurant: {str(e)}") from e


# @app.delete("/restaurants/{restaurant_id}")
# async def delete_restaurant(restaurant_id: str):
#     """Delete a restaurant (no authentication required)"""

#     try:
#         restaurant_ref = db.collection("restaurants").document(restaurant_id)
#         restaurant = restaurant_ref.get()

#         if not restaurant.exists:
#             raise HTTPException(status_code=404, detail="Restaurant not found")

#         # Delete all reviews associated with this restaurant first
#         reviews_ref = db.collection("reviews").where("restaurant_id", "==", restaurant_id)
#         for review in reviews_ref.stream():
#             review.reference.delete()

#         # Delete the restaurant
#         restaurant_ref.delete()

#         return JSONResponse(
#             content={"message": "Restaurant and associated reviews deleted successfully"},
#             status_code=200,
#         )
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to delete restaurant: {str(e)}") from e
