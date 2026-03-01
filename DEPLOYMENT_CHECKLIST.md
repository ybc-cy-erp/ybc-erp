# YBC ERP - Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Ready
- [x] All Week 1 tasks complete (15/15)
- [x] All Week 2 tasks complete (12/12)
- [x] All tests passing (39/39)
- [x] 0 bugs found
- [x] Code on GitHub: https://github.com/ybc-cy-erp/ybc-erp

### 2. Database Ready
- [x] Supabase project: `iklibzcyfxcahbquuurv`
- [x] 25 tables created with RLS
- [x] Seed data (IFRS chart of accounts)
- [x] Region: Europe (Frankfurt)
- [x] Status: ACTIVE_HEALTHY

### 3. Environment Variables Prepared
- [x] JWT_SECRET ready (needs rotation for production)
- [x] Supabase keys documented
- [x] CORS_ORIGIN to be updated after frontend deployment

---

## 🚀 Railway Deployment Steps

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Connect to your GitHub account
4. Verify email

### Step 2: Deploy Backend Service

#### 2.1 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `ybc-cy-erp/ybc-erp`
4. Select `main` branch
5. Project name: `ybc-erp-backend`

#### 2.2 Configure Build Settings
Railway will auto-detect Node.js. If needed, verify:
- **Root Directory:** `/` (leave empty)
- **Build Command:** `cd server && npm install`
- **Start Command:** `node server/index.js`

Or create `railway.toml` in root:
```toml
[build]
builder = "NIXPACKS"
buildCommand = "cd server && npm install"

[deploy]
startCommand = "node server/index.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

#### 2.3 Add Environment Variables

Go to: Project → Settings → Variables

**Critical Variables:**
```bash
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=https://iklibzcyfxcahbquuurv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbGliemN5ZnhjYWhicXV1dXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTg1NjEsImV4cCI6MjA4NzkzNDU2MX0.ezhQTWc_aWufFFAw3g55-LmRDRW14EUeLlEKv7ePCi4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbGliemN5ZnhjYWhicXV1dXJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM1ODU2MSwiZXhwIjoyMDg3OTM0NTYxfQ.DmLzLw9fQVb0huaI7EHq8qelGd6OTXKaEuir7bpgpPw

# JWT (ROTATE THIS SECRET!)
JWT_SECRET=YbcErp_Prod_2026_SecureRandomString_ChangeThis_32chars
JWT_EXPIRES_IN=24h

# CORS (update after frontend deployment)
CORS_ORIGIN=*
```

**Important:** Generate new JWT_SECRET for production:
```bash
# Run this locally to generate secure secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2.4 Deploy
1. Click "Deploy"
2. Wait for build (~2-3 minutes)
3. Check logs for errors
4. Once deployed, Railway provides URL: `https://ybc-erp-backend-production.up.railway.app`

#### 2.5 Test Backend
```bash
# Test health endpoint
curl https://ybc-erp-backend-production.up.railway.app/health

# Expected response:
{"status":"ok","timestamp":"2026-03-01T..."}
```

---

### Step 3: Deploy Frontend Service

#### 3.1 Add New Service to Same Project
1. In Railway project → Click "+ New"
2. Select "GitHub Repo" → Choose `ybc-cy-erp/ybc-erp` again
3. Service name: `ybc-erp-frontend`

#### 3.2 Configure Build Settings

**Option A: Use Vite preview (simplest)**
```toml
[build]
builder = "NIXPACKS"
buildCommand = "cd client && npm install && npm run build"

[deploy]
startCommand = "cd client && npm run preview -- --host 0.0.0.0 --port $PORT"
```

**Option B: Use static file server (production-ready)**
```bash
# Will need to add to client/package.json:
"serve": "vite preview --host 0.0.0.0 --port $PORT"
```

#### 3.3 Add Environment Variables (Frontend)

Go to: Frontend Service → Settings → Variables

```bash
VITE_API_URL=https://ybc-erp-backend-production.up.railway.app/api
```

#### 3.4 Deploy Frontend
1. Click "Deploy"
2. Wait for build
3. Railway provides URL: `https://ybc-erp-frontend-production.up.railway.app`

#### 3.5 Update Backend CORS
Go back to Backend Service → Variables:
```bash
CORS_ORIGIN=https://ybc-erp-frontend-production.up.railway.app
```

Redeploy backend (Railway auto-redeploys when env vars change)

---

### Step 4: Custom Domain Setup (Optional)

#### 4.1 Configure in Railway
1. Go to Frontend Service → Settings → Domains
2. Click "Add Custom Domain"
3. Enter: `erp.ybc.com.cy`
4. Railway provides CNAME target (e.g., `ybc-erp-frontend-production.up.railway.app`)

#### 4.2 Configure DNS
In your DNS provider (Cloudflare, etc.):
```
Type: CNAME
Name: erp
Target: [Railway-provided-CNAME]
TTL: Auto
Proxy: Off (or On for Cloudflare protection)
```

#### 4.3 Wait for SSL
- Railway auto-provisions SSL certificate
- Usually takes 5-10 minutes
- Verify: `https://erp.ybc.com.cy` shows valid SSL

#### 4.4 Update Backend CORS (Again)
```bash
CORS_ORIGIN=https://erp.ybc.com.cy
```

---

## 🔍 Post-Deployment Verification

### Backend Tests
```bash
# Health check
curl https://ybc-erp-backend-production.up.railway.app/health

# Try registration (should fail without valid data, but endpoint responds)
curl -X POST https://ybc-erp-backend-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"test":"test"}'
# Expected: 400 error with validation message
```

### Frontend Tests
1. Open `https://ybc-erp-frontend-production.up.railway.app` (or custom domain)
2. Verify login page loads
3. Ukrainian text displayed
4. Glassmorphism styling applied
5. No console errors

### Full Flow Test
1. Register new account:
   - Tenant name: "Test Tenant"
   - Email: test@example.com
   - Password: TestPass123
   - Name: "Test User"
2. Verify redirect to dashboard
3. Check dashboard metrics load
4. Navigate to "Тарифні плани"
5. Create test plan
6. Navigate to "Членства"
7. Create test membership
8. Verify all data saves and displays

---

## 📊 Monitoring Setup

### 1. UptimeRobot (Free Tier)
1. Sign up: https://uptimerobot.com
2. Add Monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://ybc-erp-backend-production.up.railway.app/health`
   - **Name:** YBC ERP Backend
   - **Interval:** 5 minutes
3. Add Alert Contacts:
   - Email: your-email@example.com
   - Optional: Telegram integration

### 2. Railway Logs
- Real-time logs: Project → Service → Deployments → View Logs
- Filter by level (error, warn, info)
- Search for specific errors

### 3. Performance Monitoring
Backend already logs slow requests (>500ms):
- Check logs for "Slow request" entries
- Review and optimize if needed

---

## 🔒 Security Checklist

### Production Security
- [ ] JWT_SECRET rotated (not default value)
- [ ] Supabase Service Role Key kept secret (not in frontend)
- [ ] CORS_ORIGIN set to exact frontend domain (not *)
- [ ] HTTPS enforced (Railway does this automatically)
- [ ] Rate limiting active (already configured)
- [ ] RLS policies verified in Supabase dashboard
- [ ] No secrets committed to Git (.env in .gitignore)

### Optional: Additional Security
- [ ] Enable Cloudflare proxy (DDoS protection)
- [ ] Add WAF rules (Cloudflare)
- [ ] Enable 2FA for Railway account
- [ ] Enable 2FA for GitHub account
- [ ] Set up backup webhook for critical errors

---

## 🎉 Go-Live Checklist

### Before Announcing
- [ ] All tests passed on production
- [ ] Full user flow tested (register → dashboard → create plan → create membership)
- [ ] Mobile tested (phone + tablet)
- [ ] Dashboard metrics showing real data
- [ ] No console errors
- [ ] SSL certificate valid
- [ ] Custom domain working (if configured)
- [ ] Monitoring active (UptimeRobot)

### After Go-Live
- [ ] Monitor logs for first 24 hours
- [ ] Check UptimeRobot for uptime
- [ ] Verify no errors in Railway logs
- [ ] Test from different devices/browsers
- [ ] Collect user feedback
- [ ] Document any issues in GitHub Issues

---

## 🆘 Troubleshooting

### Backend won't start
1. Check Railway logs
2. Verify all env vars are set
3. Check package.json has correct start command
4. Verify Supabase connection (check URL/keys)

### Frontend shows blank page
1. Check browser console for errors
2. Verify VITE_API_URL is correct
3. Check CORS settings on backend
4. Verify build completed successfully in Railway logs

### CORS errors
1. Verify CORS_ORIGIN matches exact frontend URL
2. Include protocol (https://)
3. No trailing slash
4. Redeploy backend after changing

### Database connection fails
1. Verify Supabase project is active
2. Check SUPABASE_URL and keys are correct
3. Test connection from Railway logs
4. Verify RLS policies aren't blocking

### 502 Bad Gateway
1. Backend service crashed - check logs
2. Verify start command is correct
3. Check if port binding is correct (Railway sets PORT env var)

---

## 📞 Support

- **Railway Docs:** https://docs.railway.app
- **Supabase Docs:** https://supabase.com/docs
- **Project Issues:** https://github.com/ybc-cy-erp/ybc-erp/issues

---

## ✅ Deployment Complete!

Once all steps above are done:
1. ✅ Backend running on Railway
2. ✅ Frontend running on Railway  
3. ✅ Custom domain configured (optional)
4. ✅ Monitoring active
5. ✅ Security verified
6. ✅ Full flow tested

**Your YBC ERP is now LIVE in production!** 🎉

---

**Deployed by:** Олег Польчин  
**Date:** 2026-03-01  
**Version:** Week 1 + Week 2 (27/27 tasks complete)  
**Status:** Ready for production use ✅
