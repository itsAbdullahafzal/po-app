# Deploying PO Manager to the Cloud

Once deployed, the app runs 24/7 from anywhere — no PC needs to be on.
Total cost: ~£4/month (Railway). Database and frontend are free.

---

## Architecture

| Part        | Service  | Cost   | URL format                          |
|-------------|----------|--------|-------------------------------------|
| Database    | Neon     | Free   | (managed, no URL needed)            |
| Backend API | Railway  | ~£4/mo | https://po-app-backend.railway.app  |
| Frontend    | Vercel   | Free   | https://po-app.vercel.app           |

---

## Step 1 — Put the code on GitHub

1. Go to https://github.com and create a free account if you don't have one
2. Create a **New repository** called `po-app`
3. Make it **Private**
4. Open a terminal in `C:\Users\phoen\OneDrive\Documents\My Data Sources\po-app`
5. Run:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/po-app.git
   git push -u origin main
   ```

---

## Step 2 — Create the database (Neon — Free)

1. Go to https://neon.tech and sign up (free)
2. Click **New Project** → name it `po-manager`
3. Choose the region closest to you (e.g. EU West)
4. Once created, click **Connection string** → copy the full URL
   - It looks like: `postgresql://user:pass@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require`
5. **Save this URL** — you'll need it in Step 3

---

## Step 3 — Deploy the backend (Railway)

1. Go to https://railway.app and sign up (link your GitHub)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `po-app` repository
4. Railway will detect it as Node.js automatically
5. Set the **Root Directory** to `backend`
6. Click **Variables** and add:
   ```
   DATABASE_URL   = (paste your Neon connection string from Step 2)
   JWT_SECRET     = (type any long random string, e.g. "mySecretKey2024abc123xyz")
   FRONTEND_URL   = https://po-app.vercel.app  (update after Step 4)
   NODE_ENV       = production
   ```
7. Railway will deploy automatically — wait ~2 minutes
8. Click **Settings** → note your public URL (e.g. `https://po-app-backend.railway.app`)

---

## Step 4 — Deploy the frontend (Vercel)

1. Go to https://vercel.com and sign up (link your GitHub)
2. Click **Add New Project** → import your `po-app` repo
3. Set **Root Directory** to `frontend`
4. Under **Environment Variables**, add:
   ```
   VITE_API_URL = https://po-app-backend.railway.app/api
   ```
   (use your actual Railway URL from Step 3)
5. Click **Deploy** — takes about 1 minute
6. Vercel gives you a URL like `https://po-app-yourname.vercel.app`

---

## Step 5 — Final wiring

1. Go back to Railway → **Variables**
2. Update `FRONTEND_URL` to your actual Vercel URL
3. Railway will redeploy automatically

---

## Done!

Your app is now live at your Vercel URL.
- **Anyone** can access it from any device, anywhere
- Data is stored securely in Neon PostgreSQL (not on your PC)
- The backend runs 24/7 on Railway

### Default login
| Email                 | Password   |
|-----------------------|------------|
| admin@company.com     | Admin123!  |

**Change this password immediately** via Admin → User Management → click the admin user → Edit.

---

## Local development (still works)

For local testing, create `backend/.env`:
```
DATABASE_URL=postgresql://... (your Neon URL, or a local PostgreSQL)
JWT_SECRET=any-local-secret
```

Then run as before:
```
cd backend && npm start
cd frontend && npm run dev
```
