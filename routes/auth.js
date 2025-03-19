import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import regex from '../utils/regex.js';
const router = express.Router();

router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    // 이메일 정규식
    if (!regex.validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // 이름 정규식
    if (!regex.validateName(name)) {
        return res.status(400).json({ error: 'Invalid name format' });
    }

    // 비밀번호 최소 8자 이상, 영문, 숫자, 특수문자 포함
    if (!regex.validatePassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one letter, one number, and one special character' });
    }

    try {
        // 이메일 중복 체크
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *', [name, email, hashedPassword]);

        res.json({ user: newUser.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Signup failed' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 이메일 정규식
    if (!regex.validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // 비밀번호 최소 8자 이상, 영문, 숫자, 특수문자 포함
    if (!regex.validatePassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one letter, one number, and one special character' });
    }

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        // 유저 존재 여부 확인
        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // 토큰 발행
        const accessToken = jwt.sign({ id: user.rows[0].id }, process.env.JWT_ACCESSTOKEN, {
            expiresIn: '1h',
        });
        const refreshToken = jwt.sign({ id: user.rows[0].id }, process.env.JWT_REFRESHTOKEN, {
            expiresIn: '7d',
        });

        // 토큰 존재 여부 확인
        const invalidToken = await pool.query('SELECT * FROM tokens WHERE user_id = $1', [user.rows[0].id]);
        if (invalidToken.rows.length > 0) {
            await pool.query('UPDATE tokens SET refresh_token = $1, expires_at = $2 WHERE user_id = $3', [
                refreshToken,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                user.rows[0].id,
            ]);
        } else {
            await pool.query('INSERT INTO tokens (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)', [
                user.rows[0].id,
                refreshToken,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ]);
        }

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            maxAge: 1 * 60 * 60 * 1000,
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ user: user.rows[0], accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/token', async (req, res) => {
    try {
        // 쿠키에서 리프레시 토큰을 가져옴
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                error: '리프레시 토큰이 없습니다',
            });
        }

        // 리프레시 토큰 검증을 Promise로 처리
        const user = await jwt.verify(refreshToken, process.env.JWT_REFRESHTOKEN);

        // 토큰 만료 시간 확인
        if (user.exp < Date.now() / 1000) {
            return res.status(401).json({
                error: '리프레시 토큰이 만료되었습니다',
            });
        }

        // 새로운 액세스 토큰 발급
        const accessToken = jwt.sign({ id: user.id }, process.env.JWT_ACCESSTOKEN, { expiresIn: '1h' });

        // 쿠키에 새 액세스 토큰 설정
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            maxAge: 1 * 60 * 60 * 1000,
        });

        res.json({
            message: '새로운 액세스 토큰이 발급되었습니다',
            accessToken,
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                error: '유효하지 않은 리프레시 토큰입니다',
            });
        }

        res.status(500).json({
            error: '토큰 갱신 중 오류가 발생했습니다',
        });
    }
});

router.post('/logout', async (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
});

export default router;
