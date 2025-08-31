// index.js - Updated with environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config(); // Load environment variables

const app = express();
const server = http.createServer(app);

// Use environment variable for frontend URL with fallback for local development
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});

// Middlewares
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

// Connect to MongoDB using environment variable
const MONGODB_URI = process.env.MONGODB_URI;

// ADD THIS CHECK - Ensure MONGODB_URI is defined
if (!MONGODB_URI) {
    console.error("ERROR: MONGODB_URI environment variable is not defined");
    console.error("Please set MONGODB_URI in your environment variables");
    process.exit(1); // Exit if no MongoDB URI
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected successfully"))
.catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process if MongoDB connection fails
});

// --- MongoDB Schema ---
const pollSchema = new mongoose.Schema({
    question: String,
    options: [String],
    votes: [Number],
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    adminKey: String,
    isActive: { type: Boolean, default: true }
});

const Poll = mongoose.model('Poll', pollSchema);

// --- Routes ---

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Create a new poll
app.post('/api/polls', async (req, res) => {
    try {
        const { question, options, expiresInMinutes } = req.body;
        
        if (!question || !options || options.length < 2) {
            return res.status(400).json({ message: "Question and at least 2 options required" });
        }

        // Generate random admin key
        const adminKey = Math.random().toString(36).substring(2, 15);
        
        // Calculate expiration time in minutes
        let expiresAt = null;
        if (expiresInMinutes && expiresInMinutes > 0) {
            expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
        }

        const poll = new Poll({ 
            question, 
            options, 
            votes: Array(options.length).fill(0),
            expiresAt,
            adminKey
        });
        
        await poll.save();
        
        // Return both pollId and adminKey
        res.json({ 
            pollId: poll._id, 
            adminKey: adminKey 
        });
    } catch (error) {
        console.error("Error creating poll:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get poll by ID
app.get('/api/polls/:id', async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: "Poll not found" });
        
        // Check if poll has expired
        if (poll.expiresAt && new Date() > poll.expiresAt) {
            poll.isActive = false;
            await poll.save();
        }
        
        res.json(poll);
    } catch (err) {
        console.error("Error fetching poll:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Vote on an option
app.post('/api/polls/:id/vote', async (req, res) => {
    try {
        const { optionIndex } = req.body;
        const poll = await Poll.findById(req.params.id);
        
        if (!poll) return res.status(404).json({ message: "Poll not found" });
        
        // Check if poll is active
        if (!poll.isActive) {
            return res.status(400).json({ message: "This poll is no longer active" });
        }
        
        // Check if poll has expired
        if (poll.expiresAt && new Date() > poll.expiresAt) {
            poll.isActive = false;
            await poll.save();
            return res.status(400).json({ message: "This poll has expired" });
        }
        
        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({ message: "Invalid option index" });
        }

        poll.votes[optionIndex] += 1;
        await poll.save();

        // Emit updated votes via Socket.io
        io.to(req.params.id).emit('voteUpdate', {
            votes: poll.votes,
            totalVotes: poll.votes.reduce((sum, vote) => sum + vote, 0)
        });

        res.json({ 
            votes: poll.votes,
            totalVotes: poll.votes.reduce((sum, vote) => sum + vote, 0)
        });
    } catch (err) {
        console.error("Error voting:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Admin endpoints
app.post('/api/polls/:id/admin/close', async (req, res) => {
    try {
        const { adminKey } = req.body;
        const poll = await Poll.findById(req.params.id);
        
        if (!poll) return res.status(404).json({ message: "Poll not found" });
        
        if (poll.adminKey !== adminKey) {
            return res.status(403).json({ message: "Invalid admin key" });
        }
        
        poll.isActive = false;
        await poll.save();
        
        io.to(req.params.id).emit('pollStatusUpdate', { isActive: false });
        res.json({ message: "Poll closed successfully" });
    } catch (err) {
        console.error("Error closing poll:", err);
        res.status(500).json({ message: "Server error" });
    }
});

app.post('/api/polls/:id/admin/extend', async (req, res) => {
    try {
        const { adminKey, extendMinutes } = req.body;
        const poll = await Poll.findById(req.params.id);
        
        if (!poll) return res.status(404).json({ message: "Poll not found" });
        
        if (poll.adminKey !== adminKey) {
            return res.status(403).json({ message: "Invalid admin key" });
        }
        
        if (extendMinutes > 0) {
            const newExpiresAt = poll.expiresAt 
                ? new Date(poll.expiresAt.getTime() + extendMinutes * 60 * 1000)
                : new Date(Date.now() + extendMinutes * 60 * 1000);
            
            poll.expiresAt = newExpiresAt;
            await poll.save();
        }
        
        res.json({ 
            message: "Poll extended successfully",
            newExpiresAt: poll.expiresAt 
        });
    } catch (err) {
        console.error("Error extending poll:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// --- Socket.io connection ---
io.on('connection', (socket) => {
    console.log("User connected: ", socket.id);

    // Join poll room
    socket.on('joinPoll', (pollId) => {
        socket.join(pollId);
        console.log(`Socket ${socket.id} joined poll ${pollId}`);
    });

    socket.on('disconnect', () => {
        console.log("User disconnected: ", socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server with environment variable port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
});