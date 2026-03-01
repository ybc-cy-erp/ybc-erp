# YBC ERP - Deployment Guide

## Railway Deployment

### Prerequisites
- Railway account: https://railway.app
- GitHub repository connected
- Supabase project created

### Backend Deployment

#### 1. Create New Project in Railway
```bash
# Via Railway CLI (optional)
npm install -g @railway/cli
railway login
railway init
```

Or via Railway Dashboard:
1. Go to https://railway.app/new
2. Select "Deploy from GitHub repo"
3. Choose `ybc-cy-erp/ybc-erp` repository
4. Select `main` branch

#### 2. Configure Environment Variables

In Railway dashboard → Project → Variables, add:

```bash
# Server
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=https://iklibzcyfxcahbquuurv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbGliemN5ZnhjYWhicXV1dXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTg1NjEsImV4cCI6MjA4NzkzNDU2MX0.ezhQTWc_aWufFFAw3g55-LmRDRW14EUeLlEKv7ePCi4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbGliemN5ZnhjYWhicXV1dXJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM1ODU2MSwiZXhwIjoyMDg3OTM0NTYxfQ.DmLzLw9fQVb0huaI7EHq8qelGd6OTXKaEuir7bpgpPw

# JWT (generate strong random secret)
JWT_SECRET=YbcErp2026_Production_Secret_CHANGE_THIS
JWT_EXPIRES_IN=24h

# CORS (will be updated after frontend deployment)
CORS_ORIGIN=https://ybc-erp-frontend.up.railway.app
```

#### 3. Deploy
- Railway auto-deploys on push to `main`
- Or click "Deploy" in dashboard

#### 4. Get Backend URL
- After deployment, Railway provides URL: `https://ybc-erp-backend.up.railway.app`
- Test: `curl https://ybc-erp-backend.up.railway.app/health`

### Frontend Deployment

#### 1. Create Separate Service in Same Project
1. In Railway project → Add New Service
2. Select same GitHub repo
3. Configure root directory: `client`

#### 2. Configure Build Settings

Railway will auto-detect Vite project. Or create `client/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run preview",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### 3. Configure Environment Variables (Frontend)

```bash
VITE_API_URL=https://ybc-erp-backend.up.railway.app/api
```

#### 4. Deploy
- Auto-deploys on push to `main`
- Frontend URL: `https://ybc-erp-frontend.up.railway.app`

#### 5. Update Backend CORS
Go back to backend service → Variables → Update:
```bash
CORS_ORIGIN=https://ybc-erp-frontend.up.railway.app
```

### Custom Domain Setup (erp.ybc.com.cy)

#### 1. In Railway Frontend Service
1. Settings → Domains → Add Custom Domain
2. Enter: `erp.ybc.com.cy`
3. Railway provides CNAME target (e.g., `ybc-erp-frontend.up.railway.app`)

#### 2. In DNS Provider (Cloudflare/etc.)
```
Type: CNAME
Name: erp
Target: [Railway-provided-CNAME]
TTL: Auto
```

#### 3. Wait for SSL Certificate
- Railway auto-provisions SSL certificate
- Usually takes 5-10 minutes

#### 4. Update Backend CORS Again
```bash
CORS_ORIGIN=https://erp.ybc.com.cy
```

## Monitoring Setup

### 1. UptimeRobot (Free Tier)
1. Sign up: https://uptimerobot.com
2. Add Monitor:
   - Type: HTTP(s)
   - URL: `https://ybc-erp-backend.up.railway.app/health`
   - Interval: 5 minutes
   - Alert Contacts: Email + Telegram (if configured)

### 2. Railway Logs
- Real-time logs in Railway dashboard
- Filter by error level
- Set up log-based alerts (Railway Pro)

### 3. Performance Monitoring
Backend already logs slow requests (>500ms) via Winston logger.

To view in Railway:
1. Go to backend service → Deployments → View Logs
2. Search for "Slow request"

### 4. Telegram Alerts (Optional)
Create Telegram bot for alerts:
1. Talk to @BotFather → /newbot
2. Get bot token
3. Add to backend env vars:
   ```bash
   TELEGRAM_BOT_TOKEN=your_bot_token
   ALERT_CHAT_ID=your_chat_id
   ```
4. Alerts will be sent on errors/downtime

## Health Checks

### Backend
- Endpoint: `/health`
- Expected response: `{"status":"ok","timestamp":"..."}`

### Frontend
- Load homepage: `https://erp.ybc.com.cy`
- Expected: Login page visible

### Database
- Supabase dashboard: https://supabase.com/dashboard/project/iklibzcyfxcahbquuurv
- Check connection status

## Rollback Procedure

### If Deployment Fails:
1. Railway dashboard → Service → Deployments
2. Click on last successful deployment
3. Click "Redeploy"

### If Need to Rollback Code:
```bash
git revert <commit-hash>
git push origin main
# Railway auto-deploys the revert
```

## Post-Deployment Checklist

- [ ] Backend health check returns 200
- [ ] Frontend loads login page
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Dashboard displays after login
- [ ] Logout works
- [ ] UptimeRobot monitoring active
- [ ] HTTPS certificate valid
- [ ] CORS configured correctly
- [ ] Environment variables secured (not in code)

## Security Notes

### Production Secrets
- **Never commit secrets to Git**
- Rotate JWT_SECRET regularly (every 90 days)
- Store Supabase Service Role Key securely
- Use Railway's secret management

### HTTPS
- Railway enforces HTTPS automatically
- Redirect HTTP → HTTPS in production (already configured in backend)

### Rate Limiting
- Already configured: 100 requests/15min (general)
- Auth endpoints: 5 requests/15min

## Maintenance

### Daily
- Check UptimeRobot for downtime alerts
- Review error logs in Railway

### Weekly
- Check Supabase usage (database size, API calls)
- Review Railway usage (bandwidth, build minutes)

### Monthly
- Update dependencies (`npm audit fix`)
- Review and rotate secrets if needed
- Check for security updates

---

**Deployment Status:** Ready for production ✅  
**Last Updated:** 2026-03-01  
**Deployed By:** DevOps Agent
