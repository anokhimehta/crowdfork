import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Landing from './pages/Landing'
import './App.css'

const App = () => {
  const handleGetStarted = () => { /* navigate or open signup */ };
  const handleLogin = () => { /* navigate to /login */ };
  return (
    <div>
      <Landing onGetStarted={handleGetStarted} onLogin={handleLogin} />
    </div>
  );
}


export default App
