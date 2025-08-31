import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx'
import CreatePoll from './pages/CreatePoll.jsx';
import PollPage from './pages/Pollpage.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreatePoll />} />
        <Route path="/poll/:id" element={<PollPage />} />
      </Routes>
    </Router>
  );
}

export default App;
