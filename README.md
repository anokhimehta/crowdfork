# 🍴 Crowdfork

A full-stack restaurant discovery and review app. Search for restaurants powered by the Yelp API, save your favorites, write reviews, and explore local picks near you.
---

## Project Structure

```
crowdfork/
├── src/
│   └── backend/
│       ├── main.py              # FastAPI app & all API routes
│       ├── models.py            # Pydantic data models
│       ├── yelp_api_client.py   # Yelp API integration
│       ├── firebaseconfig.py    # Firebase configuration
│       └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/               # React page components
│       │   ├── Landing.jsx
│       │   ├── Login.jsx
│       │   ├── SignUp.jsx
│       │   ├── Search.jsx
│       │   ├── Restaurant.jsx
│       │   ├── ReviewForm.jsx
│       │   ├── Saved.jsx
│       │   └── Profile.jsx
│       ├── App.jsx              # Routes
│       ├── api.js               # API client
│       └── main.jsx
├── pyproject.toml
└── README.md
```
---

## Features

- **Restaurant Search** — Search by keyword and location (or use your current coordinates) with autocomplete suggestions
- **Local Picks** — Discover trending and highly-rated restaurants near you
- **Restaurant Details** — View full details including photos, ratings, hours, and similar restaurants
- **User Reviews** — Write and delete reviews for restaurants (authenticated users only)
- **Favorites** — Save restaurants and view them on your personal saved list
- **User Profiles** — Edit your name, tagline, location, and profile photo
- **Authentication** — Sign up and log in securely via Firebase Auth

---

## Tech Stack

**Frontend**
- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [React Router DOM](https://reactrouter.com/) for client-side routing
- [Lucide React](https://lucide.dev/) for icons

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) — Firestore database & Auth
- [Pyrebase](https://github.com/thisbejim/Pyrebase) — Firebase authentication (sign-in)
- [Yelp Fusion API](https://docs.developer.yelp.com/docs/fusion-intro) — Restaurant search and details

**Dev Tooling**
- [uv](https://github.com/astral-sh/uv) — Python package manager
- [Ruff](https://docs.astral.sh/ruff/) — Linter and formatter
- [mypy](https://mypy.readthedocs.io/) — Static type checking
- [pytest](https://docs.pytest.org/) — Testing
- GitHub Actions — CI workflow

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) (`pip install uv`)
- A [Yelp Fusion API key](https://docs.developer.yelp.com/docs/fusion-intro)
- A Firebase project with Firestore enabled

---

### Backend Setup

1. **Clone the repo and navigate to the project root:**
   ```bash
   git clone https://github.com/your-username/crowdfork.git
   cd crowdfork
   ```

2. **Install dependencies with uv:**
   ```bash
   uv sync
   ```
   For dev dependencies:
   ```bash
   uv sync --all-extras --dev
   ```

3. **Add your environment variables** — create a `.env` file in `src/backend/`:
   ```env
   YELP_API_KEY=your_yelp_api_key_here
   ```

4. **Add your Firebase service account** — place your `serviceAccountKey.json` file in `src/backend/`. Download it from your Firebase project settings under *Service Accounts*.

5. **Run the backend:**
   ```bash
   uvicorn src.backend.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

---

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.


---

## API Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| `POST` | `/signup` | Create a new user account | ❌ |
| `POST` | `/login` | Log in and receive a token | ❌ |
| `GET` | `/search/restaurants` | Search restaurants via Yelp | ❌ |
| `GET` | `/autocomplete/restaurants` | Autocomplete search queries | ❌ |
| `GET` | `/yelp/restaurants/:id` | Get restaurant details from Yelp | ❌ |
| `GET` | `/restaurants/similar/:id` | Get similar restaurants | ❌ |
| `GET` | `/recommendations/localpicks` | Get trending nearby restaurants | ❌ |
| `GET` | `/users/me` | Get current user profile | ✅ |
| `PUT` | `/users/me` | Update user profile | ✅ |
| `GET` | `/users/me/favorites` | List favorited restaurants | ✅ |
| `POST` | `/favorites/:restaurant_id` | Add a restaurant to favorites | ✅ |
| `DELETE` | `/favorites/:restaurant_id` | Remove a restaurant from favorites | ✅ |
| `GET` | `/restaurants/:id/reviews` | Get reviews for a restaurant | ✅ |
| `POST` | `/restaurants/:id/reviews` | Create a review | ✅ |
| `DELETE` | `/reviews/:review_id` | Delete your own review | ✅ |
| `GET` | `/users/me/reviews` | Get your review history | ✅ |

---

## Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `YELP_API_KEY` | `src/backend/.env` | Your Yelp Fusion API key |

Firebase configuration lives in `src/backend/firebaseconfig.py` and `src/backend/serviceAccountKey.json`.

> ⚠️ Never commit `.env` or `serviceAccountKey.json` to version control.

---
