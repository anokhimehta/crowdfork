# crowdfork
fork around and find out

# Backend Stepup Instructions

1. Clone the Repository

    git clone <your-repo-url>
    cd crowdfork

2. Install Dependencies

    pip install -r requirements.txt

3. Configuration 
    Secret keys necesary to run the code are not stored on github and must be added manually.

    1. Yelp API key
        a. navigate to src/backend
        b. create a new file called .env
        c. add your api key in the file:
            YELP_API_KEY="instert_real_yelp_key_here"
        
    2. Firebase Service Account 
        a. make sure you have the serviceAccountKey.json for the Firebase Admin SDK (normally added by project admin)
        b. (Optional) If file not found, generate a new one from the Firebase Console -> Project Settings -> Service Accounts
        c. place file and src/backend folder and reminder that it must named exactly: serviceAccountKey.json 

4. Running the server
    cd src/backend
    uvicorn main:app --reload

(The server should start at http://127.0.0.1:8000)

5. API Documentation 
    Once the server is running, you access interative documentation/ testing tools

    Swagger UI: https://www.google.com/search?q=http://127.0.0.1:8000/docs

6. Key Endpoints

GET /search/restaurants?term=pizza&location=nyc - Search Yelp (Public)

POST /restaurants - Add a restaurant to internal DB

POST /signup - Create a new user

POST /login - Get an auth token




