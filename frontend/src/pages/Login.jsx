import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import "./Login.css";

const API_BASE_URL = "http://localhost:8000"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); 

  // initialize navigate from react-router
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const userData = { email: email, password: pwd };

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      if (response.ok) {
        const token = result.token;
        localStorage.setItem('authToken', token);
        navigate('/search');
      } else {
        const errorMessage = result.detail || "Login failed. Check your credentials.";
        setError(errorMessage);
        console.error("Login Error:", errorMessage);
        setLoading(false);
      }
    } catch (error) {
      console.error("Network Error:", error);
      setError("Could not connect to the server. Please check the network connection.");
      setLoading(false);
    }
  };


  return (
    <div className="cf-signup-wrap">
      <form className="cf-card" onSubmit={onSubmit} noValidate>
        <h1 className="cf-title">Log In</h1>

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

        {error && <div className="cf-error">{error}</div>}

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </Button>

        <div className="cf-bottom-hint">
          Don't have an account?{" "}
          <Link className="cf-link" to="/signup">
            Sign up.
          </Link>
        </div>
      </form>
    </div>
  );
}