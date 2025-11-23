// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [message, setMessage] = useState(""); 
  const [isLoading, setIsLoading] = useState(false); 

  // initialize navigate from react-router
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); 
    setIsLoading(true);

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
        // Successful Login (HTTP 200)
        const token = result.token;
        
        localStorage.setItem('authToken', token);

        setMessage("Login successful!");

        navigate('/Search'); 
      

      } else {
    
        const errorMessage = result.detail || "Login failed. Check your credentials.";
        setMessage(errorMessage);
        console.error("Login Error:", errorMessage);
      }
    } catch (error) {
      // Network failure, CORS issue, etc.
      console.error("Network Error:", error);
      setMessage("Could not connect to the server. Please check the network connection.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}>
      <h1>Log in</h1>
      {/* Message Box for Status */}
      {message && (
        <div 
          className={`p-3 mb-4 rounded-lg text-sm font-medium ${
            message.includes("successful") 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div style={{ marginTop: 16 }}>
          <label htmlFor="email">Email</label><br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
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
            onChange={(e)=>setPwd(e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: 6 }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            marginTop: 20, padding: "10px 20px", borderRadius: 9999,
            background: "#2E3C8B", color: "#fff", border: "none", fontWeight: 600,
            cursor: "pointer"
          }}
        >
         {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}