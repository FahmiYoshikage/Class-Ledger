# Environment Files Guide

## 📁 File Structure

```
kas-kelas/
├── server/
│   ├── .env              # ✅ Development (local)
│   └── .env.production   # ✅ Production (Docker/VPS)
├── client/
│   ├── .env              # ✅ Development (local)
│   └── .env.production   # ✅ Production (build)
└── docker-compose.yml
```

---

## 🖥️ Development (Local Machine)

### Backend

**File Used**: `server/.env`

```bash
PORT=8012
NODE_ENV=development
MONGODB_URI=mongodb+srv://...@material-dashboard.whyz4.mongodb.net/kas-kelas
```

**How it's loaded**:

-   PM2: Automatically reads `server/.env`
-   Node.js: Uses `dotenv` package

**Run**:

```bash
cd server
pm2 start server.js --name "api-server"
# or
node server.js
```

---

### Frontend

**File Used**: `client/.env`

```bash
VITE_API_URL=http://localhost:8012/api
```

**How it's loaded**:

-   Vite automatically reads `.env` during `npm run dev`

**Run**:

```bash
cd client
npm run dev
```

---

## 🚀 Production (VPS with Docker)

### Backend

**File Used**: `server/.env.production`

```bash
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...@material-dashboard.whyz4.mongodb.net/kas-kelas
JWT_SECRET=7065bfb93d0318b9a0b1180c1608c7c1a201f0135ab032e7c6b3662b90bbc68e
FONNTE_API_TOKEN=sYy6sBj9ST6FovVw2i1k4RibjAuJjT4gUS212YN7bSB
START_DATE=2025-10-27
WA_TEST_MODE=false
AUTO_REMINDER_ENABLED=true
CORS_ORIGIN=https://triforce.fahmi.app
```

**How it's loaded**:

-   Docker Compose uses `env_file: ./server/.env.production`
-   Container internal port: 5000
-   Host exposed port: 5001

**In docker-compose.yml**:

```yaml
api:
    env_file:
        - ./server/.env.production
    ports:
        - '5001:5000'
```

---

### Frontend

**File Used**: `client/.env.production`

```bash
VITE_API_URL=https://triforce.fahmi.app/api
```

**How it's loaded**:

-   Vite automatically reads `.env.production` during `npm run build`
-   Build happens inside Dockerfile

**In Dockerfile**:

```dockerfile
# Build stage
RUN npm run build  # ← Uses .env.production here
```

---

## 📋 Summary Table

| Environment     | Backend File             | Frontend File            | How Loaded                   |
| --------------- | ------------------------ | ------------------------ | ---------------------------- |
| **Development** | `server/.env`            | `client/.env`            | dotenv / Vite dev            |
| **Production**  | `server/.env.production` | `client/.env.production` | Docker env_file / Vite build |

---

## 🔒 Security Notes

### ⚠️ Files to NEVER commit to Git:

-   `server/.env` (has dev secrets)
-   `server/.env.production` (has prod secrets)

### ✅ Files to commit (examples):

-   `server/.env.example`
-   `client/.env.production.example`

### 🛡️ Current Setup:

-   `.env` files are in `.gitignore` ✅
-   Secret credentials are kept safe ✅

---

## 🚀 Deployment Workflow

### 1. Develop Locally

```bash
# Use development .env files
cd server && pm2 start server.js
cd client && npm run dev
```

### 2. Build for Production

```bash
# Frontend will use .env.production during build
cd client
npm run build
```

### 3. Deploy to VPS

```bash
# Copy files to VPS
rsync -avz . root@your-vps:/opt/telkom-cup/

# On VPS: Docker will use .env.production
cd /opt/telkom-cup
docker-compose up -d --build
```

Docker automatically:

1. Loads `server/.env.production` for backend container
2. Uses `client/.env.production` during frontend build
3. Exposes services on correct ports (5001, 8767)

---

## 🔄 Switching Environments

### To Test Production Config Locally:

```bash
# Backend
cd server
NODE_ENV=production PORT=5000 node server.js

# Frontend
cd client
npm run build
npm run preview  # Serves production build
```

### To Override Specific Variables:

```bash
# Use .env.production but override one variable
cd server
PORT=9000 node -r dotenv/config server.js dotenv_config_path=.env.production
```

---

## 📝 Checklist Before Deploy

-   [ ] `server/.env.production` exists with all variables
-   [ ] `client/.env.production` has correct domain URL
-   [ ] JWT_SECRET is strong (not default)
-   [ ] MONGODB_URI points to Atlas (not localhost)
-   [ ] CORS_ORIGIN matches your domain
-   [ ] FONNTE_API_TOKEN is valid (if using WA features)
-   [ ] docker-compose.yml uses `env_file: ./server/.env.production`

---

## 🆘 Troubleshooting

### Backend container can't find environment variables

```bash
# Check if file exists in container
docker exec kas-kelas-api cat /app/.env.production

# Check loaded env vars
docker exec kas-kelas-api env | grep MONGODB_URI
```

### Frontend API_URL is wrong

```bash
# Check build output
cat client/dist/assets/*.js | grep -o 'http[s]*://[^"]*'

# Rebuild with correct .env.production
cd client
rm -rf dist
npm run build
```

### Port conflicts

```bash
# Check what's using the ports
netstat -tulpn | grep -E ':(5000|5001|8766|8767)'

# Stop conflicting services
pm2 stop all
docker-compose down
```
