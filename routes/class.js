import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 모든 수업 예약 조회 (날짜 필터링 지원)
router.get('/list', async (req, res) => {
    try {
        const { date, start_date, end_date } = req.query;
        
        let query = `
            SELECT 
                c.*,
                u.name as creator_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'participant_id', p.id,
                            'user_id', p.user_id,
                            'status', p.status,
                            'reserved_at', p.reserved_at
                        )
                    ) FILTER (WHERE p.id IS NOT NULL), 
                    '[]'::json
                ) as participants
            FROM classes c
            LEFT JOIN users u ON c.creator_id = u.id
            LEFT JOIN participants p ON c.id = p.class_id
        `;
        
        const queryParams = [];
        const whereConditions = [];
        
        // 특정 날짜 조회
        if (date) {
            whereConditions.push(`DATE(c.start_date) = $${queryParams.length + 1}`);
            queryParams.push(date);
        }
        
        // 날짜 범위 조회
        if (start_date && end_date) {
            whereConditions.push(`DATE(c.start_date) BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`);
            queryParams.push(start_date, end_date);
        } else if (start_date) {
            whereConditions.push(`DATE(c.start_date) >= $${queryParams.length + 1}`);
            queryParams.push(start_date);
        } else if (end_date) {
            whereConditions.push(`DATE(c.start_date) <= $${queryParams.length + 1}`);
            queryParams.push(end_date);
        }
        
        // WHERE 절 추가
        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        query += `
            GROUP BY c.id, u.name
            ORDER BY c.start_date DESC
        `;

        const { rows } = await pool.query(query, queryParams);
        res.json(rows);
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
                u.name as creator_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'participant_id', p.id,
                            'user_id', p.user_id,
                            'status', p.status,
                            'reserved_at', p.reserved_at
                        )
                    ) FILTER (WHERE p.id IS NOT NULL), 
                    '[]'::json
                ) as participants
            FROM classes c
            LEFT JOIN users u ON c.creator_id = u.id
            LEFT JOIN participants p ON c.id = p.class_id
            WHERE c.id = $1
            GROUP BY c.id, u.name
        `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        res.json(rows[0]);
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
