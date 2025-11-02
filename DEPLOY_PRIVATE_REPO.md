# 🔐 Deploy Docker dengan GitHub Private Repository

## 🎯 Masalah

Setelah repository dijadikan **private**, Docker build di VPS gagal karena tidak bisa `git clone`.

---

## ✅ Solusi 1: Deploy dengan Git Clone Manual (Recommended)

**Cara Tercepat**: Clone repo di VPS dulu, baru build Docker dari local files.

### Step 1: Buat GitHub Personal Access Token (PAT)

1. Login ke GitHub → https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Beri nama: `VPS Deploy Token`
4. Pilih scope:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **Copy token** dan simpan (tidak bisa dilihat lagi!)

Token format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### Step 2: Clone Repo di VPS

```bash
# SSH ke VPS
ssh root@your-vps

# Setup git credentials
git config --global credential.helper store

# Clone dengan token
git clone https://ghp_YOUR_TOKEN_HERE@github.com/FahmiYoshikage/Class-Ledger.git /opt/telkom-cup

# Atau jika sudah ada folder, pull dengan token:
cd /opt/telkom-cup
git remote set-url origin https://ghp_YOUR_TOKEN_HERE@github.com/FahmiYoshikage/Class-Ledger.git
git pull
```

**Format URL dengan token**:
```
https://ghp_TOKEN@github.com/USERNAME/REPO.git
```

---

### Step 3: Build Docker dari Local Files

```bash
cd /opt/telkom-cup

# Build dan start containers
docker-compose up -d --build
```

**✅ Keuntungan**:
- Docker build dari files lokal (tidak perlu akses GitHub)
- Token tersimpan di VPS untuk git pull berikutnya
- Lebih cepat karena tidak re-clone setiap build

---

## ✅ Solusi 2: SSH Key untuk GitHub

### Step 1: Generate SSH Key di VPS

```bash
# SSH ke VPS
ssh root@your-vps

# Generate SSH key (tekan Enter untuk default)
ssh-keygen -t ed25519 -C "vps-deploy-key"

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

### Step 2: Tambahkan SSH Key ke GitHub

1. Copy output dari command di atas
2. Login GitHub → https://github.com/settings/keys
3. Click **"New SSH key"**
4. Title: `VPS Deploy Key`
5. Paste public key
6. Click **"Add SSH key"**

### Step 3: Clone dengan SSH

```bash
# Test connection
ssh -T git@github.com

# Clone repo
git clone git@github.com:FahmiYoshikage/Class-Ledger.git /opt/telkom-cup

# Build Docker
cd /opt/telkom-cup
docker-compose up -d --build
```

**✅ Keuntungan**:
- Lebih aman (tidak ada token di command history)
- Permanent (key tidak expire)

---

## ✅ Solusi 3: GitHub Deploy Key (Per Repository)

Kalau mau lebih restrictive (hanya untuk repo ini):

### Step 1: Generate Deploy Key di VPS

```bash
ssh-keygen -t ed25519 -C "kas-kelas-deploy-key" -f ~/.ssh/kas_kelas_deploy
cat ~/.ssh/kas_kelas_deploy.pub
```

### Step 2: Tambahkan ke Repository

1. Go to: https://github.com/FahmiYoshikage/Class-Ledger/settings/keys
2. Click **"Add deploy key"**
3. Title: `VPS Deploy Key`
4. Paste public key
5. ✅ **Allow write access** (jika perlu push dari VPS)
6. Click **"Add key"**

### Step 3: Configure SSH di VPS

```bash
# Create SSH config
nano ~/.ssh/config
```

Tambahkan:
```
Host github-kas-kelas
    HostName github.com
    User git
    IdentityFile ~/.ssh/kas_kelas_deploy
    IdentitiesOnly yes
```

### Step 4: Clone dengan Deploy Key

```bash
# Clone
git clone git@github-kas-kelas:FahmiYoshikage/Class-Ledger.git /opt/telkom-cup

# Build Docker
cd /opt/telkom-cup
docker-compose up -d --build
```

---

## 🚀 Deployment Workflow (Recommended)

### Update Code di VPS

```bash
# SSH ke VPS
ssh root@your-vps

cd /opt/telkom-cup

# Pull latest changes
git pull

# Rebuild containers
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

---

## 🔒 Security Best Practices

### 1. **Jangan Hardcode Token di Script**

❌ **JANGAN**:
```bash
git clone https://ghp_TOKEN@github.com/user/repo.git
```

✅ **LAKUKAN**:
```bash
# Store credentials securely
git config --global credential.helper store
git clone https://github.com/user/repo.git
# Input token when prompted
```

### 2. **Limit Token Scope**

- Hanya pilih `repo` scope (jangan `admin`, `delete`, dll)
- Set expiration date (60-90 days)
- Regenerate token secara berkala

### 3. **Gunakan SSH Key untuk Production**

- Personal Access Token: ⏱️ Temporary/testing
- SSH Key: 🔒 Production/long-term

---

## 🛠️ Script Otomatis: VPS Deploy

Buat file: `scripts/vps-deploy.sh`

```bash
#!/bin/bash

set -e

echo "🚀 Deploying to VPS..."

# Variables
REMOTE_HOST="root@your-vps"
REMOTE_PATH="/opt/telkom-cup"

# Pull latest code on VPS
ssh $REMOTE_HOST << 'EOF'
cd /opt/telkom-cup
echo "📥 Pulling latest changes..."
git pull

echo "🐳 Stopping containers..."
docker-compose down

echo "🔨 Building containers..."
docker-compose up -d --build

echo "✅ Deployment complete!"
docker-compose ps
EOF

echo ""
echo "🌐 Application available at: https://triforce.fahmi.app"
```

**Jalankan**:
```bash
chmod +x scripts/vps-deploy.sh
./scripts/vps-deploy.sh
```

---

## 📋 Checklist Setup

### Initial Setup (Sekali Saja):
- [ ] Generate GitHub Personal Access Token atau SSH Key
- [ ] Tambahkan key/token ke GitHub settings
- [ ] Clone repository ke VPS (`/opt/telkom-cup`)
- [ ] Setup `.env.production` files di VPS
- [ ] Test `git pull` (pastikan tidak minta password)

### Every Deployment:
- [ ] Push changes ke GitHub dari local
- [ ] SSH ke VPS
- [ ] `cd /opt/telkom-cup && git pull`
- [ ] `docker-compose up -d --build`
- [ ] Check logs: `docker-compose logs -f`
- [ ] Test: `curl https://triforce.fahmi.app/api/health`

---

## 🆘 Troubleshooting

### Error: "Repository not found" atau "Permission denied"

```bash
# Test GitHub authentication
ssh -T git@github.com
# Expected: "Hi FahmiYoshikage! You've successfully authenticated..."

# Or for HTTPS:
git credential-cache exit
git pull  # Will prompt for credentials again
```

### Error: "Could not read from remote repository"

```bash
# Check remote URL
git remote -v

# Update to use token:
git remote set-url origin https://ghp_TOKEN@github.com/FahmiYoshikage/Class-Ledger.git

# Or update to use SSH:
git remote set-url origin git@github.com:FahmiYoshikage/Class-Ledger.git
```

### Error: Docker build fails on `git clone` inside Dockerfile

**Problem**: Dockerfile mencoba clone repo (jarang terjadi jika pakai `context: ./server`)

**Solution**: Jangan clone di Dockerfile, gunakan local context:

```dockerfile
# ❌ JANGAN ini di Dockerfile
RUN git clone https://github.com/user/repo.git

# ✅ LAKUKAN ini - build dari local files
# docker-compose.yml sudah benar:
build:
  context: ./server  # ← Build dari folder lokal
```

---

## 🎯 Summary

**Best Practice untuk Private Repo**:

1. **Development** (local machine):
   - Clone dengan SSH atau HTTPS + token
   - Push changes ke GitHub

2. **Production** (VPS):
   - Setup SSH key atau Personal Access Token **sekali saja**
   - Clone repo ke `/opt/telkom-cup`
   - Build Docker dari **local files** (bukan re-clone)
   - Update: `git pull` → `docker-compose up -d --build`

**Docker tidak perlu akses GitHub** karena build dari local context (`./server`, `./client`) yang sudah di-clone! 🎉
