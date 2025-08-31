// src/pages/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClipboard, FiPlusCircle, FiArrowRight } from 'react-icons/fi';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">VoteSphere</h1>
          <p className="text-slate-600">Create and participate in polls instantly</p>
        </div>

        {/* Create Poll Button */}
        <button
          onClick={() => navigate('/create')}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg mb-6"
        >
          <FiPlusCircle className="w-5 h-5" />
          Create New Poll
        </button>

        {/* Divider */}
        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-sm">or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Join Poll Section */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-700 mb-3">Join existing poll</h2>
          
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Poll ID"
                value={pollId}
                onChange={(e) => setPollId(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <button
                onClick={handlePasteId}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-slate-500 hover:text-blue-600 transition-colors"
                title="Paste from clipboard"
              >
                <FiClipboard className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button
            onClick={handleJoinPoll}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!pollId.trim()}
          >
            Join Poll
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>

        
      </div>
    </div>
  );
};

export default Home;