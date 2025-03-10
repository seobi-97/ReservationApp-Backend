import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 모든 수업 예약 조회
router.get('/reserve', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM classes');
        res.json(rows);
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch classes'});
    }
});

// 수업 예약 추가
router.post('/reserve', async (req, res) => {
    const { userId, classId } = req.body;

    try {
        const newClass = await pool.query(
            'INSERT INTO classes (userId, classId) VALUES ($1, $2) RETURNING *',
            [userId, classId]
        );
        
        res.json(newClass.rows[0]);
    } catch (error) {
        res.status(500).json({error: 'Failed to create class'});
    }
});

// 수업 예약 수정
router.put('/reserve/:id', async (req, res) => {
    const { id } = req.params;
    const { userId, classId } = req.body;
    
    try {
        const updatedClass = await pool.query(
            'UPDATE classes SET userId = $1, classId = $2 WHERE id = $3 RETURNING *',
            [userId, classId, id]
        );
        
        res.json(updatedClass.rows[0]);
    } catch (error) {
        res.status(500).json({error: 'Failed to update class'});
    }
});

// 수업 예약 삭제
router.delete('/reserve/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM classes WHERE id = $1', [id]);
        
        res.json({message: 'Class deleted successfully'});
    } catch (error) {
        res.status(500).json({error: 'Failed to delete class'});
    }
});

export default router;

