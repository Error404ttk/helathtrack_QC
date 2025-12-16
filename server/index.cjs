const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db.cjs');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3004;

app.use(cors());
app.use(bodyParser.json());

// --- AUTH ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Note: In production, use bcrypt to compare hashed passwords
    const [rows] = await db.query('SELECT * FROM users WHERE username = ? AND password_hash = ?', [username, password]);
    if (rows.length > 0) {
      res.json({ success: true, user: { username: rows[0].username, role: rows[0].role } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DEPARTMENTS ---
app.get('/api/departments', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM departments ORDER BY created_at ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/departments', async (req, res) => {
  const { name } = req.body;
  const id = `d${Date.now()}`; // Generate simple ID
  try {
    await db.query('INSERT INTO departments (id, name) VALUES (?, ?)', [id, name]);
    res.json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TEAMS ---
app.get('/api/teams', async (req, res) => {
  try {
    // Select and rename columns to match frontend types (camelCase)
    const [rows] = await db.query(`
      SELECT 
        id, 
        department_id as departmentId, 
        name, 
        category, 
        service_profile_status as serviceProfileStatus, 
        cqi_status as cqiStatus,
        cqi_submitted_count as cqiSubmittedCount,
        cqi_color as cqiColor,
        last_updated as lastUpdated 
      FROM teams 
      ORDER BY last_updated DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teams', async (req, res) => {
  const { departmentId, name, category } = req.body;
  const id = `t${Date.now()}`;
  try {
    await db.query(
      'INSERT INTO teams (id, department_id, name, category, service_profile_status, cqi_status, cqi_submitted_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, departmentId, name, category, 'PENDING', 'PENDING', 0]
    );
    // Return the created object matching frontend structure
    res.json({
      id,
      departmentId,
      name,
      category,
      serviceProfileStatus: 'PENDING',
      cqiStatus: 'PENDING',
      cqiSubmittedCount: 0,
      cqiColor: null,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/teams/:id/status', async (req, res) => {
  const { id } = req.params;
  const { type, status } = req.body; // type: 'SP' or 'CQI', status: 'SUBMITTED' or 'PENDING'

  let column = type === 'SP' ? 'service_profile_status' : 'cqi_status';

  try {
    await db.query(`UPDATE teams SET ${column} = ? WHERE id = ?`, [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/teams/:id/cqi-info', async (req, res) => {
  const { id } = req.params;
  const { cqiSubmittedCount, cqiColor } = req.body;
  try {
    await db.query(
      'UPDATE teams SET cqi_submitted_count = ?, cqi_color = ? WHERE id = ?',
      [cqiSubmittedCount, cqiColor, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM teams WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SETTINGS ---
app.get('/api/settings/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
    const value = rows.length > 0 ? rows[0].setting_value : null;
    res.json({ value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  try {
    await db.query(`
      INSERT INTO settings (setting_key, setting_value) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE setting_value = ?
    `, [key, value, value]);
    res.json({ success: true, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
