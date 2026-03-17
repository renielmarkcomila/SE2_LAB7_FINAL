require('dotenv').config(); // PART 3: Security
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// PART 3: Gemini AI Setup using Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Database Connection with Part 1 Logging
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wellness_db'
});

db.connect((err) => {
    if (err) {
        // PART 1: Bug Catching - Database Connection
        console.error("❌ [PART 1] Database Connection Failed:", err.message);
    } else {
        console.log("✅ [PART 1] Connected to MySQL Database Successfully");
    }
});

// PART 4: System Health Check Endpoint
app.get("/health", (req, res) => {
    console.log("📡 [PART 4] Health Check Pinged at " + new Date().toISOString());
    res.json({
        status: "OK",
        message: "API is alive and running for Reniel!",
        timestamp: new Date().toISOString()
    });
});

// GET Moods with Logging
app.get('/moods', (req, res) => {
    console.log("📥 [PART 0] Request: GET /moods (Fetching history)");
    const query = "SELECT * FROM mood_log ORDER BY created_at DESC";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ [PART 1] SQL Error (GET):", err.message);
            return res.status(500).json({ error: "Database fetch failed" });
        }
        console.log(`✅ [PART 0] Success: Fetched ${results.length} entries`);
        res.json(results);
    });
});

// POST Mood with Part 0 & Part 2 Debugging
app.post('/moods', async (req, res) => {
    // PART 0.2: Advanced Logging
    console.log("-----------------------------------------");
    console.log("📥 [PART 0] New POST Request Received");
    console.log("📦 [PART 0] Data from Reniel's UI:", req.body);

    const { journal_entry, mood_level } = req.body;

    // PART 3.1: Parameterized Query for Security
    const query = "INSERT INTO mood_log (mood_text, ai_response, mood_level) VALUES (?, ?, ?)";

    try {
        console.log("🤖 [PART 2] Calling Gemini AI for Counselor Response...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `The user says: "${journal_entry}". They rated their mood as ${mood_level}/10. Give a short, supportive response.`;
        
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();
        
        // PART 2: Observing Network and AI Response
        console.log("✨ [PART 2] Gemini Success: " + aiResponse.substring(0, 30) + "...");

        db.query(query, [journal_entry, aiResponse, mood_level], (err, result) => {
            if (err) {
                console.error("❌ [PART 1] Database Insert Error:", err.message);
                return res.status(500).json({ error: "Failed to save to database" });
            }
            console.log("💾 [PART 0] Record successfully saved with ID:", result.insertId);
            res.json({ ai_response: aiResponse });
        });

    } catch (error) {
        // PART 1: System Crash Logging
        console.error("❌ [PART 1] SYSTEM CRASH:", error.message);
        res.status(500).json({ error: "Gemini AI failed - check API Key in Render environment" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 [SYSTEM] Server running on http://localhost:${PORT}`);
    console.log(`🩺 [SYSTEM] Health check: http://localhost:${PORT}/health`);
});