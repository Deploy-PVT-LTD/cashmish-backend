import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
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

const app = express();
const PORT = process.env.PORT || 5000;

//middleware
app.use(bodyParser.json());
app.use(passport.initialize());
passportConfig(passport);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Welcome to the Reseller Backend API');
});

//routes
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

//connect to database and start server
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});