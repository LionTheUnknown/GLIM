# ✅ Migration Checklist - Azure SQL to PostgreSQL

Print this or keep it open while migrating!

---

## Phase 1: Database Setup (15 min)

### Step 1: Sign up for Supabase
- [ ] Go to https://supabase.com
- [ ] Click "Start your project"
- [ ] Sign up with GitHub (or email)
- [ ] Create new organization (can use default name)

### Step 2: Create Database
- [ ] Click "New Project"
- [ ] Choose a name: `glim-db` (or any name you like)
- [ ] Create a **strong password** and **save it somewhere**
- [ ] Choose region closest to you
- [ ] Click "Create new project"
- [ ] ⏳ Wait 2-3 minutes for database to be ready

### Step 3: Get Connection Details
- [ ] Go to Project Settings (gear icon)
- [ ] Click "Database" in sidebar
- [ ] Copy these values (you'll need them):
  ```
  Host: _________________.supabase.co
  Port: 5432
  Database: postgres
  User: postgres
  Password: [your password from step 2]
  ```

### Step 4: Run Schema
- [ ] Click "SQL Editor" in left sidebar
- [ ] Click "New query"
- [ ] Open `backend-api/schema.sql` file
- [ ] Copy **everything** from that file
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" button
- [ ] ✅ Should see "Success. No rows returned"
- [ ] Click "Table Editor" to verify tables were created
- [ ] Should see 5 tables: users, posts, comments, reactions, categories

---

## Phase 2: Update Backend Code (30 min)

### Step 5: Update Dependencies
Open terminal in your project folder:
```bash
cd backend-api

# Remove old MSSQL package
pnpm remove mssql

# Install PostgreSQL package
pnpm add pg
```
- [ ] Commands completed successfully
- [ ] No errors shown

### Step 6: Create .env File
- [ ] Create new file: `backend-api/.env`
- [ ] Copy this template and fill in your values:
```env
PORT=3000
JWT_SECRET=change_this_to_a_random_long_string_abc123xyz789

DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=true

CORS_ORIGIN=http://localhost:3001,https://your-app.vercel.app
```
- [ ] Replace `DB_HOST` with your Supabase host
- [ ] Replace `DB_PASSWORD` with your Supabase password
- [ ] Change `JWT_SECRET` to something random and long
- [ ] Save file

### Step 7: Backup Old Files
```bash
cd backend-api

# Backup old files
mv db.js db-mssql.js.backup
mv server.js server-mssql.js.backup

# Backup old controllers
cd controllers
mv user_controller.js user_controller-old.js
mv post_controller.js post_controller-old.js
mv comment_controller.js comment_controller-old.js
mv category_controller.js category_controller-old.js
mv post_reaction_controller.js post_reaction_controller-old.js
mv comment_reaction_controller.js comment_reaction_controller-old.js
cd ..
```
- [ ] Backup commands completed

### Step 8: Use New PostgreSQL Files
```bash
# Use new database connection
mv db-postgres.js db.js

# Use new server file
mv server-postgres.js server.js

# Use new controllers
cd controllers
mv user_controller_postgres.js user_controller.js
mv post_controller_postgres.js post_controller.js
mv comment_controller_postgres.js comment_controller.js
mv category_controller_postgres.js category_controller.js
mv post_reaction_controller_postgres.js post_reaction_controller.js
mv comment_reaction_controller_postgres.js comment_reaction_controller.js
cd ..
```
- [ ] All files renamed successfully

---

## Phase 3: Test Locally (15 min)

### Step 9: Start Backend
```bash
cd backend-api
pnpm start
```
- [ ] Server starts without errors
- [ ] See message: "✓ Database connected"
- [ ] See message: "✓ Server running on: http://localhost:3000"

### Step 10: Test Health Endpoint
Open browser or use curl:
```bash
curl http://localhost:3000/health
```
Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-..."
}
```
- [ ] Health endpoint returns "healthy"

### Step 11: Test User Registration
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "display_name": "Test User"
  }'
```
- [ ] Returns: `{"message": "User registered."}`

### Step 12: Test User Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "testpass123"
  }'
```
- [ ] Returns JSON with `token`, `user_id`, `username`
- [ ] **Save the token** (you'll need it for next tests)

### Step 13: Test Get Posts
```bash
curl http://localhost:3000/api/posts
```
- [ ] Returns array of posts (should include seed data)

### Step 14: Test Create Post (requires token from Step 12)
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content_text": "My first test post!",
    "category_id": 1
  }'
```
- [ ] Returns: `{"message": "Post created successfully."}`

---

## Phase 4: Deploy Backend (20 min)

### Step 15: Choose Hosting Provider
Pick ONE:
- [ ] **Option A: Render** (easiest for beginners)
- [ ] **Option B: Railway** (all-in-one solution)
- [ ] **Option C: Fly.io** (best performance)

### Step 16a: Deploy on Render (if chosen)
- [ ] Go to https://render.com
- [ ] Sign up with GitHub
- [ ] Click "New +" → "Web Service"
- [ ] Connect your GitHub repository
- [ ] Select the repository with your code
- [ ] Render should auto-detect Express app
- [ ] Root Directory: `backend-api`
- [ ] Build Command: `npm install`
- [ ] Start Command: `node server.js`
- [ ] Click "Advanced" → "Add Environment Variables"
- [ ] Add all variables from your `.env` file:
  - [ ] PORT = 3000
  - [ ] JWT_SECRET = (your value)
  - [ ] DB_HOST = (your Supabase host)
  - [ ] DB_PORT = 5432
  - [ ] DB_NAME = postgres
  - [ ] DB_USER = postgres
  - [ ] DB_PASSWORD = (your password)
  - [ ] DB_SSL = true
  - [ ] CORS_ORIGIN = http://localhost:3001,https://your-app.vercel.app
- [ ] Click "Create Web Service"
- [ ] ⏳ Wait for deployment (3-5 minutes)
- [ ] Copy your backend URL (e.g., `https://your-app.onrender.com`)

### Step 16b: Deploy on Railway (if chosen)
- [ ] Go to https://railway.app
- [ ] Sign up with GitHub
- [ ] Click "New Project" → "Deploy from GitHub repo"
- [ ] Select your repository
- [ ] Railway auto-detects and starts building
- [ ] Click on the service → "Variables" tab
- [ ] Add all environment variables from `.env`
- [ ] Click "Settings" → "Generate Domain"
- [ ] Copy your backend URL

### Step 16c: Deploy on Fly.io (if chosen)
Install flyctl first:
```bash
# Mac
brew install flyctl

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Linux
curl -L https://fly.io/install.sh | sh
```
Then deploy:
```bash
fly auth login
cd backend-api
fly launch
# Follow prompts, say yes to defaults
# Set secrets:
fly secrets set JWT_SECRET=your_secret
fly secrets set DB_HOST=your_supabase_host
fly secrets set DB_PASSWORD=your_password
# ... (set all env vars)
fly deploy
```
- [ ] Deployment successful
- [ ] Copy your backend URL

### Step 17: Test Deployed Backend
Replace `YOUR_BACKEND_URL` with your actual URL:
```bash
curl https://YOUR_BACKEND_URL/health
```
- [ ] Returns `{"status": "healthy"}`

---

## Phase 5: Update Frontend (10 min)

### Step 18: Add Backend URL to Vercel
- [ ] Go to https://vercel.com
- [ ] Select your frontend project
- [ ] Go to Settings → Environment Variables
- [ ] Add new variable:
  - Name: `NEXT_PUBLIC_API_URL`
  - Value: `https://your-backend-url.com` (from Step 16)
  - Environment: Production, Preview, Development
- [ ] Click "Save"

### Step 19: Update Frontend Code (if needed)
Check `frontend-app/utils/api.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
```
- [ ] Code already uses `NEXT_PUBLIC_API_URL` ✅
- [ ] OR update it to use the environment variable

### Step 20: Redeploy Frontend
- [ ] Go to Vercel dashboard
- [ ] Click "Deployments" tab
- [ ] Click "Redeploy" on latest deployment
- [ ] ⏳ Wait for redeployment
- [ ] Visit your live site

---

## Phase 6: Final Testing (10 min)

### Step 21: Test Production App
Visit your Vercel app URL:
- [ ] Site loads without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Can see posts
- [ ] Can create new post
- [ ] Can add comments
- [ ] Can like/dislike posts
- [ ] Can like/dislike comments

### Step 22: Check Browser Console
- [ ] No CORS errors
- [ ] No 404 errors
- [ ] API calls succeed

### Step 23: Verify Database
In Supabase Table Editor:
- [ ] See new users you created
- [ ] See new posts
- [ ] See new comments
- [ ] See new reactions

---

## 🎉 SUCCESS CRITERIA

You're done when ALL of these are true:
- [ ] ✅ Backend starts locally without errors
- [ ] ✅ `/health` endpoint returns "connected"
- [ ] ✅ Can register and login locally
- [ ] ✅ Backend deployed and accessible online
- [ ] ✅ Frontend can connect to deployed backend
- [ ] ✅ Can create posts, comments, reactions in production
- [ ] ✅ Data persists in Supabase database

---

## 🆘 If Something Goes Wrong

### Backend won't start locally
1. Check `.env` file exists in `backend-api/`
2. Verify all environment variables are set
3. Check database password has no extra spaces
4. Run `pnpm install` again

### "password authentication failed"
1. Double-check password in `.env` matches Supabase
2. Make sure `DB_SSL=true` is set
3. Verify host URL is correct

### "relation does not exist"
1. Go back to Supabase SQL Editor
2. Re-run the entire `schema.sql` file
3. Refresh Table Editor to verify tables exist

### Frontend can't connect to backend
1. Check `NEXT_PUBLIC_API_URL` is set in Vercel
2. Verify CORS_ORIGIN includes your Vercel URL
3. Redeploy backend with updated CORS settings
4. Redeploy frontend

### Deployment fails
1. Check build logs for specific error
2. Verify all environment variables are set
3. Make sure `package.json` has correct scripts
4. Try deploying from main/master branch

---

## 📞 Need Help?

Refer to these files:
- **Quick start**: `backend-api/QUICK_START.md`
- **Detailed guide**: `backend-api/MIGRATION_GUIDE.md`
- **Full summary**: `MIGRATION_SUMMARY.md`
- **Main README**: `README_MIGRATION.md`

---

**Total Estimated Time: 1-2 hours**

Good luck! 🚀

