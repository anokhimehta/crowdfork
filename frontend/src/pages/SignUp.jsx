import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { api } from "../api";
import "./SignUp.css"; // styles below

const API_BASE_URL = "http://localhost:8000"; 

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tagline, setTagline] = useState("");
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  // const [imageUrl, setImageUrl] = useState(""); 

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validate = () => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return "Please enter a valid email address.";

    if (pwd.length < 8) return "Password must be at least 8 characters.";
    if (!/[0-9]/.test(pwd)) return "Password must include at least one number.";
    if (pwd !== confirm) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    setError("");
    const userData = { 
      email: email, 
      password: pwd, 
      tagline: tagline,
      location: location,
      name: name,
    };


    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        
        console.log("Account created:", result.message);
        
       
        navigate("/login", { 
          state: { msg: "Account successfully created. Please sign in." } 
        });

      } else {
       
        const errorMessage = result.detail || "Signup failed. Please try again.";
        setError(errorMessage);
        console.error("Signup Error:", errorMessage);
        setLoading(false);
      }
    } catch (apiError) {
      // Network failure, CORS issue, etc.
      console.error("Network Error:", apiError);
      setError("Could not connect to the server. Please check the API URL.");
      setLoading(false);
    } 
  };

  return (
    <div className="cf-signup-wrap">
      {/* Optional logo */}
      {/* <img src="/logo.png" alt="CrowdFork" className="cf-logo" /> */}

      <form className="cf-card" onSubmit={handleSubmit} noValidate>
        <h1 className="cf-title">Sign Up</h1>

        <input
          className="cf-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="cf-input"
          type="password"
          placeholder="Password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          required
        />

        <input
          className="cf-input"
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

          <input
          className="cf-input"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="cf-input"
          type="text"
          placeholder="Location (e.g., 'San Francisco')"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          className="cf-input"
          type="text"
          placeholder="Tagline (e.g., 'Foodie with a mission')"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
        {/* <input
          className="cf-input"
          type="url"
          placeholder="Profile Image URL (Optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        /> */}

        {error && <div className="cf-error">{error}</div>}

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Creating..." : "Sign Up"}
        </Button>

        <div className="cf-bottom-hint">
          Already have an account?{" "}
          <Link className="cf-link" to="/login">
            Log in.
          </Link>
        </div>
      </form>
    </div>
  );
}