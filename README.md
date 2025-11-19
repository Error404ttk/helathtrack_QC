<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# HealthTrack QC Dashboard
ระบบติดตามเอกสารคุณภาพสำหรับศูนย์ข้อมูล

## Features
- Frontend: React with TypeScript, Vite
- Backend: Node.js with Express
- Database: MySQL
- Process Management: PM2

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure database:
   - Edit `server/db.cjs` with your database credentials
   - Create database and run the SQL schema

3. Set environment variables (optional):
   - Create `.env.local` for API keys if needed

## Running the Application

### Development Mode
```bash
# Frontend only
npm run dev

# Backend only
node server/index.cjs
```

### Production with PM2
```bash
# Start both frontend and backend
pm2 start ecosystem.config.cjs

# Check status
pm2 list

# View logs
pm2 logs
```

## Port Configuration
- Frontend: http://localhost:3005
- Backend API: http://localhost:3004

## Database Setup
Update the database configuration in `server/db.cjs`:
```javascript
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'your_username',
  password: 'your_password',
  database: 'your_database',
  // ... other settings
});
