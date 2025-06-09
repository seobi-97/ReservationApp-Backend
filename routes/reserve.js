import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 수업 예약 하기
router.post('/reserve', async (req, res) => {
    const { userId, classId } = req.body;
    const status = 'pending';
    try {
        const newClass = await pool.query('INSERT INTO participants (user_id, class_id, status) VALUES ($1, $2, $3) RETURNING *', [userId, classId, status]);

        res.json(newClass.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

// 수업 예약 수정
router.put('/reserve/:id', async (req, res) => {
    const { id } = req.params;
    const { userId, classId } = req.body;

    try {
        const updatedClass = await pool.query('UPDATE participants SET user_id = $1, class_id = $2 WHERE id = $3 RETURNING *', [userId, classId, id]);

        res.json(updatedClass.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update reservation' });
    }
});

// 수업 예약 삭제
router.delete('/reserve/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM participants WHERE id = $1', [id]);

        res.json({ message: 'Reservation deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete reservation' });
    }
});

export default router;
