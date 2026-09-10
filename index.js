import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeSocket } from './socket.js';
import passport from 'passport';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes.js';
import passportConfig from './config/passport.js';
import mobileRoutes from './routes/mobileRoute.js';
import formRoutes from './routes/formRoutes.js';
import pickupRoutes from './routes/pickupRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import priceConfigRoutes from './routes/priceConfigRoutes.js';
import bankDetailsRoutes from './routes/bankDetailsRoutes.js';
import couponRoutes from './routes/couponRoutes.js';

import reviewRoutes from './routes/reviewRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import draftOrderRoutes from './routes/draftOrderRoutes.js';
import trafficRoutes from './routes/trafficRoutes.js';
import smsRoutes from './routes/smsRoutes.js';
import { trackTraffic } from './middleware/trafficTracker.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Improve API performance by compressing response bodies
app.use(compression({
  level: 6,
  threshold: 100 * 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  transports: ['websocket', 'polling'] // Allow fallback for Render
});

// Initialize WebSocket setup
initializeSocket(io);

//middleware
app.use(bodyParser.json());
app.use(passport.initialize());
passportConfig(passport);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(trackTraffic);

// Welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the Reseller Backend API v1.0.1 (Traffic Tracking Active)');
});

//routes
app.use("/api/traffic", trafficRoutes); // Moved to top for priority
app.use("/api/auth", authRoutes);
app.use("/api/mobiles", mobileRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/pickup", pickupRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/price-config", priceConfigRoutes);
app.use("/api/bankDetails", bankDetailsRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/drafts", draftOrderRoutes);
app.use("/api/sms", smsRoutes);

//connect to database and start server
connectDB();

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});