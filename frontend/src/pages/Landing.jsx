// Landing.jsx
export default function Landing({ onGetStarted, onLogin }) {
  return (
    <div>
      <h1>CrowdFork</h1>
      <h2>Explore</h2>
      <p>Discover where the crowd really eats</p>

      {/* optional actions */}
      {onGetStarted && <button onClick={onGetStarted}>Get started</button>}
      {" "}
      {onLogin && (
        <button onClick={onLogin} style={{ background: "transparent" }}>
          Log in
        </button>
      )}
    </div>
  );
}