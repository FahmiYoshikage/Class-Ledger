# 🐛 Bug Fixes - Event Reminder & Student Update

## Summary Perbaikan

Tanggal: 26 Oktober 2025

### Bug yang Diperbaiki:

1. ✅ **Daftar siswa event tidak muncul**
2. ✅ **Update nomor WhatsApp tidak tersimpan**
3. 🔄 **Simplifikasi Event Reminder UI** (In Progress)

---

## 1. Bug: Daftar Siswa Event Tidak Muncul

### Problem:

-   Ketika memilih event di tab "Reminder Event", daftar siswa yang belum bayar tidak muncul
-   Malah tertulis "Semua siswa sudah bayar" padahal masih ada yang belum bayar

### Root Cause:

Filter terlalu ketat di `handleEventSelect()`:

```javascript
// ❌ BEFORE (Bug):
const unpaid = allStudents.filter(
    (student) =>
        !event.studentsPaid.includes(student._id) && // Array.includes() tidak cocok untuk ObjectId
        student.enableNotification && // Terlalu strict
        student.phoneNumber // Terlalu strict
);
```

**Masalah:**

-   `event.studentsPaid.includes(student._id)` tidak berfungsi dengan baik karena `student._id` adalah object, bukan string
-   Filter `enableNotification` dan `phoneNumber` mem-filter siswa yang tidak punya WA, padahal kita tetap ingin menampilkan mereka

### Solution:

File: `client/src/components/NotificationManager.jsx`

```javascript
// ✅ AFTER (Fixed):
const unpaid = allStudents.filter(
    (student) =>
        !event.studentsPaid.some(
            (paidId) => paidId.toString() === student._id.toString()
        )
);
```

**Perbaikan:**

-   Gunakan `.some()` dengan `.toString()` untuk membandingkan ObjectId
-   Hapus filter `enableNotification` dan `phoneNumber` - tampilkan semua siswa
-   Siswa tanpa WA tetap muncul, tapi tombol kirim akan disabled

### Testing:

```bash
# 1. Pilih event yang ada siswa belum bayar
# 2. Harus muncul semua siswa yang belum bayar
# 3. Siswa tanpa nomor WA tertulis "(Tanpa WA)"
```

---

## 2. Bug: Update Nomor WhatsApp Tidak Tersimpan

### Problem:

-   Saat edit data siswa (klik tombol Update di panel siswa)
-   Mengisi/mengubah nomor WhatsApp
-   Setelah submit, nomor WA tetap kosong dan tidak terisi
-   Field lain (nama, absen) berhasil diupdate

### Root Cause:

Route PATCH `/api/students/:id` tidak menghandle field `phoneNumber` dan `enableNotification`:

```javascript
// ❌ BEFORE (Bug):
router.patch('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (req.body.name != null) student.name = req.body.name;
        if (req.body.absen != null) student.absen = req.body.absen;
        if (req.body.status != null) student.status = req.body.status;
        // ❌ phoneNumber dan enableNotification TIDAK dihandle!

        const updatedStudent = await student.save();
        res.json(updatedStudent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
```

### Solution:

File: `server/routes/student.js`

```javascript
// ✅ AFTER (Fixed):
router.patch('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (req.body.name != null) student.name = req.body.name;
        if (req.body.absen != null) student.absen = req.body.absen;
        if (req.body.status != null) student.status = req.body.status;

        // ✅ Handle WhatsApp fields
        if (req.body.phoneNumber !== undefined)
            student.phoneNumber = req.body.phoneNumber;
        if (req.body.enableNotification !== undefined)
            student.enableNotification = req.body.enableNotification;

        const updatedStudent = await student.save();
        res.json(updatedStudent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
```

**Penting:** Gunakan `!== undefined` bukan `!= null` karena:

-   Empty string `""` adalah valid value untuk phoneNumber
-   `false` adalah valid value untuk enableNotification
-   Kita ingin allow user untuk clear/kosongkan phoneNumber

### Testing:

```bash
# 1. Buka panel siswa, klik Edit
# 2. Isi nomor WA: 08123456789
# 3. Centang "Enable Notification"
# 4. Submit
# 5. Refresh page, nomor harus tersimpan
```

---

## 3. Simplifikasi Event Reminder UI (In Progress)

### Rationale:

User feedback: "untuk bagian event di buat supaya reminder ke group saja karena yang namanaya event pasti akan bersama dan membuat group lagi"

### Changes:

1. ❌ **Remove:** Kirim individual per siswa
2. ❌ **Remove:** Kirim bulk dengan checkbox selection
3. ✅ **Keep:** Kirim ke grup WhatsApp dengan @mention
4. ✅ **Improve:** Focus pada group messaging
5. ✅ **Add:** Better visual untuk daftar yang belum bayar

### New UI Flow:

```
1. Pilih Event
   ↓
2. Lihat Progress + Daftar yang Belum Bayar
   ↓
3. Pilih Style Pesan
   ↓
4. Input Group ID
   ↓
5. Preview (Optional)
   ↓
6. Kirim ke Grup
```

### Files Changed:

-   `client/src/components/EventReminderTab.jsx` (NEW - Separated component)
-   `client/src/components/NotificationManager.jsx` (Import dan gunakan EventReminderTab)

---

## Cara Testing Lengkap

### Test 1: Daftar Siswa Event

```bash
# Setup
1. Pastikan ada event dengan siswa yang belum bayar
2. Buka Notification Center → Tab "Reminder Event"
3. Pilih event dari dropdown

# Expected Result
✅ Muncul daftar siswa yang belum bayar
✅ Jumlah siswa sesuai (cek di console log)
✅ Siswa tanpa WA tetap muncul dengan label "(Tanpa WA)"
✅ Progress bar menunjukkan persentase yang benar
```

### Test 2: Update Nomor WhatsApp

```bash
# Setup
1. Buka halaman utama (Dashboard)
2. Klik tombol "Edit" (ikon pensil) pada satu siswa
3. Isi nomor WhatsApp: 08123456789
4. Centang "Enable Notification"
5. Klik "Update"

# Expected Result
✅ Modal tertutup
✅ Refresh page → nomor WA tersimpan
✅ CheckBox notification tersimpan
✅ Bisa edit lagi dan clear phoneNumber (kosongkan)
```

### Test 3: Event Group Reminder

```bash
# Setup
1. Pilih event dengan siswa belum bayar
2. Pilih style pesan (misal: Friendly)
3. Input Group ID (atau test mode)
4. Klik "Preview Pesan"

# Expected Result
✅ Muncul preview dengan @mention semua yang belum bayar
✅ Preview menunjukkan progress, deadline, dan jumlah
✅ Tombol "Kirim ke Grup" aktif
✅ Setelah kirim → success message muncul
```

---

## Environment Setup untuk Testing

### Backend (.env)

```bash
MONGODB_URI=mongodb://localhost:27017/kas-kelas
FONNTE_API_TOKEN=your_token_here
WA_TEST_MODE=true  # PENTING: Set true untuk testing
AUTO_REMINDER_ENABLED=false
```

### Start Servers

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm run dev
```

### Create Test Data

```javascript
// Via MongoDB Compass atau mongosh

// 1. Buat event test
db.events.insertOne({
    name: 'Study Tour Bali',
    description: 'Trip ke Bali',
    targetAmount: 10000000,
    perStudentAmount: 500000,
    startDate: new Date('2025-11-01'),
    endDate: new Date('2025-12-25'),
    status: 'aktif',
    studentsPaid: [
        ObjectId('...'), // ID siswa yang sudah bayar
        ObjectId('...'),
    ],
});

// 2. Pastikan ada siswa dengan phoneNumber
db.students.updateOne(
    { name: 'Budi' },
    {
        $set: {
            phoneNumber: '08123456789',
            enableNotification: true,
        },
    }
);
```

---

## Debugging Tips

### Check Console Logs

File `NotificationManager.jsx` sudah ada console.log untuk debugging:

```javascript
console.log('Event:', event.name);
console.log('Total students:', allStudents.length);
console.log('Students paid:', event.studentsPaid.length);
console.log('Unpaid students:', unpaid.length);
```

### Browser DevTools

```javascript
// Inspect Network tab
// Check request payload untuk update student:
{
    name: "Budi",
    absen: 1,
    status: "Aktif",
    phoneNumber: "08123456789",  // ← Harus ada
    enableNotification: true      // ← Harus ada
}

// Check response:
{
    _id: "...",
    phoneNumber: "08123456789",  // ← Harus tersimpan
    enableNotification: true
}
```

### MongoDB Check

```javascript
// Verify update berhasil
db.students.findOne({ name: 'Budi' });
// Harus punya phoneNumber dan enableNotification

// Check event studentsPaid
db.events.findOne({ name: 'Study Tour Bali' });
// studentsPaid adalah array of ObjectId
```

---

## Known Issues & Workarounds

### Issue: Tailwind Dynamic Classes

```javascript
// ❌ Ini TIDAK work di Tailwind JIT:
className={`border-${cat.color}-500`}

// ✅ Gunakan class statis atau inline style:
className={eventCategory === cat.value ? 'border-blue-500 bg-blue-50' : '...'}
```

**Solution:** EventReminderTab sudah menggunakan class statis.

### Issue: ObjectId Comparison

```javascript
// ❌ WRONG
event.studentsPaid.includes(student._id);

// ✅ CORRECT
event.studentsPaid.some(
    (paidId) => paidId.toString() === student._id.toString()
);
```

---

## Files Modified

### Backend

-   ✅ `server/routes/student.js` - Added phoneNumber & enableNotification handling

### Frontend

-   ✅ `client/src/components/NotificationManager.jsx` - Fixed handleEventSelect filter
-   ✅ `client/src/components/EventReminderTab.jsx` - NEW separate component (simplified UI)

### Documentation

-   ✅ `BUG_FIXES.md` - This file

---

## Next Steps

1. ✅ Test bug fix #1 (daftar siswa event)
2. ✅ Test bug fix #2 (update WA number)
3. 🔄 Complete simplifikasi UI (integrate EventReminderTab)
4. 🔄 Test end-to-end event group reminder
5. ⏳ Update documentation

---

## Support

Jika masih ada issue:

1. Check console browser untuk error
2. Check server logs di terminal
3. Verify test mode: `WA_TEST_MODE=true`
4. Check MongoDB data structure
5. Clear browser cache jika perlu

---

**Status:** 2/3 bugs fixed, 1 in progress
**Updated:** 26 Oktober 2025
