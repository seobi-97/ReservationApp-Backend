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
        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/logout', async (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

export default router;
