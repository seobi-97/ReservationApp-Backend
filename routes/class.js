import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 모든 수업 예약 조회
router.get('/list', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                c.*,
                json_agg(
                    json_build_object(
                        'participant_id', p.id,
                        'user_id', p.user_id,
                        'status', p.status,
                        'reserved_at', p.reserved_at
                    )
                ) as participants
            FROM classes c
            LEFT JOIN participants p ON c.id = p.class_id
            GROUP BY c.id
            ORDER BY c.start_date DESC
        `);

        // participants가 null인 경우 빈 배열로 변환
        const formattedRows = rows.map((row) => ({
            ...row,
            participants: row.participants[0] === null ? [] : row.participants,
        }));

        res.json(formattedRows);
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ error: 'Failed to fetch classes' });
    }
});

// 특정 수업 상세 조회
router.get('/list/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(
            `
            SELECT 
                c.*,
                json_agg(
                    json_build_object(
                        'participant_id', p.id,
                        'user_id', p.user_id,
                        'status', p.status,
                        'reserved_at', p.reserved_at
                    )
                ) as participants
            FROM classes c
            LEFT JOIN participants p ON c.id = p.class_id
            WHERE c.id = $1
            GROUP BY c.id
        `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        // participants가 null인 경우 빈 배열로 변환
        const formattedRow = {
            ...rows[0],
            participants: rows[0].participants[0] === null ? [] : rows[0].participants,
        };

        res.json(formattedRow);
    } catch (error) {
        console.error('Error fetching class:', error);
        res.status(500).json({ error: 'Failed to fetch class' });
    }
});

// 수업 생성
router.post('/create', async (req, res) => {
    const { title, creator_id, start_date, description, status, capacity } = req.body;

    try {
        const newClass = await pool.query('INSERT INTO classes (title, creator_id, start_date, description, status, capacity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [
            title,
            creator_id,
            start_date,
            description,
            status,
            capacity,
        ]);
        res.json(newClass.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create class' });
    }
});

// 수업 수정
router.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { title, creator_id, start_date, description, status, capacity } = req.body;

    try {
        const updatedClass = await pool.query(
            'UPDATE classes SET title = $1, creator_id = $2, start_date = $3, description = $4, status = $5, capacity = $6 WHERE id = $7 RETURNING *',
            [title, creator_id, start_date, description, status, capacity, id]
        );
        res.json(updatedClass.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update class' });
    }
});

export default router;
