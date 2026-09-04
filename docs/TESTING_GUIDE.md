# Testing Guide - Bug Fixes

## Quick Testing Commands

### Test 1: Verifikasi Route Student Sudah Diperbaiki

```bash
# Start backend
cd /home/fahmi/Documents/Project/kas-kelas/server
npm start
```

Di terminal lain, test API:

```bash
# Get student ID dulu
curl http://localhost:5000/api/students

# Update student dengan phoneNumber
curl -X PATCH http://localhost:5000/api/students/STUDENT_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "08123456789",
    "enableNotification": true
  }'

# Verify update berhasil
curl http://localhost:5000/api/students/STUDENT_ID_HERE
```

**Expected:** Response harus include `phoneNumber` dan `enableNotification`

---

### Test 2: Start Frontend dan Manual Test

```bash
# Di terminal baru
cd /home/fahmi/Documents/Project/kas-kelas/client
npm run dev
```

Buka browser: `http://localhost:5173`

**Test Checklist:**

1. **Update WhatsApp Number**

    - [ ] Klik edit siswa
    - [ ] Isi nomor WA: 08123456789
    - [ ] Centang "Enable Notification"
    - [ ] Submit
    - [ ] Refresh page
    - [ ] Nomor WA harus muncul ✅

2. **Event Reminder - Daftar Siswa**

    - [ ] Pergi ke Notification Center
    - [ ] Klik tab "Reminder Event"
    - [ ] Pilih event
    - [ ] Daftar siswa yang belum bayar harus muncul ✅
    - [ ] Check console browser untuk log debug

3. **Event Group Reminder**
    - [ ] Pilih event
    - [ ] Pilih style pesan
    - [ ] Input Group ID (atau skip jika test mode)
    - [ ] Klik "Preview Pesan"
    - [ ] Preview harus tampil dengan @mention ✅
    - [ ] (Optional) Kirim ke grup

---

## Status Perbaikan

### ✅ FIXED: Update WhatsApp Number

-   File: `server/routes/student.js`
-   Changes: Added phoneNumber and enableNotification handling
-   Test: Update siswa → nomor WA tersimpan

### ✅ FIXED: Event Student List

-   File: `client/src/components/NotificationManager.jsx`
-   Changes: Fixed filter logic dengan .some() dan .toString()
-   Test: Pilih event → siswa belum bayar muncul

### 🔄 IN PROGRESS: Simplify Event UI

-   File: `client/src/components/EventReminderTab.jsx` (created)
-   Status: Component created, need to integrate
-   Next: Import dan replace event tab di NotificationManager

---

## Jika Ada Error

### Error: Cannot read property 'includes' of undefined

**Fix:** Sudah diperbaiki dengan .some() method

### Error: phoneNumber not saving

**Fix:** Sudah diperbaiki di routes/student.js

### Error: EventReminderTab not found

**Fix:** File sudah dibuat, tinggal integrate

### Error: Port already in use

```bash
# Kill process di port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process di port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

---

## Summary

**2 Bugs Fixed:**

1. ✅ Update WhatsApp number tidak tersimpan
2. ✅ Daftar siswa event tidak muncul

**1 Enhancement In Progress:** 3. 🔄 Simplify Event UI (focus grup only)

**Ready to Test!** 🚀
