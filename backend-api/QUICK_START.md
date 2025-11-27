# 🚀 Quick Start Guide - PostgreSQL Migration

## Choose Your Path

### 🟢 Path 1: Supabase (Easiest, Recommended)

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up (free, no credit card)
   - Create new project (wait 2-3 minutes)

2. **Get Your Credentials**
   - Go to Project Settings → Database
   - Copy these values:
     ```
     Host: db.xxxxxxxxxxxxx.supabase.co
     Port: 5432
     Database: postgres
     User: postgres
     Password: [your project password]
     ```

3. **Run the Schema**
   - Go to SQL Editor in Supabase dashboard
   - Copy entire contents of `schema.sql`
   - Paste and click "Run"
   - ✅ You should see "Success" message

4. **Update Your Code**
   ```bash
   # Install PostgreSQL driver
   pnpm remove mssql
   pnpm add pg
   
   # Or with npm
   npm uninstall mssql
   npm install pg
   ```

5. **Create `.env` file** in `backend-api/`:
   ```env
   PORT=3000
   JWT_SECRET=your_super_secret_key_change_this_123456789
   
   DB_HOST=db.xxxxxxxxxxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your_supabase_password
   DB_SSL=true
   ```

6. **Replace `db.js` content** with:
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

   module.exports = { pool };
   ```

7. **Update Controllers** - Use the new `*_postgres.js` files as reference:
   - Replace `result.recordset` with `result.rows`
   - Replace `result.rowsAffected[0]` with `result.rowCount`
   - Replace `@Parameter` with `$1, $2, $3...`
   - Remove all `.input()` calls and SQL type definitions

8. **Test It**
   ```bash
   pnpm start
   # or
   npm start
   ```
   
   Visit: http://localhost:3000/api/users

9. **Deploy Backend** (Pick one):
   - **Render.com** (Easiest): Connect GitHub, add env vars, deploy
   - **Railway.app**: Same as Render, auto-deploys on push
   - **Fly.io**: Good performance, requires Dockerfile

10. **Update Frontend** - Add to Vercel environment:
    ```
    NEXT_PUBLIC_API_URL=https://your-backend-url.com
    ```

---

### 🔵 Path 2: Neon (Serverless PostgreSQL)

1. **Create Neon Account**
   - Go to https://neon.tech
   - Sign up (free, generous limits)
   - Create new project

2. **Copy Connection String**
   - Extract details from connection string:
     ```
     postgresql://user:pass@host/dbname?sslmode=require
     ```

3. **Follow steps 3-10 from Path 1** (same process)

---

### 🟡 Path 3: Railway (All-in-One)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub
   - New Project → PostgreSQL

2. **Deploy Database & Backend Together**
   - Add PostgreSQL service
   - Add Web Service (your backend code)
   - Railway auto-detects Express apps
   - Add environment variables in dashboard

3. **Less manual work** - Railway handles deployment automatically

---

## ⚡ Super Quick Reference

### Key Changes MSSQL → PostgreSQL

| What | MSSQL | PostgreSQL |
|------|-------|------------|
| Package | `mssql` | `pg` |
| Placeholders | `@Username` | `$1, $2, $3` |
| Query Method | `pool.request().input().query()` | `pool.query(sql, [params])` |
| Results | `result.recordset` | `result.rows` |
| Rows Affected | `result.rowsAffected[0]` | `result.rowCount` |
| Auto-increment | `IDENTITY` | `SERIAL` |
| String Type | `NVARCHAR` | `VARCHAR` or `TEXT` |
| Boolean | `BIT` | `BOOLEAN` |
| Date/Time | `GETDATE()` | `CURRENT_TIMESTAMP` |
| Top N | `SELECT TOP 10` | `SELECT ... LIMIT 10` |

### Example Conversion

**Before (MSSQL):**
```javascript
const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .input('Username', sql.VarChar(50), username)
    .query('UPDATE users SET username = @Username WHERE user_id = @UserId');

if (result.rowsAffected[0] === 0) {
    // not found
}
const users = result.recordset;
```

**After (PostgreSQL):**
```javascript
const result = await pool.query(
    'UPDATE users SET username = $1 WHERE user_id = $2',
    [username, userId]
);

if (result.rowCount === 0) {
    // not found
}
const users = result.rows;
```

---

## 🆘 Troubleshooting

### "password authentication failed"
- Check password has no extra spaces
- Verify you're using correct database name
- For Supabase: database is always `postgres`

### "connection refused" or "timeout"
- Check `DB_SSL=true` is set (required for most cloud databases)
- Verify host URL is correct
- Check firewall/IP restrictions

### "relation does not exist"
- You didn't run the schema.sql file
- You're connected to wrong database
- Schema wasn't run in the correct database

### Tests show errors
- Update all `result.recordset` to `result.rows`
- Update all `@Param` to `$1, $2, ...`
- Remove `.input()` calls

---

## ✅ Checklist

- [ ] Chose database provider (Supabase/Neon/Railway)
- [ ] Created database and ran `schema.sql`
- [ ] Installed `pg` package, removed `mssql`
- [ ] Created `.env` file with correct credentials
- [ ] Updated `db.js` to use PostgreSQL
- [ ] Updated all controllers (or copied `*_postgres.js` versions)
- [ ] Tested locally with `npm start`
- [ ] Backend deployed to hosting service
- [ ] Frontend updated with backend URL
- [ ] Tested registration and login
- [ ] Tested creating posts and comments

---

## 🎉 Done!

Your app should now be running on free PostgreSQL!

**Next Steps:**
- Set up automated backups
- Add monitoring (Sentry for errors)
- Optimize database queries with indexes
- Consider connection pooling for production

