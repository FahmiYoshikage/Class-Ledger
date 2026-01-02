# 🔧 Session Management Debugging Guide

## Masalah: Session Management Tidak Bekerja (401 Unauthorized)

### Kemungkinan Penyebab:

1. **Token tidak ada di localStorage**
2. **Token expired**
3. **Server belum membuat session saat login**
4. **CORS atau interceptor issue**

---

## ✅ Solusi & Debugging Steps

### Step 1: Cek Token di Browser Console

Buka browser console (`F12`) dan jalankan:

```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

**Jika token NULL atau undefined:**

-   User belum login atau sudah logout
-   **Solusi:** Login ulang

---

### Step 2: Test Login & Session Creation

1. **Logout terlebih dahulu:**

    - Click tombol "Logout" di navbar
    - Atau manual clear localStorage:

    ```javascript
    localStorage.clear();
    ```

2. **Login kembali:**

    - Pergi ke `/login`
    - Login dengan admin credentials
    - Cek console, seharusnya ada log "Login successful"

3. **Navigate ke `/sessions`:**
    - Seharusnya langsung create session jika belum ada
    - Check console logs untuk debug info

---

### Step 3: Verify Backend Session Routes

Test dengan curl (dari terminal):

```bash
# 1. Login dulu
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}'

# Copy token dari response

# 2. Test sessions endpoint
curl -X GET http://localhost:5000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
    "success": true,
    "data": [
        {
            "_id": "...",
            "user": "...",
            "deviceInfo": {
                "browser": "Chrome",
                "os": "Linux",
                "device": "Desktop"
            },
            "isCurrent": true
        }
    ]
}
```

---

### Step 4: Check Server Logs

```bash
cd /home/fahmi/Documents/Project/kas-kelas/server
pm2 logs api-server
```

Look for errors related to:

-   `GET /api/sessions`
-   `Authentication error`
-   `Token verification`

---

### Step 5: Verify Auth Middleware

File: `/server/middleware/auth.js`

Pastikan `authenticate` middleware:

1. ✅ Read token from `Authorization` header
2. ✅ Verify token dengan JWT_SECRET
3. ✅ Find user dan attach ke `req.user`
4. ✅ Check `user.isActive`

---

### Step 6: Check Session Model

File: `/server/models/Session.js`

Pastikan schema memiliki:

```javascript
{
  user: ObjectId,
  token: String,
  deviceInfo: Object,
  ipAddress: String,
  expiresAt: Date,
  isActive: Boolean
}
```

---

## 🚀 Quick Fix: Force Create Session on First Access

Jika user sudah login tapi session belum ada, backend akan otomatis create session saat pertama kali akses `/api/sessions`.

**Code di `/server/routes/sessions.js`:**

```javascript
router.get('/', authenticate, async (req, res) => {
    // Get sessions
    const sessions = await Session.find({...});

    // AUTO-CREATE if no session exists
    if (sessions.length === 0 && currentToken) {
        const newSession = await createSession(req.user._id, currentToken, req);
        sessions.push(newSession);
    }

    res.json({ success: true, data: sessions });
});
```

---

## 🔍 Frontend Debugging

### Check axios interceptor

File: `/client/src/services/api.js`

Verify bahwa interceptor menambahkan Authorization header:

```javascript
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

### Check SessionManagement component

File: `/client/src/pages/SessionManagement.jsx`

Added debug console.log:

```javascript
useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token in localStorage:', token ? 'EXISTS' : 'MISSING');
    console.log('Token length:', token?.length);

    fetchSessions();
}, []);
```

---

## 📝 Testing Checklist

-   [ ] Token exists in localStorage after login
-   [ ] Authorization header is sent in axios requests
-   [ ] Backend receives token and verifies successfully
-   [ ] Session is created on login
-   [ ] GET /api/sessions returns data (or auto-creates session)
-   [ ] GET /api/sessions/stats returns statistics
-   [ ] Frontend displays sessions correctly

---

## 🐛 Common Issues

### Issue 1: "401 Unauthorized" meskipun sudah login

**Cause:** Token tidak dikirim atau invalid

**Fix:**

```javascript
// In browser console
localStorage.clear();
// Then login again
```

### Issue 2: Session not created on login

**Cause:** `createSession()` tidak dipanggil di auth routes

**Fix:** Sudah diperbaiki di `/server/routes/auth.js` line ~145

### Issue 3: Frontend shows "No sessions" meskipun ada session

**Cause:** Frontend tidak handle response.data.data correctly

**Fix:** Sudah diperbaiki di SessionManagement.jsx:

```javascript
setSessions(response.data.data || []);
```

---

## ✨ Expected Behavior

1. **Login** → Backend creates session automatically
2. **Navigate to /sessions** → Shows current session
3. **Login from another device** → Shows multiple sessions
4. **Click "Terminate"** → That session is deactivated
5. **Click "Logout Semua Perangkat Lain"** → All other sessions deactivated

---

## 💡 Tips

-   Always check browser console for debug logs
-   Check Network tab for 401 errors
-   Check PM2 logs for backend errors
-   Clear localStorage if weird behavior occurs
-   Re-login after clearing localStorage

---

## 🆘 Still Not Working?

1. Restart both frontend and backend:

```bash
# Backend
cd /home/fahmi/Documents/Project/kas-kelas/server
pm2 restart api-server

# Frontend
cd /home/fahmi/Documents/Project/kas-kelas/client
npm run dev
```

2. Clear MongoDB sessions collection:

```bash
mongosh kas-kelas --eval "db.sessions.deleteMany({})"
```

3. Test login with curl to verify backend works

4. Check if JWT_SECRET is set correctly in .env

---

## 📞 Need More Help?

Check:

-   `/server/routes/sessions.js` - Session endpoints
-   `/server/middleware/auth.js` - Authentication logic
-   `/client/src/services/api.js` - Axios configuration
-   `/client/src/pages/SessionManagement.jsx` - Frontend component

All files have been updated with better error handling and auto-session creation!
