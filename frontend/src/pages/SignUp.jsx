import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import "./SignUp.css"; // styles below

const API_BASE_URL = "http://localhost:8000"; 

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
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

    const userData = { email: email, password: pwd };

    try {
      // --- Step 2: API Call to /signup ---
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });


    const result = await response.json();

      if (response.ok) {
        // Successful signup (HTTP 201)
        console.log("Account created:", result.message);
        
        // --- Step 3: Redirect to Login with Success Message ---
        navigate("/login", { 
          state: { msg: "Account successfully created. Please sign in." } 
        });

      } else {
        // Failed signup (HTTP 400 or others)
        const errorMessage = result.detail || "Signup failed. Please try again.";
        setError(errorMessage);
        console.error("Signup Error:", errorMessage);
        
        // Ensure loading is reset on failure so user can try again
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