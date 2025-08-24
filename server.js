const express = require("express");
const cors = require("cors");
const db = require("./db.js");
require("dotenv").config();

const carRoutes = require("./routes/carRoutes");
const expenditureRoutes = require("./routes/expenditureRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use("/uploads", express.static("uploads"));

// Simple test endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Root route: server is running' });
});

app.get("/api", (req, res) => {
  const host = req.headers.host;
  res.json({ status: "ok", message: `Server is running on http://${host}: ${process.env.PORT || 5000}` });
});

// Test DB connection endpoint
app.get("/api/health", (req, res) => {
  db.query("SELECT 1 as status", (err, results) => {
    if (err) {
      console.error("❌ Database health check failed:", err.message);
      return res.status(500).json({ 
        status: "error", 
        message: "Database connection failed",
        error: err.message 
      });
    }
    res.json({ 
      status: "ok", 
      message: "Database connection healthy",
      timestamp: new Date().toISOString()
    });
  });
});

app.use("/api/cars", carRoutes);
app.use("/api/expenditure", expenditureRoutes);
app.use("/api/auth", authRoutes);

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`📴 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('📴 HTTP server closed');
    
    try {
      await db.end();
      console.log('📴 Database pool closed');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during database shutdown:', err);
      process.exit(1);
    }
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⏰ Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}
