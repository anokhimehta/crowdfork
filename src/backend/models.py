from pydantic import BaseModel


class SignUpSchema(BaseModel):
    email: str
    password: str

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


class ReviewResponse(BaseModel):
    id: str
    restaurant_id: str
    user_id: str
    rating: float
    text: str | None = None
    created_at: str


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
