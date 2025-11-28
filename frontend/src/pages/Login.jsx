import { api } from "../api";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
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
    try {
      const data = await api.login(email, pwd);
      localStorage.setItem("token", data.token);
      navigate("/search");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}>
      <h1>Log in</h1>
      {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}
      <form onSubmit={onSubmit}>
        <div style={{ marginTop: 16 }}>
          <label htmlFor="email">Email</label><br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: 6 }}
            required
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label htmlFor="pwd">Password</label><br />
          <input
            id="pwd"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: 6 }}
            required
          />
        </div>

        <button
          type="submit"
          style={{
            marginTop: 20, padding: "10px 20px", borderRadius: 9999,
            background: "#2E3C8B", color: "#fff", border: "none", fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Sign in
        </button>
      </form>
    </div>
  );
}