const express = require('express');
const axios = require('axios');
const https = require('https');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
const pool = require('./db');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('DB ERROR', err);
  } else {
    console.log('DB CONNECTED', res.rows);
  }
});

app.post('/api/users', async (req, res) => {
  console.log('BODY:', req.body);

  const { email, name } = req.body || {};

  if (!email || !name) {
    return res.status(400).json({ error: 'email si name lipsesc' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (email, name)
VALUES ($1, $2)
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
RETURNING *`,
      [email, name],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving user');
  }
});

app.get('/api/faculties', async (req, res) => {
  try {
    const response = await axios.get('https://schedule.ulbsibiu.ro/api/faculties', {
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    res.json(response.data);
  } catch (error) {
    console.error('ULBS ERROR:', error.message);

    res.json({
      success: true,
      data: [
        { id: 1, name: 'Facultatea de Inginerie' },
        { id: 2, name: 'Facultatea de Stiinte' },
      ],
    });
  }
});

app.get('/api/specializations/:facultyId', async (req, res) => {
  try {
    const { facultyId } = req.params;

    const response = await axios.get(
      `https://schedule.ulbsibiu.ro/api/faculties/${facultyId}/study-formations?level=3`,
      {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      },
    );

    res.json(response.data);
  } catch (error) {
    console.error('SPECIALIZATIONS ERROR:', error.message);

    res.json({
      success: true,
      data: [
        { id: 1, name: 'Calculatoare' },
        { id: 2, name: 'Automatica' },
      ],
    });
  }
});

app.post('/api/themes', async (req, res) => {
  const {
    title,
    description,
    professor_email,
    faculty_id,
    specialization_id,
    faculty_name,
    specialization_name,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO themes 
  (title, description, professor_email, faculty_id, specialization_id, faculty_name, specialization_name)
  VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        title,
        description,
        professor_email,
        faculty_id,
        specialization_id,
        faculty_name,
        specialization_name,
      ],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving theme');
  }
});

app.get('/api/themes', async (req, res) => {
  const { facultyId, specializationId, professor } = req.query;

  try {
    let query = `
      SELECT 
        t.*,
        u.name as professor_name
      FROM themes t
      JOIN users u ON t.professor_email = u.email
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    if (facultyId) {
      query += ` AND t.faculty_id = $${index++}`;
      values.push(facultyId);
    }

    if (specializationId) {
      query += ` AND t.specialization_id = $${index++}`;
      values.push(specializationId);
    }

    if (professor) {
      query += ` AND LOWER(u.name) LIKE LOWER($${index++})`;
      values.push(`%${professor}%`);
    }

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching themes');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
