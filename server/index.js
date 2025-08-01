const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Import routes
const resourceRoutes = require('./routes/resources');
const podRoutes = require('./routes/pods');
const logRoutes = require('./routes/logs');
const nodeRoutes = require('./routes/nodes');
const namespaceRoutes = require('./routes/namespaces');
const contextRoutes = require('./routes/contexts');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Route usage
app.use('/api', resourceRoutes);
app.use('/api', podRoutes);
app.use('/api', logRoutes);
app.use('/api', nodeRoutes);
app.use('/api', namespaceRoutes);
app.use('/api', contextRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log(' New WebSocket connection established');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received message:', data);

      // Echo back for now - can be extended for real-time updates
      ws.send(JSON.stringify({
        type: 'response',
        data: 'Message received',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error(' WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error(' WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Kloud-scaler K8s Monitoring',
    timestamp: new Date().toISOString()
  }));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(` Kloud-scaler K8s Monitoring Server running on port ${PORT}`);
  console.log(` API endpoints available at http://localhost:${PORT}/api`);
  console.log(` WebSocket server running on ws://localhost:${PORT}`);
  console.log(` Health check available at http://localhost:${PORT}/health`);
});
