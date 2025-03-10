import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import classRoutes from './routes/class.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use('/auth', authRoutes);
app.use('/class', classRoutes);

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
