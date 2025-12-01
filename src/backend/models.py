from typing import Annotated, Optional, List

from pydantic import BaseModel, Field, confloat


class SignUpSchema(BaseModel):
    email: str
    password: str
    name: str | None = None
    tagline: str | None = None
    location: str | None = None

    class Config:
        json_schema_extra = {
            "example": {"email": "sample@gmail.com", "password": "samplepassword123"}
        }


class LoginSchema(BaseModel):
    email: str
    password: str

    class Config:
        json_schema_extra = {
            "example": {"email": "sample@gmail.com", "password": "samplepassword123"}
        }


class Review(BaseModel):
    restaurant_id: str
    rating: float
    text: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "restaurant_id": "rest_123",
                "rating": 4.5,
                "text": "Great food and service!",
            }
        }


class ReviewCreate(BaseModel):
    restaurant_id: str
    rating: Annotated[float, confloat(ge=0, le=5)]  # overall rating
    food_rating: Annotated[float, confloat(ge=0, le=5)] | None = None
    ambience_rating: Annotated[float, confloat(ge=0, le=5)] | None = None
    service_rating: Annotated[float, confloat(ge=0, le=5)] | None = None

    text: str | None = None  # experience

    recommended_dishes: list[str] = Field(default_factory=list)
    price_range: str | None = None

    # class Config:
    #     json_schema_extra = {
    #         "example": {
    #             "rating": 4,
    #             "food_rating": 5,
    #             "ambience_rating": 4,
    #             "service_rating": 3,
    #             "text": "Amazing place, loved the pasta!",
    #             "recommended_dishes": ["Pesto Pasta", "Garlic Bread"],
    #             "price_range": "$10 - $20",
    #         }
    #     }


# class ReviewResponse(BaseModel):
#     id: str
#     restaurant_id: str
#     user_id: str
#     rating: float
#     text: Optional[str] = None
#     created_at: str


class ReviewResponse(BaseModel):
    id: str
    restaurant_id: str
    user_id: str
    user_name: Optional[str] = None
    rating: float
    text: Optional[str] = None
    food_rating: Optional[float] = None
    ambience_rating: Optional[float] = None
    service_rating: Optional[float] = None
    recommended_dishes: Optional[List[str]] = None
    price_range: Optional[str] = None
    created_at: str

    # class Config:
    #     json_schema_extra = {
    #         "example": {
    #             "id": "rev_001",
    #             "restaurant_id": "rest_123",
    #             "user_id": "user_456",
    #             "rating": 4.5,
    #             "food_rating": 5,
    #             "ambience_rating": 4,
    #             "service_rating": 4,
    #             "text": "Amazing pasta and great ambience!",
    #             "recommended_dishes": ["Pesto Pasta", "Garlic Bread"],
    #             "price_range": "$10 - $20",
    #             "created_at": "2025-11-29T20:23:13Z",
    #         }
    #     }


class Restaurant(BaseModel):
    name: str
    address: str
    cuisine_type: str | None = None
    description: str | None = None
    phone: str | None = None
    image_url: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Joe's Pizza",
                "address": "123 Main St, New York, NY",
                "cuisine_type": "Italian",
                "description": "Best pizza in town!",
                "phone": "+1-555-0123",
                "image_url": "http://example.com/image.jpg",
            }
        }


class RestaurantResponse(BaseModel):
    id: str
    name: str
    address: str
    cuisine_type: str | None = None
    description: str | None = None
    phone: str | None = None
    image_url: str | None = None
    created_at: str
    updated_at: str


class RestaurantUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    cuisine_type: str | None = None
    description: str | None = None
    phone: str | None = None
    image_url: str | None = None


class ReviewWithRestaurantInfo(BaseModel):
    # This is the ID of the review document
    review_id: str = Field(..., alias="id")

    # Original review data
    restaurant_id: str
    rating: int
    text: str
    created_at: str

    # New required field: The name of the restaurant
    restaurant_name: str


class UserUpdateSchema(BaseModel):
    name: str | None = None
    email: str | None = None
    tagline: str | None = None
    location: str | None = None
    image_url: str | None = None
