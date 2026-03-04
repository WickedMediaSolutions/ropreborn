/**
 * ROM World Builder Backend Server
 * Express.js API server for area/room editing
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import areasRoutes from './routes/areas.js';
import roomsRoutes from './routes/rooms.js';
import mobilesRoutes from './routes/mobiles.js';
import objectsRoutes from './routes/objects.js';
import resetsRoutes from './routes/resets.js';
import shopsRoutes from './routes/shops.js';
import specialsRoutes from './routes/specials.js';
import validateRoutes from './routes/validate.js';
import placementsRoutes from './routes/placements.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ROM World Builder API running' });
});

// API Routes
app.use('/api/areas', areasRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/mobiles', mobilesRoutes);
app.use('/api/objects', objectsRoutes);
app.use('/api/resets', resetsRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/specials', specialsRoutes);
app.use('/api/validate', validateRoutes);
app.use('/api/placements', placementsRoutes);

// Serve frontend (if built)
const frontendBuildPath = path.join(__dirname, '../../frontend/build');
app.use(express.static(frontendBuildPath, { maxAge: '1h' }));

// Fallback to frontend index.html for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(frontendBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Not found' });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  ROM World Builder API                     ║
║  Server running on port ${PORT}                  ║
║  http://localhost:${PORT}                         ║
║  API: http://localhost:${PORT}/api               ║
╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
