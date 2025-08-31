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
  FiUsers, FiHome, FiSettings, FiChevronDown, FiChevronUp 
} from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const socket = io('https://votesphere-2zhx.onrender.com');

const PollPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [copied, setCopied] = useState(false);
  const [extendMinutes, setExtendMinutes] = useState('10');

  // Check if user has already voted
  useEffect(() => {
    const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
    if (votedPolls[id]) {
      setHasVoted(true);
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
      
      setHasVoted(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FiHome className="inline mr-2" />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const optionColors = [
    'bg-blue-100 hover:bg-blue-200 border-blue-300',
    'bg-emerald-100 hover:bg-emerald-200 border-emerald-300',
    'bg-amber-100 hover:bg-amber-200 border-amber-300',
    'bg-rose-100 hover:bg-rose-200 border-rose-300',
    'bg-indigo-100 hover:bg-indigo-200 border-indigo-300',
  ];

  const chartColors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(244, 63, 94, 0.8)',
    'rgba(99, 102, 241, 0.8)',
  ].slice(0, poll.options.length);

  const data = {
    labels: poll.options.map((opt, i) => 
      `${opt} (${poll.votes[i]} votes - ${Math.round((poll.votes[i] / (poll.totalVotes || 1)) * 100)}%)`
    ),
    datasets: [{
      label: 'Votes',
      data: poll.votes,
      backgroundColor: chartColors,
      borderRadius: 4,
    }],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-slate-800">{poll.question}</h1>
            
            {poll.expiresAt && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                timeLeft === 'Expired' || !poll.isActive 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                <FiClock className="w-4 h-4" />
                {timeLeft === 'Expired' || !poll.isActive ? 'Poll Closed' : timeLeft}
              </div>
            )}
          </div>

          {!poll.isActive && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4">
              This poll is no longer accepting votes.
            </div>
          )}

          {/* Poll ID Section */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <button
              onClick={copyPollId}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {copied ? <FiCheck className="w-4 h-4 text-green-600" /> : <FiCopy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Poll ID'}
            </button>
            <div className="bg-slate-100 px-4 py-2 rounded-lg font-mono text-sm text-slate-600 break-all">
              {id}
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Share this ID with others to join your poll
          </p>
        </div>

        {/* Voting Section */}
        {!hasVoted && poll.isActive ? (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Choose the Option</h2>
            <div className="space-y-3 mb-6">
              {poll.options.map((opt, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedOption === index 
                      ? 'border-blue-500 ring-2 ring-blue-100 scale-[1.02]' 
                      : 'border-slate-200 hover:border-slate-300'
                  } ${optionColors[index % optionColors.length]}`}
                  disabled={!poll.isActive}
                >
                  {opt}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleVote}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedOption === null || !poll.isActive}
            >
              Submit Vote
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium mb-4 ${
              hasVoted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
            }`}>
              {hasVoted ? (
                <>
                  <FiCheck className="w-5 h-5" />
                  Thank you for voting!
                </>
              ) : (
                <>
                  <FiLock className="w-5 h-5" />
                  Voting has ended
                </>
              )}
            </div>
            {poll.totalVotes > 0 && (
              <p className="text-slate-600">
                <FiUsers className="inline mr-1 w-4 h-4" />
                Total votes: {poll.totalVotes}
              </p>
            )}
          </div>
        )}

        {/* Results Section */}
        {poll.totalVotes > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <FiUsers className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">Results</h2>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm ml-auto">
                {poll.totalVotes} total votes
              </span>
            </div>
            
            <Bar
              data={data}
              options={{
                responsive: true,
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#475569',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                  }
                },
                animation: { duration: 800 },
                scales: { 
                  y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(226, 232, 240, 0.5)' },
                    ticks: { stepSize: 1 }
                  },
                  x: {
                    grid: { display: false }
                  }
                },
              }}
            />
          </div>
        )}

        {/* Admin Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={() => setShowAdminControls(!showAdminControls)}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium mb-4"
          >
            <FiSettings className="w-5 h-5" />
            Admin Controls
            {showAdminControls ? (
              <FiChevronUp className="w-4 h-4 ml-auto" />
            ) : (
              <FiChevronDown className="w-4 h-4 ml-auto" />
            )}
          </button>

          {showAdminControls && (
            <div className="border-t pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Admin Key
                </label>
                <input
                  type="password"
                  placeholder="Enter your admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleAdminAction('close')}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
                >
                  <FiLock className="w-4 h-4" />
                  Close Poll
                </button>
                
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Minutes"
                    value={extendMinutes}
                    onChange={(e) => setExtendMinutes(e.target.value)}
                    min="1"
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleAdminAction('extend')}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    <FiCalendar className="w-4 h-4" />
                    Extend
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-6">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PollPage;