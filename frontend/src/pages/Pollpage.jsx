// src/pages/PollPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { 
  FiClock, FiCopy, FiCheck, FiLock, FiUnlock, FiCalendar, 
  FiUsers, FiHome, FiSettings, FiChevronDown, FiChevronUp,
  FiArrowLeft, FiShare2, FiBarChart2, FiEye
} from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const socket = io('https://votesphere-2zhx.onrender.com');

const PollPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [canSeeResults, setCanSeeResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [copied, setCopied] = useState(false);
  const [extendMinutes, setExtendMinutes] = useState('10');
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Check if user has already voted and can see results
  useEffect(() => {
    const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
    if (votedPolls[id]) {
      setHasVoted(true);
      setCanSeeResults(true);
    }
    
    // Also check if user has previously been granted results view
    const resultsAccess = JSON.parse(localStorage.getItem('resultsAccess') || '{}');
    if (resultsAccess[id]) {
      setCanSeeResults(true);
    }
  }, [id]);

  // Calculate time left
  useEffect(() => {
    if (!poll || !poll.expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date();
      const expires = new Date(poll.expiresAt);
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [poll]);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`https://votesphere-2zhx.onrender.com/api/polls/${id}`);
        setPoll(res.data);
        setError('');
      } catch (err) {
        setError('Failed to load poll. Please check the poll ID.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();

    socket.emit('joinPoll', id);
    socket.on('voteUpdate', (data) => {
      setPoll(prev => prev ? { ...prev, votes: data.votes, totalVotes: data.totalVotes } : null);
    });

    socket.on('pollStatusUpdate', (data) => {
      setPoll(prev => prev ? { ...prev, isActive: data.isActive } : null);
    });

    return () => {
      socket.off('voteUpdate');
      socket.off('pollStatusUpdate');
    };
  }, [id]);

  const handleVote = async () => {
    if (selectedOption === null) {
      setError('Please select an option first');
      return;
    }
    
    try {
      setError('');
      await axios.post(`https://votesphere-2zhx.onrender.com/api/polls/${id}/vote`, { 
        optionIndex: selectedOption 
      });
      
      // Store in localStorage to prevent re-voting
      const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
      votedPolls[id] = true;
      localStorage.setItem('votedPolls', JSON.stringify(votedPolls));
      
      // Also grant permission to see results
      const resultsAccess = JSON.parse(localStorage.getItem('resultsAccess') || '{}');
      resultsAccess[id] = true;
      localStorage.setItem('resultsAccess', JSON.stringify(resultsAccess));
      
      setHasVoted(true);
      setCanSeeResults(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit vote. Please try again.');
      console.error(err);
    }
  };

  const copyPollId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sharePoll = async () => {
    const shareData = {
      title: poll.question,
      text: `Vote on this poll: ${poll.question}`,
      url: window.location.href,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyPollId();
        setShowShareOptions(false);
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  const handleAdminAction = async (action) => {
    if (!adminKey) {
      setError('Please enter admin key first');
      return;
    }

    try {
      if (action === 'close') {
        await axios.post(`https://votesphere-2zhx.onrender.com/api/polls/${id}/admin/close`, { adminKey });
        setError('Poll closed successfully');
      } else if (action === 'extend') {
        if (!extendMinutes || extendMinutes <= 0) {
          setError('Please enter valid minutes to extend');
          return;
        }
        
        await axios.post(`https://votesphere-2zhx.onrender.com/api/polls/${id}/admin/extend`, { 
          adminKey, 
          extendMinutes: parseInt(extendMinutes)
        });
        setError(`Poll extended by ${extendMinutes} minutes`);
        
        // Refresh poll data
        const res = await axios.get(`https://votesphere-2zhx.onrender.com/api/polls/${id}`);
        setPoll(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Admin action failed');
    }
  };

  // Function to manually show results (for users who voted but can't see results due to previous bug)
  const showResults = () => {
    const resultsAccess = JSON.parse(localStorage.getItem('resultsAccess') || '{}');
    resultsAccess[id] = true;
    localStorage.setItem('resultsAccess', JSON.stringify(resultsAccess));
    setCanSeeResults(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading poll data...</p>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
        <div className="bg-gray-800 rounded-3xl shadow-xl p-8 max-w-md text-center border border-gray-700">
          <div className="text-red-400 mb-6 text-lg">{error}</div>
          <button 
            onClick={() => navigate('/')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
          >
            <FiHome className="w-5 h-5" />
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const optionColors = [
    'from-blue-600 to-blue-700',
    'from-emerald-600 to-emerald-700',
    'from-amber-600 to-amber-700',
    'from-rose-600 to-rose-700',
    'from-indigo-600 to-indigo-700',
    'from-purple-600 to-purple-700',
    'from-pink-600 to-pink-700',
    'from-cyan-600 to-cyan-700',
  ];

  const chartColors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(244, 63, 94, 0.8)',
    'rgba(99, 102, 241, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(6, 182, 212, 0.8)',
  ].slice(0, poll.options.length);

  const data = {
    labels: poll.options.map((opt, i) => 
      `${opt} (${poll.votes[i]} votes - ${Math.round((poll.votes[i] / (poll.totalVotes || 1)) * 100)}%)`
    ),
    datasets: [{
      label: 'Votes',
      data: poll.votes,
      backgroundColor: chartColors,
      borderRadius: 8,
      borderWidth: 0,
    }],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShareOptions(!showShareOptions)}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-xl transition-all duration-300"
            >
              <FiShare2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {showShareOptions && (
          <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <button
                onClick={copyPollId}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300"
              >
                {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Poll ID'}
              </button>
              <div className="bg-gray-700 px-4 py-2.5 rounded-xl font-mono text-sm text-gray-200 break-all flex-1">
                {id}
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Share this ID with others to join your poll
            </p>
          </div>
        )}

        {/* Poll Header Card */}
        <div className="bg-gray-800 rounded-3xl shadow-xl p-8 mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-white">{poll.question}</h1>
            
            {poll.expiresAt && (
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium ${
                timeLeft === 'Expired' || !poll.isActive 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                <FiClock className="w-4 h-4" />
                {timeLeft === 'Expired' || !poll.isActive ? 'Poll Closed' : timeLeft}
              </div>
            )}
          </div>

          {!poll.isActive && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-5 py-3.5 rounded-xl mb-6">
              This poll is no longer accepting votes.
            </div>
          )}

          <div className="flex items-center gap-3 text-gray-400">
            <FiUsers className="w-5 h-5" />
            <span>{poll.totalVotes || 0} total votes</span>
          </div>
        </div>

        {/* Voting Section */}
        {!hasVoted && poll.isActive ? (
          <div className="bg-gray-800 rounded-3xl shadow-xl p-8 mb-8 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <FiBarChart2 className="w-5 h-5 text-cyan-400" />
              Cast Your Vote
            </h2>
            <div className="space-y-4 mb-8">
              {poll.options.map((opt, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  className={`w-full text-left p-5 rounded-xl transition-all duration-300 border-2 ${
                    selectedOption === index 
                      ? 'border-cyan-500 ring-2 ring-cyan-500/30 scale-[1.02] bg-gradient-to-r from-cyan-500/10 to-cyan-600/10' 
                      : 'border-gray-700 hover:border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                  }`}
                  disabled={!poll.isActive}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                      selectedOption === index 
                        ? 'border-cyan-500 bg-cyan-500' 
                        : 'border-gray-500'
                    }`}>
                      {selectedOption === index && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="text-gray-200 text-lg">{opt}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={handleVote}
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={selectedOption === null || !poll.isActive}
            >
              Submit Vote
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-3xl shadow-xl p-8 mb-8 border border-gray-700 text-center">
            <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-medium mb-6 ${
              hasVoted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'
            }`}>
              {hasVoted ? (
                <>
                  <FiCheck className="w-6 h-6" />
                  Thank you for voting!
                </>
              ) : (
                <>
                  <FiLock className="w-6 h-6" />
                  Voting has ended
                </>
              )}
            </div>
            {poll.totalVotes > 0 && (
              <p className="text-gray-400 flex items-center justify-center gap-2">
                <FiUsers className="w-5 h-5" />
                Total votes: {poll.totalVotes}
              </p>
            )}
            
            {/* Show results button for users who voted but can't see results */}
            {hasVoted && !canSeeResults && (
              <button
                onClick={showResults}
                className="mt-4 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 px-5 rounded-xl font-medium transition-colors mx-auto"
              >
                <FiEye className="w-4 h-4" />
                Show Results
              </button>
            )}
          </div>
        )}

        {/* Results Section - Now visible if canSeeResults is true */}
        {(canSeeResults && poll.totalVotes > 0) && (
          <div className="bg-gray-800 rounded-3xl shadow-xl p-8 mb-8 border border-gray-700">
            <div className="flex items-center gap-3 mb-8">
              <FiBarChart2 className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">Live Results</h2>
              <span className="bg-gray-700 text-gray-300 px-4 py-1.5 rounded-full text-sm ml-auto">
                {poll.totalVotes} total votes
              </span>
            </div>
            
            <div className="bg-gray-700/30 p-5 rounded-2xl">
              <Bar
                data={data}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      titleColor: '#f1f5f9',
                      bodyColor: '#cbd5e1',
                      borderColor: '#334155',
                      borderWidth: 1,
                      padding: 12,
                      boxPadding: 6,
                      cornerRadius: 8,
                    }
                  },
                  animation: { duration: 800 },
                  scales: { 
                    y: { 
                      beginAtZero: true,
                      grid: { color: 'rgba(148, 163, 184, 0.2)' },
                      ticks: { 
                        stepSize: 1,
                        color: '#94a3b8'
                      }
                    },
                    x: {
                      grid: { display: false },
                      ticks: {
                        color: '#94a3b8'
                      }
                    }
                  },
                }}
                height={350}
              />
            </div>
          </div>
        )}

        {/* Admin Controls */}
        <div className="bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-700">
          <button
            onClick={() => setShowAdminControls(!showAdminControls)}
            className="flex items-center gap-3 text-gray-300 hover:text-white font-medium mb-4 w-full text-left"
          >
            <FiSettings className="w-5 h-5 text-cyan-400" />
            Admin Controls
            {showAdminControls ? (
              <FiChevronUp className="w-5 h-5 ml-auto" />
            ) : (
              <FiChevronDown className="w-5 h-5 ml-auto" />
            )}
          </button>

          {showAdminControls && (
            <div className="border-t border-gray-700 pt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Admin Key
                </label>
                <input
                  type="password"
                  placeholder="Enter your admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-5 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-200 placeholder-gray-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <button
                  onClick={() => handleAdminAction('close')}
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3.5 px-6 rounded-xl font-medium transition-all duration-300"
                >
                  <FiLock className="w-5 h-5" />
                  Close Poll
                </button>
                
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Minutes"
                    value={extendMinutes}
                    onChange={(e) => setExtendMinutes(e.target.value)}
                    min="1"
                    className="flex-1 px-4 py-3.5 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-200 placeholder-gray-500"
                  />
                  <button
                    onClick={() => handleAdminAction('extend')}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-5 py-3.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap"
                  >
                    <FiCalendar className="w-5 h-5" />
                    Extend
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-xl mt-6">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PollPage;