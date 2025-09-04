// src/pages/CreatePoll.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiPlus,
  FiX,
  FiClock,
  FiSave,
  FiAlertTriangle,
} from "react-icons/fi";

const CreatePoll = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [customTime, setCustomTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [pollId, setPollId] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (index) =>
    options.length > 2 &&
    setOptions(options.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!question.trim()) {
      alert("Please enter a poll question.");
      return;
    }
    if (options.some((opt) => !opt.trim())) {
      alert("Please fill in all options.");
      return;
    }

    const finalExpiresInMinutes = parseInt(customTime);
    if (!finalExpiresInMinutes || finalExpiresInMinutes <= 0) {
      alert("Please enter a valid time in minutes (greater than 0).");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "https://votesphere-2zhx.onrender.com/api/polls",
        { question, options, expiresInMinutes: finalExpiresInMinutes }
      );
      setAdminKey(res.data.adminKey);
      setPollId(res.data.pollId);
      setShowAdminKey(true);
    } catch (err) {
      alert("Error creating poll. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToPoll = () => {
    navigate(`/poll/${pollId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6 text-gray-100">
      <div className="w-full max-w-3xl bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-700">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-700 rounded-full shadow-lg mb-6">
            <FiPlus className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Create a New Poll
          </h2>
          <p className="text-gray-400">
            Set your question, add options, and define the duration.
          </p>
        </div>

        {/* Poll Question */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Poll Question *
          </label>
          <input
            type="text"
            placeholder="What would you like to ask?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-100"
          />
        </div>

        {/* Poll Options */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-3 text-gray-300">
            Options * (Minimum 2 required)
          </label>
          <div className="space-y-3">
            {options.map((opt, index) => (
              <div key={index} className="relative flex">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={opt}
                  onChange={(e) =>
                    handleOptionChange(index, e.target.value)
                  }
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-100"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-500"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addOption}
            className="mt-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium"
          >
            <FiPlus className="w-4 h-4" />
            Add Another Option
          </button>
        </div>

        {/* Poll Duration */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-3 text-gray-300">
            <FiClock className="inline w-4 h-4 mr-1 text-cyan-400" />
            Poll Duration (minutes) *
          </label>
          <input
            type="number"
            placeholder="Enter duration in minutes (e.g., 60)"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            min="1"
            className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-100"
          />
          <p className="text-sm text-gray-400 mt-2">
            Minimum 1 minute required
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={
            loading ||
            !question.trim() ||
            options.filter((opt) => opt.trim()).length < 2 ||
            !customTime
          }
          className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSave className="w-5 h-5" />
          {loading ? "Creating Poll..." : "Create Poll"}
        </button>

        {/* Admin Key Display */}
        {showAdminKey && adminKey && (
          <div className="mt-8 p-6 bg-amber-100 rounded-xl border-l-4 border-amber-500 text-amber-900">
            <div className="flex items-start gap-4">
              <FiAlertTriangle className="w-6 h-6 mt-1 text-amber-600" />
              <div>
                <h3 className="font-bold mb-2">
                  Important: Save Your Admin Key
                </h3>
                <p className="mb-3">
                  This key is required to manage your poll. Save it
                  somewhere safe!
                </p>
                <div className="bg-white px-4 py-2 rounded font-mono text-sm break-all mb-3 border border-amber-300">
                  {adminKey}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleContinueToPoll}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-medium"
                  >
                    Continue to Poll
                  </button>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(adminKey)
                    }
                    className="border border-amber-400 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded font-medium"
                  >
                    Copy Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePoll;
