import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Search from './pages/Search'
import ReviewForm from './pages/ReviewForm'
import Restaurant from './pages/Restaurant'
import Profile from './pages/Profile'
import './App.css'
import UserProfile from "./pages/UserProfile";

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
      <Route path="/restaurant" element={<Restaurant />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/userprofile" element={<UserProfile/>} />
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
