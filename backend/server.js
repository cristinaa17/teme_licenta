const express = require('express');
const axios = require('axios');
const https = require('https');
const cors = require('cors');
const nodemailer = require('nodemailer');
process.env.PGCLIENTENCODING = 'UTF8';

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

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'temelicentaulbs@gmail.com',
    pass: 'udix aeud eouf ndvv',
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log('SMTP ERROR:', error);
  } else {
    console.log('SMTP READY');
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

  if (!title || !description) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const countRes = await pool.query(`SELECT COUNT(*)::int FROM themes WHERE professor_email=$1`, [
      professor_email,
    ]);

    const userRes = await pool.query(
      `SELECT required_themes, extra_themes FROM users WHERE email=$1`,
      [professor_email],
    );

    const created = countRes.rows[0].count;
    const required = userRes.rows[0].required_themes || 0;
    const extra = userRes.rows[0].extra_themes || 0;

    const maxAllowed = required + extra;

    if (created >= maxAllowed) {
      return res.status(400).json({
        message: `Ai voie maxim ${maxAllowed} teme`,
      });
    }
    const result = await pool.query(
      `INSERT INTO themes 
  (title, description, professor_email, faculty_id, specialization_id, faculty_name, specialization_name)
  VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
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
        u.name as professor_name,
        (
          SELECT COUNT(*) 
          FROM theme_likes l
          WHERE l.theme_id = t.id
        )::int as likes
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

    query += ` ORDER BY t.id DESC`;

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching themes');
  }
});

app.delete('/api/themes/:id', async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  try {
    const result = await pool.query(
      `DELETE FROM themes 
       WHERE id = $1 AND professor_email = $2
       RETURNING *`,
      [id, email],
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    res.json({ message: 'Theme deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting theme');
  }
});

app.put('/api/themes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, email } = req.body;

  try {
    const result = await pool.query(
      `UPDATE themes
       SET title = $1, description = $2
       WHERE id = $3 AND professor_email = $4
       RETURNING *`,
      [title, description, id, email],
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating theme');
  }
});

app.post('/api/applications', async (req, res) => {
  const { theme_id, student_email, student_name } = req.body;

  try {
    const existing = await pool.query(
      `SELECT * FROM applications 
       WHERE theme_id=$1 AND student_email=$2`,
      [theme_id, student_email],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: 'Ai aplicat deja la această temă',
      });
    }

    const accepted = await pool.query(
      `SELECT * FROM applications 
       WHERE theme_id=$1 AND status='accepted'`,
      [theme_id],
    );

    if (accepted.rows.length > 0) {
      return res.status(400).json({
        message: 'Tema este deja ocupată',
      });
    }

    const result = await pool.query(
      `INSERT INTO applications (theme_id, student_email, student_name)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [theme_id, student_email, student_name],
    );

    const theme = await pool.query(
      `SELECT professor_email, title
       FROM themes
       WHERE id=$1`,
      [theme_id],
    );

    const professorEmail = theme.rows[0].professor_email;
    const themeTitle = theme.rows[0].title;

    try {
      await transporter.sendMail({
        from: 'temelicentaulbs@gmail.com',
        to: professorEmail,
        subject: 'Student nou pentru tema ta',
        text: `
Studentul ${student_name} (${student_email})
a aplicat la tema:

${themeTitle}

Intră în platformă pentru a vedea aplicanții.
`,
      });
    } catch (mailErr) {
      console.log('Email error:', mailErr);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error applying');
  }
});

app.get('/api/themes/:id/applications', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM applications
       WHERE theme_id=$1`,
      [id],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

app.post('/api/applications/:id/accept', async (req, res) => {
  const { id } = req.params;

  try {
    const appRes = await pool.query(
      `UPDATE applications
       SET status='accepted'
       WHERE id=$1
       RETURNING *`,
      [id],
    );

    const themeId = appRes.rows[0].theme_id;

    await pool.query(
      `UPDATE themes
       SET status='taken'
       WHERE id=$1`,
      [themeId],
    );

    res.json({ message: 'Student accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

app.post('/api/themes/:id/like', async (req, res) => {
  const { id } = req.params;
  const { visitor_id } = req.body;

  try {
    const existing = await pool.query(
      `SELECT 1 FROM theme_likes
       WHERE theme_id=$1 AND visitor_id=$2`,
      [id, visitor_id],
    );

    let liked = false;

    if (existing.rows.length === 0) {
      await pool.query('INSERT INTO theme_likes(theme_id, visitor_id) VALUES($1,$2)', [
        id,
        visitor_id,
      ]);
      liked = true;
    }

    const count = await pool.query(
      `SELECT COUNT(*)::int as likes FROM theme_likes WHERE theme_id=$1`,
      [id],
    );

    res.json({
      liked: liked,
      likes: count.rows[0].likes,
      message: existing.rows.length === 0 ? 'Like added' : 'Already liked',
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error liking theme');
  }
});

app.post('/api/admin/impersonate', async (req, res) => {
  const { email } = req.body;

  const user = await pool.query('SELECT * FROM users WHERE email=$1', [email]);

  res.json(user.rows[0]);
});

app.get('/api/professors', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.email,
        u.name,
        COALESCE(u.required_themes,0) AS required_themes,
COALESCE(u.extra_themes,0) AS extra_themes,
COUNT(t.id)::int AS created_themes
      FROM users u
      LEFT JOIN themes t 
        ON u.email = t.professor_email
      WHERE u.role = 'profesor'
      GROUP BY u.email, u.name, u.required_themes, u.extra_themes
      ORDER BY u.name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('PROFESSORS ERROR:', err);
    res.status(500).send('Error');
  }
});

app.put('/api/admin/set-required-themes', async (req, res) => {
  const { email, count, extra } = req.body;

  try {
    await pool.query(
      `UPDATE users
       SET required_themes=$1, extra_themes=$2
       WHERE email=$3`,
      [count, extra, email],
    );

    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

app.get('/api/professor/theme-progress/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const required = await pool.query(
      `SELECT required_themes, extra_themes
       FROM users
       WHERE email=$1`,
      [email],
    );

    const created = await pool.query(
      `SELECT COUNT(*)::int
       FROM themes
       WHERE professor_email=$1`,
      [email],
    );

    res.json({
      required: required.rows[0].required_themes || 0,
      extra: required.rows[0].extra_themes || 0,
      created: created.rows[0].count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

app.post('/api/reminder', async (req, res) => {
  const { email } = req.body;

  await pool.query(`INSERT INTO notifications (email, message) VALUES ($1, $2)`, [
    email,
    'Nu ai atins numărul de teme obligatorii',
  ]);

  console.log(`Reminder trimis către ${email}`);

  res.json({ success: true });
});

app.get('/api/notifications/:email', async (req, res) => {
  const { email } = req.params;

  const result = await pool.query(
    `SELECT * FROM notifications 
     WHERE email = $1 AND seen = false
     ORDER BY created_at DESC`,
    [email],
  );

  res.json(result.rows);
});

app.post('/api/notifications/seen', async (req, res) => {
  const { email } = req.body;

  await pool.query('UPDATE notifications SET seen = true WHERE email = $1', [email]);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
