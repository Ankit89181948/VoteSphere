// src/pages/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClipboard, FiPlusCircle, FiArrowRight, FiUsers } from 'react-icons/fi';

const Home = () => {
  const navigate = useNavigate();
  const [pollId, setPollId] = useState('');

  const handleJoinPoll = () => {
    if (pollId.trim() !== '') {
      navigate(`/poll/${pollId}`);
    }
  };

  const handlePasteId = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPollId(text);
    } catch (err) {
      console.error('Failed to read clipboard: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-6 sm:p-10 text-gray-100">
      {/* Hero Section - A more prominent header area */}
      <div className="text-center mb-12 max-w-2xl">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-700 rounded-full mb-6 shadow-lg shadow-gray-900/50">
          <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
          VoteSphere
        </h1>
        <p className="text-xl text-gray-300 font-medium">
          Create instant polls or join existing ones. Simple, fast, and anonymous.
        </p>
      </div>

      {/* Main Actions - Two distinct cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Create New Poll Card */}
        <div className="bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 flex flex-col items-center text-center border-b-4 border-cyan-500 hover:border-cyan-400">
          <div className="p-4 bg-gray-700 rounded-full mb-6 shadow-md">
            <FiPlusCircle className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Launch a New Poll</h2>
          <p className="text-gray-300 mb-8 max-w-xs">
            Start a discussion, gather opinions, or make decisions effortlessly.
          </p>
          <button
            onClick={() => navigate('/create')}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50"
          >
            Create New Poll
            <FiArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>

        {/* Join Existing Poll Card */}
        <div className="bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 flex flex-col items-center text-center border-b-4 border-emerald-500 hover:border-emerald-400">
          <div className="p-4 bg-gray-700 rounded-full mb-6 shadow-md">
            <FiUsers className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Join a Poll in Progress</h2>
          <p className="text-gray-300 mb-8 max-w-xs">
            Enter a Poll ID to cast your vote and see live results.
          </p>
          <div className="relative w-full mb-4">
            <input
              type="text"
              placeholder="Enter Poll ID"
              value={pollId}
              onChange={(e) => setPollId(e.target.value)}
              className="w-full pl-5 pr-14 py-4 border border-gray-600 rounded-xl bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
            />
            <button
              onClick={handlePasteId}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-400 transition-colors duration-200"
              title="Paste from clipboard"
            >
              <FiClipboard className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleJoinPoll}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!pollId.trim()}
          >
            Join Poll
            <FiArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;