// Landing.jsx
import Button from '../components/Button'
export default function Landing({ onGetStarted, onLogin }) {
  return (
    <div>
      <h1>CrowdFork</h1>
      <h2>Explore</h2>
      <p>Discover where the crowd really eats</p>

      {/* optional actions */}
       <Button onClick={() => alert("Get started clicked!")}>
        Get Started
      </Button>

      <br /><br />

      <Button variant="secondary" onClick={() => alert("Log in clicked!")}>
        Log In
      </Button>
    </div>
  );
}