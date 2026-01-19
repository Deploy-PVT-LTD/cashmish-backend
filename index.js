
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import passport from 'passport';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes.js';
import passportConfig from './config/passport.js';

const app = express();
const PORT = process.env.PORT || 5000;

//middleware
app.use(bodyParser.json());
app.use(passport.initialize());
passportConfig(passport);
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Reseller Backend API');
});

//routes
app.use("/api/auth", authRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});