// Landing.jsx
import Button from '../components/Button'
export default function Landing({ onGetStarted, onLogin }) {
  return (
    <div>
      <h1>CrowdFork</h1>
      <h2>Explore</h2>
      <p>Discover where the crowd really eats</p>

      {/* optional actions */}
       <Button onClick={onGetStarted}>
        Get Started
      </Button>

      <br /><br />

      <Button variant="secondary" onClick={onLogin}>
        Log In
      </Button>
    </div>
  );
}