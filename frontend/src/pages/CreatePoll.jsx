// src/pages/CreatePoll.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiX, FiClock, FiSave, FiAlertTriangle } from 'react-icons/fi';

const CreatePoll = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [customTime, setCustomTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [pollId, setPollId] = useState(''); // Add this state
  const [showAdminKey, setShowAdminKey] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index) => options.length > 2 && setOptions(options.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!question.trim()) {
      alert('Please enter a poll question.');
      return;
    }
    
    if (options.some(opt => !opt.trim())) {
      alert('Please fill in all options.');
      return;
    }

    const finalExpiresInMinutes = parseInt(customTime);
    
    if (!finalExpiresInMinutes || finalExpiresInMinutes <= 0) {
      alert('Please enter a valid time in minutes (greater than 0).');
      return;
    }
    
    try {
      setLoading(true);
      const res = await axios.post('https://votesphere-2zhx.onrender.com/api/polls', { 
        question, 
        options, 
        expiresInMinutes: finalExpiresInMinutes
      });
      
      setAdminKey(res.data.adminKey);
      setPollId(res.data.pollId); // Store the pollId
      setShowAdminKey(true);
    } catch (err) {
      alert('Error creating poll. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToPoll = () => {
    navigate(`/poll/${pollId}`); // Use the stored pollId
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
            <FiPlus className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Create New Poll</h2>
          <p className="text-slate-600">Set up your voting question and options</p>
        </div>

        {/* Poll Question */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Poll Question *
          </label>
          <input
            type="text"
            placeholder="What would you like to ask?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Poll Duration */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            <FiClock className="inline w-4 h-4 mr-1" />
            Poll Duration (minutes) *
          </label>
          <input
            type="number"
            placeholder="Enter duration in minutes (e.g., 60)"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            min="1"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-slate-500 mt-1">Minimum 1 minute required</p>
        </div>

        {/* Poll Options */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Options * (Minimum 2 required)
          </label>
          
          <div className="space-y-3">
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-red-500 hover:text-red-700 transition-colors"
                      title="Remove option"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addOption}
            className="mt-3 w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 font-medium py-2 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add Another Option
          </button>
        </div>

        {/* Create Poll Button */}
        <button
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          disabled={loading || !question.trim() || options.filter(opt => opt.trim()).length < 2 || !customTime}
        >
          <FiSave className="w-5 h-5" />
          {loading ? 'Creating Poll...' : 'Create Poll'}
        </button>

        {/* Admin Key Display */}
        {showAdminKey && adminKey && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <FiAlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-amber-800 mb-2">Important: Save Your Admin Key</h3>
                <p className="text-amber-700 text-sm mb-3">
                  This key is required to manage your poll. Save it somewhere safe!
                </p>
                <div className="bg-white p-3 rounded border border-amber-300 mb-3">
                  <code className="text-amber-800 font-mono text-sm break-all">{adminKey}</code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleContinueToPoll}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Continue to Poll
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(adminKey)}
                    className="border border-amber-300 text-amber-700 hover:bg-amber-100 px-4 py-2 rounded text-sm font-medium transition-colors"
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