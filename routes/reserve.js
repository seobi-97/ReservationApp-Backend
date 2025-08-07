import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 수업 예약 하기
router.post('/', async (req, res) => {
    const { user_id, class_id } = req.body;
    console.log(user_id, class_id, req.body);
    const status = 'pending';
    try {
        // 수업 존재 확인
        const checkClass = await pool.query('SELECT * FROM classes WHERE id = $1', [class_id]);
        if (checkClass.rows.length === 0) {
            return res.status(400).json({ error: '존재하지 않는 수업입니다.' });
        }
        // 수업 생성자 확인
        const checkCreator = await pool.query('SELECT user_id FROM classes WHERE id = $1', [class_id]);
        if (checkCreator.rows[0].user_id === user_id) {
            return res.status(400).json({ error: '자신의 수업은 예약할 수 없습니다.' });
        }
        // 예약 존재 확인
        const checkReservation = await pool.query('SELECT * FROM participants WHERE user_id = $1 AND class_id = $2', [user_id, class_id]);
        if (checkReservation.rows.length > 0) {
            return res.status(400).json({ error: '이미 예약된 수업입니다.' });
        }
        // 예약 생성
        const newClass = await pool.query('INSERT INTO participants (user_id, class_id, status) VALUES ($1, $2, $3) RETURNING *', [user_id, class_id, status]);

        res.json(newClass.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

// 수업 예약 수정
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id, class_id } = req.body;

    try {
        // 수업 존재 확인
        const checkClass = await pool.query('SELECT * FROM classes WHERE id = $1', [class_id]);
        if (checkClass.rows.length === 0) {
            return res.status(400).json({ error: '존재하지 않는 수업입니다.' });
        }
        // 예약 존재 확인
        const checkReservation = await pool.query('SELECT * FROM participants WHERE id = $1', [id]);
        if (checkReservation.rows.length === 0) {
            return res.status(400).json({ error: '존재하지 않는 예약입니다.' });
        }
        // 예약 수정
        const updatedClass = await pool.query('UPDATE participants SET user_id = $1, class_id = $2 WHERE id = $3 RETURNING *', [user_id, class_id, id]);
        res.json(updatedClass.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update reservation' });
    }
});

// 수업 예약 삭제
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // 예약 존재 확인
        const checkReservation = await pool.query('SELECT * FROM participants WHERE id = $1', [id]);
        if (checkReservation.rows.length === 0) {
            return res.status(400).json({ error: '존재하지 않는 예약입니다.' });
        }
        // 예약 삭제
        await pool.query('DELETE FROM participants WHERE id = $1', [id]);

        res.json({ message: 'Reservation deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete reservation' });
    }
});

export default router;
