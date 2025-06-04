import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import classRoutes from './routes/class.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();
const allowedOrigins = ['http://localhost:8081', 'http://localhost:3000'];

app.use(express.json());
app.use(
    cors({
        origin: (origin, callback) => {
            if (allowedOrigins.includes(origin) || !origin) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    })
);

app.use(cookieParser());
app.use('/auth', authRoutes);
app.use('/class', classRoutes);

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
