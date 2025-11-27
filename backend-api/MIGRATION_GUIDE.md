# Migration Guide: Azure SQL Server to PostgreSQL

## 🎯 Quick Start

### Step 1: Choose Your Database Provider

#### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Sign up and create a new project
3. Wait for database to initialize (~2 minutes)
4. Go to Project Settings → Database
5. Copy the connection details

#### Option B: Neon
1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string
4. Extract the connection details

#### Option C: Railway
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy connection details from Variables tab

---

### Step 2: Update Dependencies

```bash
cd backend-api
npm uninstall mssql
npm install pg
```

Or with pnpm:
```bash
pnpm remove mssql
pnpm add pg
```

---

### Step 3: Update Environment Variables

Create a `.env` file in `backend-api/` with:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this

# PostgreSQL Connection
DB_HOST=your-database-host.com
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_SSL=true

# For Vercel deployment
CORS_ORIGIN=http://localhost:3001,https://your-app.vercel.app
```

**For Supabase specifically:**
- DB_HOST: `db.xxxxxxxxxxxxx.supabase.co`
- DB_NAME: `postgres`
- DB_USER: `postgres`
- DB_PASSWORD: Your project password

---

### Step 4: Run the Schema

1. Copy the contents of `schema.sql`
2. Run it in your database:

**Supabase:** 
- Go to SQL Editor in dashboard
- Paste and run the schema

**Neon:**
- Use their SQL editor or connect via psql
- Run the schema file

**Railway:**
- Connect via provided psql command
- Run: `psql <connection-string> -f schema.sql`

---

### Step 5: Update Database Connection

Replace the contents of `db.js`:

```javascript
const { Pool } = require('pg');

const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(config);

pool.on('connect', () => {
    console.log('✓ Database connected');
});

pool.on('error', (err) => {
    console.error('Database error:', err);
});

module.exports = { pool };
```

---

### Step 6: Update All Controllers

The main differences between MSSQL and PostgreSQL:

#### Before (MSSQL):
```javascript
const { poolPromise, sql } = require('../db');
const pool = await poolPromise;

await pool.request()
    .input('Username', sql.VarChar(50), username)
    .query(`INSERT INTO users (username) VALUES (@Username)`);
```

#### After (PostgreSQL):
```javascript
const { pool } = require('../db');

await pool.query(
    'INSERT INTO users (username) VALUES ($1)',
    [username]
);
```

**Key Changes:**
- `@Parameter` → `$1, $2, $3` (numbered placeholders)
- `pool.request().input().query()` → `pool.query()`
- `result.recordset` → `result.rows`
- `result.rowsAffected[0]` → `result.rowCount`
- Remove all `sql.VarChar()`, `sql.Int()` type definitions

---

### Step 7: Update Server Configuration

In `server.js`, update the CORS configuration to include your Vercel URL:

```javascript
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
```

---

### Step 8: Test Locally

```bash
cd backend-api
npm start
# or
pnpm start
```

Test endpoints:
- `http://localhost:3000/api/users` - Should return empty array or seed users
- Register a new user via POST to `/api/users/register`

---

### Step 9: Deploy Backend

You have several options:

#### Option A: Render (Free tier available)
1. Push code to GitHub
2. Go to render.com
3. New → Web Service
4. Connect your repo
5. Add environment variables
6. Deploy!

#### Option B: Railway
- Includes both database and backend hosting
- Deploy directly from GitHub

#### Option C: Fly.io
- Good free tier
- Requires a Dockerfile (can generate one)

---

### Step 10: Update Frontend API URL

In `frontend-app/utils/api.ts`, update the base URL to your deployed backend:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
```

Add to Vercel environment variables:
```
NEXT_PUBLIC_API_URL=https://your-backend.render.com
```

---

## 🔧 Common Issues

### Issue: Connection Timeout
- Check if SSL is enabled/disabled correctly
- Verify firewall rules (Supabase requires SSL)

### Issue: "relation does not exist"
- Make sure you ran the schema.sql file completely
- Check you're connecting to the right database

### Issue: Authentication failed
- Double-check password (no extra spaces)
- Verify username is correct (usually 'postgres' for Supabase)

---

## 📊 Comparison Table

| Feature | Azure SQL | Supabase | Neon | Railway |
|---------|-----------|----------|------|---------|
| Type | MSSQL | PostgreSQL | PostgreSQL | PostgreSQL |
| Free Tier | ❌ Locked | ✅ 500MB | ✅ 10GB | ✅ $5 credit |
| Auto-scaling | ❌ | ❌ | ✅ | ❌ |
| Vercel Integration | ⚠️ | ✅ | ✅ | ✅ |
| Built-in Auth | ❌ | ✅ | ❌ | ❌ |
| Real-time | ❌ | ✅ | ❌ | ❌ |

---

## 🚀 Next Steps

After successful migration:
1. Test all endpoints thoroughly
2. Update any hardcoded backend URLs in frontend
3. Set up proper error logging (consider Sentry)
4. Enable database backups
5. Add database connection pooling optimizations

---

## 🆘 Need Help?

If you run into issues:
1. Check the database logs in your provider's dashboard
2. Verify all environment variables are set
3. Test database connection separately
4. Check backend logs for specific errors

