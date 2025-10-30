// src/pages/Login.jsx
import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: call your auth API
    console.log({ email, pwd });
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}>
      <h1>Log in</h1>
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