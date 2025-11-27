# 🔄 Database Migration: Azure SQL → PostgreSQL

Your Azure database is currently locked, so this guide will help you migrate to a **free PostgreSQL alternative**.

## 📦 What's Been Created For You

### ✅ Complete Database Schema
- **`backend-api/schema.sql`** - Full PostgreSQL schema with:
  - All 5 tables (users, posts, comments, reactions, categories)
  - Proper indexes and constraints
  - Sample seed data (3 users, 5 posts, 5 comments, reactions)
  - Ready to run in any PostgreSQL database

### ✅ Updated Backend Code (PostgreSQL Compatible)
All controllers have been converted to PostgreSQL syntax:
- `db-postgres.js` - New database connection handler
- `server-postgres.js` - Updated server with health checks
- `user_controller_postgres.js` - User auth & registration
- `post_controller_postgres.js` - Post CRUD operations
- `comment_controller_postgres.js` - Comment management
- `category_controller_postgres.js` - Category handling
- `post_reaction_controller_postgres.js` - Post reactions
- `comment_reaction_controller_postgres.js` - Comment reactions

### ✅ Documentation
- `MIGRATION_GUIDE.md` - Detailed step-by-step migration guide
- `QUICK_START.md` - Fast-track guide with quick reference
- `MIGRATION_SUMMARY.md` - Complete overview of changes
- `package-postgres.json` - Updated dependencies

---

## 🚀 Quick Start (5 Steps)

### 1️⃣ Choose Your Free Database Provider

**Recommended: Supabase** (best for beginners)
- Go to https://supabase.com
- Sign up (free, no credit card)
- Create new project
- Wait 2-3 minutes for setup

**Alternatives:**
- **Neon** (https://neon.tech) - 10GB free, serverless
- **Railway** (https://railway.app) - $5/month credit

---

### 2️⃣ Run the Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy entire contents of `backend-api/schema.sql`
3. Paste and click **Run**
4. ✅ You should see success message and data populated

---

### 3️⃣ Update Dependencies

```bash
cd backend-api

# Remove MSSQL package
pnpm remove mssql

# Install PostgreSQL package
pnpm add pg
```

---

### 4️⃣ Update Your Backend Code

#### Option A: Rename Files (Quick)
```bash
# Backup old files
mv db.js db-mssql.js.bak
mv server.js server-mssql.js.bak

# Use new PostgreSQL files
mv db-postgres.js db.js
mv server-postgres.js server.js

# Update all controllers (repeat for each):
mv controllers/user_controller.js controllers/user_controller-old.js
mv controllers/user_controller_postgres.js controllers/user_controller.js
# ... do this for all controllers
```

#### Option B: Manual Update (More control)
Update each controller file by replacing:
- `result.recordset` → `result.rows`
- `result.rowsAffected[0]` → `result.rowCount`
- `@Parameter` → `$1, $2, $3...` (numbered placeholders)
- Remove all `.input()` calls

---

### 5️⃣ Configure Environment Variables

Create `.env` file in `backend-api/`:

```env
# Server
PORT=3000
JWT_SECRET=your_super_secret_key_change_this_in_production

# PostgreSQL Database (Supabase example)
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password
DB_SSL=true

# CORS (add your Vercel domain)
CORS_ORIGIN=http://localhost:3001,https://your-app.vercel.app
```

**For Supabase:** Find these values in Project Settings → Database

---

## 🧪 Test Locally

```bash
cd backend-api
pnpm start
# or npm start
```

Test endpoints:
- http://localhost:3000/health - Should return "healthy"
- http://localhost:3000/api/users - Should return seed users

---

## 🌐 Deploy Your Backend

Since your frontend is already on Vercel, you need to deploy your backend too.

### Option 1: Render (Recommended - Free Tier)
1. Go to https://render.com
2. Sign up with GitHub
3. New → Web Service
4. Connect your GitHub repository
5. Render auto-detects Express
6. Add environment variables from your `.env`
7. Deploy!

**Free Tier:** 750 hours/month (enough for continuous running)

### Option 2: Railway (Easiest Setup)
1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select your repo
5. Add environment variables
6. Deploy automatically

**Free Tier:** $5 credit/month

### Option 3: Fly.io (Best Performance)
1. Install flyctl: `brew install flyctl` (Mac) or download from fly.io
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Set secrets: `fly secrets set JWT_SECRET=...` (for each env var)
5. Deploy: `fly deploy`

**Free Tier:** 3 VMs with 256MB RAM

---

## 🔗 Update Frontend

Add to your Vercel project's environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

Then in your `frontend-app/utils/api.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
```

Redeploy your frontend on Vercel.

---

## 📊 Key Differences: MSSQL vs PostgreSQL

| Feature | MSSQL (Old) | PostgreSQL (New) |
|---------|-------------|-------------------|
| **Package** | `mssql` | `pg` |
| **Placeholders** | `@Username`, `@Email` | `$1`, `$2`, `$3` |
| **Query Method** | `pool.request().input().query()` | `pool.query(sql, [params])` |
| **Results** | `result.recordset` | `result.rows` |
| **Rows Affected** | `result.rowsAffected[0]` | `result.rowCount` |
| **Auto ID** | `IDENTITY(1,1)` | `SERIAL` |
| **String Type** | `NVARCHAR(255)` | `VARCHAR` or `TEXT` |
| **Date Function** | `GETDATE()` | `CURRENT_TIMESTAMP` |
| **Limit** | `SELECT TOP 10` | `SELECT ... LIMIT 10` |

---

## 🛠️ Example Code Conversion

### Before (MSSQL):
```javascript
const { poolPromise, sql } = require('../db');

const pool = await poolPromise;
const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .input('Username', sql.VarChar(50), username)
    .query(`
        UPDATE users 
        SET username = @Username 
        WHERE user_id = @UserId
    `);

if (result.rowsAffected[0] === 0) {
    return res.status(404).json({ error: 'Not found' });
}

const users = result.recordset;
```

### After (PostgreSQL):
```javascript
const { pool } = require('../db');

const result = await pool.query(`
    UPDATE users 
    SET username = $1 
    WHERE user_id = $2
`, [username, userId]);

if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Not found' });
}

const users = result.rows;
```

---

## ✅ Migration Checklist

- [ ] Created free PostgreSQL database (Supabase/Neon/Railway)
- [ ] Ran `schema.sql` successfully
- [ ] Installed `pg` package, removed `mssql`
- [ ] Updated `db.js` to use PostgreSQL connection
- [ ] Updated `server.js` with new configuration
- [ ] Updated all 6 controllers to PostgreSQL syntax
- [ ] Created `.env` file with correct credentials
- [ ] Tested locally - server starts without errors
- [ ] Tested `/health` endpoint - returns "healthy"
- [ ] Tested user registration and login
- [ ] Backend deployed to hosting service (Render/Railway/Fly)
- [ ] Updated frontend `NEXT_PUBLIC_API_URL` on Vercel
- [ ] Tested full app end-to-end
- [ ] Verified posts, comments, and reactions work

---

## 🆘 Troubleshooting

### "password authentication failed"
✅ Check `.env` file - ensure no extra spaces in password  
✅ For Supabase, database name is always `postgres`

### "connect ECONNREFUSED" or timeout
✅ Set `DB_SSL=true` (required for cloud databases)  
✅ Verify host URL is correct  
✅ Check firewall settings

### "relation does not exist"
✅ Run the `schema.sql` file in your database  
✅ Verify you're connected to the correct database  
✅ Check all table names match schema

### Frontend can't connect to backend
✅ Update CORS in `server.js` to include Vercel URL  
✅ Add `NEXT_PUBLIC_API_URL` environment variable in Vercel  
✅ Redeploy frontend after adding env var

---

## 💰 Cost Breakdown (All FREE Options)

### Database Options:
- **Supabase**: Free forever (500MB)
- **Neon**: Free forever (10GB)
- **Railway**: $5 credit/month

### Backend Hosting Options:
- **Render**: 750 hours/month free
- **Railway**: Included with database
- **Fly.io**: 3 free VMs

### Frontend (Current):
- **Vercel**: Already free ✅

**Total Cost: $0** (or $0-5/month with Railway)

---

## 📚 Need More Help?

1. **Detailed Migration Guide**: See `backend-api/MIGRATION_GUIDE.md`
2. **Quick Reference**: See `backend-api/QUICK_START.md`
3. **Full Summary**: See `MIGRATION_SUMMARY.md`
4. **Example Controllers**: Check all `*_postgres.js` files

---

## 🎉 What You'll Have After Migration

- ✅ **Free PostgreSQL database** (no more Azure locks)
- ✅ **Working backend API** with all features
- ✅ **Free backend hosting** (Render/Railway/Fly)
- ✅ **Frontend on Vercel** (already have)
- ✅ **Complete social platform** (posts, comments, reactions)
- ✅ **No subscription fees** (100% free tier)

---

## 🚀 Next Steps After Migration

1. **Enable database backups** in your provider's dashboard
2. **Set up monitoring** (consider Sentry for error tracking)
3. **Add rate limiting** to protect your API
4. **Optimize queries** with proper indexes (already included in schema)
5. **Add tests** for your endpoints
6. **Document your API** with Swagger/OpenAPI

---

## 📝 Your Current Schema

Your database includes:
- 👥 **Users** - Authentication, profiles
- 📝 **Posts** - User-generated content
- 💬 **Comments** - With nested replies support
- ❤️ **Reactions** - Likes/dislikes for posts and comments
- 🏷️ **Categories** - Post organization

All relationships are properly set up with foreign keys and cascade deletes.

---

**Estimated Migration Time:** 1-2 hours  
**Difficulty:** Moderate (mostly find-and-replace)  
**Risk:** Low (can test locally before deploying)

---

Good luck with your migration! Your complete social platform will be running on free infrastructure in no time. 🎉

