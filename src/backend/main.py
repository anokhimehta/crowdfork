from fastapi import FastAPI, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List, Any
import firebase_admin
from firebase_admin import credentials, auth, firestore
import pyrebase
from models import SignUpSchema, LoginSchema
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime

app = FastAPI()
security = HTTPBearer()

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

firebaseConfig = {
  "apiKey": "AIzaSyDw6RsSAJJr1Xje_i9qln7IRl0jNtn6WOM",
  "authDomain": "crowdfork-20da3.firebaseapp.com",
  "projectId": "crowdfork-20da3",
  "storageBucket": "crowdfork-20da3.firebasestorage.app",
  "messagingSenderId": "746301898335",
  "appId": "1:746301898335:web:1dc264ad6d6fdf7212e5ea",
  "measurementId": "G-MYLWSBY7EH",
  "databaseURL":""
}

firebase = pyrebase.initialize_app(firebaseConfig)

# Initialize Firestore
db = firestore.client()

class Review(BaseModel):
    restaurant_id: str
    rating: float
    text: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "restaurant_id": "rest_123",
                "rating": 4.5,
                "text": "Great food and service!"
            }
        }


class ReviewResponse(BaseModel):
    id: str
    restaurant_id: str
    user_id: str
    rating: float
    text: Optional[str] = None
    created_at: str



class Restaurant(BaseModel):
    name: str
    address: str
    cuisine_type: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Joe's Pizza",
                "address": "123 Main St, New York, NY",
                "cuisine_type": "Italian",
                "description": "Best pizza in town!",
                "phone": "+1-555-0123"
            }
        }


class RestaurantResponse(BaseModel):
    id: str
    name: str
    address: str
    cuisine_type: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    created_at: str
    updated_at: str


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    cuisine_type: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None



reviews = []


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
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

async def verify_restaurant_exists(restaurant_id: str) -> bool:
    """Check if restaurant exists in Firestore"""
    try:
        restaurant_ref = db.collection('restaurants').document(restaurant_id)
        restaurant = restaurant_ref.get()
        return restaurant.exists
    except Exception as e:
        print(f"Error checking restaurant: {e}")
        return False
    


@app.post('/signup')
async def create_an_account(user_data: SignUpSchema):
    email = user_data.email
    password = user_data.password
    try:
        user = auth.create_user(
            email = email,
            password = password
        )
        return JSONResponse(content={"message": f"User account successfully for User {user.uid}"},
                            status_code = 201)
    except auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=400,
            detail=f"Account already created for the email {email}"
        )



@app.post('/login')
async def create_access_token(user_data: LoginSchema):
    email = user_data.email
    password = user_data.password
    try:
        user = firebase.auth().sign_in_with_email_and_password(
            email = email,
            password = password
        )

        token = user['idToken']
        return JSONResponse(content = {"token": token}, status_code = 200)
    except:
        raise HTTPException(status_code=400, detail="Invalid username or password")

@app.post('/ping')
async def validate_token(request: Request):
    headers = request.headers
    jwt = headers.get('authorization')
    user = auth.verify_id_token(jwt)
    return user["uid"]

    

@app.get("/")
def root():
    return {"Hello": "Worlds"}


@app.post("/restaurants/{restaurant_id}/reviews", response_model=ReviewResponse)
async def create_review(
    restaurant_id: str,
    review: Review,
    current_user: dict = Depends(get_current_user)
) -> Any:
    """Create a review for a specific restaurant (requires authentication)"""
    
    # Verify the restaurant_id in the path matches the one in the body
    if review.restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=400,
            detail="Restaurant ID in path does not match the one in request body"
        )
    
    # Check if restaurant exists
    if not await verify_restaurant_exists(restaurant_id):
        raise HTTPException(
            status_code=404,
            detail=f"Restaurant with ID {restaurant_id} not found"
        )
    
    # Validate rating
    if review.rating < 0 or review.rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 0 and 5"
        )
    
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
        review_ref = db.collection('reviews').add(review_data)
        review_id = review_ref[1].id
        
        return ReviewResponse(
            id=review_id,
            **review_data
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create review: {str(e)}"
        )


@app.delete("/reviews/{review_id}")
async def delete_review(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a review (only the review author can delete)"""
    
    try:
        review_ref = db.collection('reviews').document(review_id)
        review = review_ref.get()
        
        if not review.exists:
            raise HTTPException(
                status_code=404,
                detail="Review not found"
            )
        
        review_data = review.to_dict()
        
        # Check if the current user is the author of the review
        if review_data['user_id'] != current_user["user_id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only delete your own reviews"
            )
        
        # Delete the review
        review_ref.delete()
        
        return JSONResponse(
            content={"message": "Review deleted successfully"},
            status_code=200
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete review: {str(e)}"
        )
    
@app.get("/users/me/reviews", response_model=List[ReviewResponse])
async def list_user_reviews(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get all reviews by the current logged-in user"""
    
    try:
        # Query reviews by this user
        reviews_ref = db.collection('reviews').where(
            'user_id', '==', current_user["user_id"]
        ).order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
        
        reviews = []
        for doc in reviews_ref.stream():
            review_data = doc.to_dict()
            reviews.append(ReviewResponse(
                id=doc.id,
                **review_data
            ))
        
        return reviews
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch reviews: {str(e)}"
        )

@app.get("/restaurant/{restaurant_id}/reviews", response_model=List[ReviewResponse])
async def list_user_reviews(
    restaurant_id: str,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    
    # Check if restaurant exists
    if not await verify_restaurant_exists(restaurant_id):
        raise HTTPException(
            status_code=404,
            detail=f"Restaurant with ID {restaurant_id} not found"
        )


    """Get all reviews by the current logged-in user"""
    
    try:
        # Query reviews by the restaurant
        reviews_ref = db.collection('reviews').where(
            'restaurant_id', '==', restaurant_id
        ).order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
        
        reviews = []
        for doc in reviews_ref.stream():
            review_data = doc.to_dict()
            reviews.append(ReviewResponse(
                id=doc.id,
                **review_data
            ))
        
        return reviews
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch reviews: {str(e)}"
        )
    

@app.post("/reviews", response_model=List[Review])
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
        raise HTTPException(status_code=404, detail="Item not found")
 


# ==================== RESTAURANT CRUD OPERATIONS ====================

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
        restaurant_ref = db.collection('restaurants').add(restaurant_data)
        restaurant_id = restaurant_ref[1].id
        
        return RestaurantResponse(
            id=restaurant_id,
            **restaurant_data
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create restaurant: {str(e)}"
        )


@app.get("/restaurants", response_model=List[RestaurantResponse])
async def list_restaurants(
    limit: int = 20,
    cuisine_type: Optional[str] = None
):
    """Get all restaurants (no authentication required for browsing)"""
    
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
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch restaurants: {str(e)}"
        )


@app.get("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(restaurant_id: str):
    """Get a specific restaurant by ID"""
    
    try:
        restaurant_ref = db.collection('restaurants').document(restaurant_id)
        restaurant = restaurant_ref.get()
        
        if not restaurant.exists:
            raise HTTPException(
                status_code=404,
                detail="Restaurant not found"
            )
        
        restaurant_data = restaurant.to_dict()
        return RestaurantResponse(
            id=restaurant.id,
            **restaurant_data
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch restaurant: {str(e)}"
        )


@app.put("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
async def update_restaurant(
    restaurant_id: str,
    restaurant_update: RestaurantUpdate
):
    """Update a restaurant (no authentication required)"""
    
    try:
        restaurant_ref = db.collection('restaurants').document(restaurant_id)
        restaurant = restaurant_ref.get()
        
        if not restaurant.exists:
            raise HTTPException(
                status_code=404,
                detail="Restaurant not found"
            )
        
        # Build update data
        update_data = {
            "updated_at": datetime.utcnow().isoformat()
        }
        
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
        
        return RestaurantResponse(
            id=restaurant_id,
            **restaurant_data
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update restaurant: {str(e)}"
        )


@app.delete("/restaurants/{restaurant_id}")
async def delete_restaurant(restaurant_id: str):
    """Delete a restaurant (no authentication required)"""
    
    try:
        restaurant_ref = db.collection('restaurants').document(restaurant_id)
        restaurant = restaurant_ref.get()
        
        if not restaurant.exists:
            raise HTTPException(
                status_code=404,
                detail="Restaurant not found"
            )
        
        # Delete all reviews associated with this restaurant first
        reviews_ref = db.collection('reviews').where('restaurant_id', '==', restaurant_id)
        for review in reviews_ref.stream():
            review.reference.delete()
        
        # Delete the restaurant
        restaurant_ref.delete()
        
        return JSONResponse(
            content={"message": "Restaurant and associated reviews deleted successfully"},
            status_code=200
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete restaurant: {str(e)}"
        )