import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Landing from './pages/Landing'
import Login from './pages/Login'
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
