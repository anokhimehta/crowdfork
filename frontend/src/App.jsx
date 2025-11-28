import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Search from './pages/Search'
import ReviewForm from './pages/ReviewForm'
import Restaurant from './pages/Restaurant'
import Profile from './pages/Profile'
import './App.css'

function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Landing
            onGetStarted={() => navigate("/signup")} // optional placeholder
            onLogin={() => navigate("/login")}
          />
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/search" element={<Search />} />
      <Route path="/review" element={<ReviewForm />} />
      {/* would we need to pass restaurant_id as an argument for ReviewForm? */}
      {/* as in       <ReviewForm restaurantId={restaurantId} /> */}
      <Route path="/restaurant/:id" element={<Restaurant />} />
      {/* we also need to pass restaurant_id in the URL since the get restaurant needs an id  */}
      
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
