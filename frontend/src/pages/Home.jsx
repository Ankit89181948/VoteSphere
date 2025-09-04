import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiClipboard, FiPlusCircle, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();
  const [pollId, setPollId] = useState("");

  const handleJoinPoll = () => {
    if (pollId.trim() !== "") {
      navigate(`/poll/${pollId}`);
    }
  };

  const handlePasteId = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPollId(text);
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white flex flex-col items-center justify-center p-10 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg text-center lg:text-left"
        >
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            Welcome to <span className="text-yellow-300">VoteSphere</span>
          </h1>
          <p className="text-lg text-blue-100 mb-8">
            Create polls, share with friends, and vote in real time.
          </p>
        </motion.div>

        {/* Decorative circle */}
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right Action Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-2xl shadow-md mb-4">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              Get Started
            </h2>
            <p className="text-slate-500 text-sm">
              Choose an option to continue
            </p>
          </div>

          {/* Create Poll Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/create")}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg mb-6"
          >
            <FiPlusCircle className="w-5 h-5" />
            Create New Poll
          </motion.button>

          {/* Divider */}
          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wide">
              or
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Join Poll Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Join existing poll
            </h3>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Poll ID"
                  value={pollId}
                  onChange={(e) => setPollId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                />
                <button
                  onClick={handlePasteId}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-blue-600 transition-colors"
                  title="Paste from clipboard"
                >
                  <FiClipboard className="w-4 h-4" />
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleJoinPoll}
              disabled={!pollId.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Poll
              <FiArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
