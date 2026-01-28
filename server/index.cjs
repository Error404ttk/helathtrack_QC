const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./db.cjs');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3004;

app.use(cors({
  origin: true, // Allow all origins for now in dev, or specify
  credentials: true // Important for cookies
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Simple Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.cookies.authToken;
  if (token) {
    next();
  } else {
    res.status(401).send('Unauthorized: Please login to view this file.');
  }
};

// --- AUTH ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Note: In production, use bcrypt to compare hashed passwords
    const [rows] = await db.query('SELECT * FROM users WHERE username = ? AND password_hash = ?', [username, password]);
    if (rows.length > 0) {
      // Set HTTP-only cookie
      res.cookie('authToken', 'logged-in', {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
      res.json({ success: true, user: { id: rows[0].id, username: rows[0].username, role: rows[0].role } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ success: true });
});

// ... (User Management routes) ...

// ... (File Upload Config) ...

// Serve uploads statically - PROTECTED
// Serve uploads statically - MOVED to after uploadDir definition

// --- USER MANAGEMENT ---
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, role, created_at FROM users ORDER BY username ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if user exists
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    await db.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, password, role]
    ); // In real app, hash password!

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { password, role } = req.body;

  try {
    if (password) {
      await db.query('UPDATE users SET password_hash = ?, role = ? WHERE id = ?', [password, role, id]);
    } else {
      await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
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
        service_profile_file as serviceProfileFile,
        cqi_file as cqiFile,
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
      serviceProfileFile: null,
      cqiFile: null,
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

// --- FILE UPLOAD ---
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Unique filename: teamId-type-timestamp.pdf
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Serve uploads statically
// Serve uploads statically - PROTECTED
app.use('/api/uploads', authMiddleware, express.static(uploadDir));

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type' });
  }
  res.json({ filename: req.file.filename, path: `/api/uploads/${req.file.filename}` });
});

app.put('/api/teams/:id/file', async (req, res) => {
  const { id } = req.params;
  const { type, filename } = req.body; // type: 'SP' or 'CQI', filename: string or null

  if (!['SP', 'CQI'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const column = type === 'SP' ? 'service_profile_file' : 'cqi_file';

  try {
    // 1. Get current file to delete it from disk if needed
    const [rows] = await db.query(`SELECT ${column} as currentFile FROM teams WHERE id = ?`, [id]);
    if (rows.length > 0 && rows[0].currentFile) {
      const oldFilePath = path.join(uploadDir, rows[0].currentFile);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old file: ${oldFilePath}`);
        } catch (err) {
          console.error(`Failed to delete old file: ${err.message}`);
          // Continue execution - don't block DB update
        }
      }
    }

    // 2. Update DB
    await db.query(`UPDATE teams SET ${column} = ? WHERE id = ?`, [filename, id]);
    res.json({ success: true, filename });
  } catch (err) {
    // Determine if error is due to missing column and hint user
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ error: 'Database schema mismatch: missing file columns. Please add service_profile_file and cqi_file columns to teams table.' });
    }
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
