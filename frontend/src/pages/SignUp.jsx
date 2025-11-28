import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { api } from "../api";
import "./SignUp.css"; // styles below

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
    try {
      setLoading(true);
      setError("");

      await api.signup(email, pwd);

      // Go to login with a success hint
      navigate("/login", { state: { msg: "Account created. Please sign in." } });
    } catch (err) {
      setError(err.message);
    } finally {
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