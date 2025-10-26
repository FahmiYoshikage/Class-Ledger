# 💰 Kas Kelas - Sistem Pencatatan Kas

Aplikasi web modern untuk pencatatan kas kelas dengan sistem pembayaran mingguan Rp 2.000 per siswa.

![Kas Kelas Banner](https://img.shields.io/badge/Kas_Kelas-v1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D6.0-green)

## 🚀 Features

- ✅ **Dashboard Interaktif** - Monitoring kas real-time
- ✅ **Manajemen Siswa** - CRUD data siswa lengkap
- ✅ **Tracking Pembayaran** - Riwayat pembayaran per siswa
- ✅ **Button "Bayar Kas"** - Input pembayaran instant
- ✅ **Status Otomatis** - Badge "Telat" untuk tunggakan ≥ 4 minggu
- ✅ **Pencatatan Pengeluaran** - Track penggunaan kas
- ✅ **Perhitungan Otomatis** - Total, tunggakan, saldo
- ✅ **Responsive Design** - Mobile-friendly
- ✅ **MongoDB Integration** - Data tersimpan permanen

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Library
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB

## 📁 Project Structure

```
kas-kelas/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js     # API integration layer
│   │   ├── App.jsx        # Main app component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── .env               # Environment variables
│   ├── vite.config.js     # Vite configuration
│   └── package.json
│
├── server/                 # Backend Node.js + Express
│   ├── models/
│   │   ├── Student.js     # Student schema
│   │   ├── Payment.js     # Payment schema
│   │   └── Expense.js     # Expense schema
│   ├── routes/
│   │   ├── students.js    # Student routes
│   │   ├── payments.js    # Payment routes
│   │   └── expenses.js    # Expense routes
│   ├── config/
│   │   └── database.js    # MongoDB connection
│   ├── .env               # Environment variables
│   ├── server.js          # Express server
│   └── package.json
│
└── README.md              # This file
```

## 🔧 Installation

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0 (Local atau Atlas)
- npm atau yarn

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/kas-kelas.git
cd kas-kelas
```

### 2. Setup Backend

```bash
cd server
npm install
```

Buat file `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kas-kelas
NODE_ENV=development
```

### 3. Setup Frontend

```bash
cd ../client
npm install
```

Buat file `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Install Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 5. Start MongoDB

**Local:**
```bash
# Mac/Linux
sudo systemctl start mongodb

# Windows
net start MongoDB
```

**Atau gunakan MongoDB Atlas** (Cloud) - Gratis!

### 6. Run Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Buka browser: `http://localhost:3000`

## 📖 Usage

### 1. Tambah Siswa

1. Buka tab **"Siswa"**
2. Klik tombol **"Tambah Siswa"**
3. Isi nomor absen dan nama
4. Klik **"Simpan"**

### 2. Input Pembayaran (Quick)

1. Di tab **"Dashboard"**
2. Cari nama siswa
3. Klik tombol **"Bayar Kas"**
4. Pembayaran Rp 2.000 otomatis tercatat!

### 3. Input Pembayaran (Manual)

1. Buka tab **"Pembayaran"**
2. Klik **"Tambah Pembayaran"**
3. Pilih siswa, isi jumlah, tanggal, metode
4. Klik **"Simpan"**

### 4. Input Pengeluaran

1. Buka tab **"Pengeluaran"**
2. Klik **"Tambah Pengeluaran"**
3. Isi keperluan, jumlah, kategori
4. Klik **"Simpan"**

### 5. Monitor Status

Status otomatis di dashboard:
- 🟢 **Lunas** - Tidak ada tunggakan
- 🟡 **Aktif** - Ada tunggakan < 4 minggu
- 🔴 **Telat** - Tunggakan ≥ 4 minggu (Rp 8.000)

## 🌐 API Documentation

### Students API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Get all students |
| GET | `/api/students/:id` | Get single student |
| POST | `/api/students` | Create new student |
| PATCH | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

**Example Request:**
```bash
POST /api/students
Content-Type: application/json

{
  "name": "Ahmad Rizki",
  "absen": 1,
  "status": "Aktif"
}
```

### Payments API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | Get all payments |
| GET | `/api/payments/student/:id` | Get payments by student |
| POST | `/api/payments` | Create new payment |
| DELETE | `/api/payments/:id` | Delete payment |

**Example Request:**
```bash
POST /api/payments
Content-Type: application/json

{
  "studentId": "507f1f77bcf86cd799439011",
  "amount": 2000,
  "date": "2025-10-25",
  "method": "Tunai",
  "note": "Pembayaran minggu ke-43"
}
```

### Expenses API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Create new expense |
| DELETE | `/api/expenses/:id` | Delete expense |

**Example Request:**
```bash
POST /api/expenses
Content-Type: application/json

{
  "purpose": "Pembelian sapu dan pel",
  "amount": 50000,
  "date": "2025-10-25",
  "category": "Kebersihan",
  "approvedBy": "Wali Kelas"
}
```

## 🚀 Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

**Deploy Backend:**
1. Push code ke GitHub
2. Connect repository ke Railway
3. Set environment variables
4. Deploy!

**Deploy Frontend:**
1. Update `.env` dengan Railway backend URL
2. Connect repository ke Vercel
3. Set root directory ke `client`
4. Deploy!

### Option 2: All-in-One di Render

1. Build command: `cd server && npm install && npm run build`
2. Start command: `cd server && npm start`
3. Set environment variables
4. Deploy!

### Option 3: VPS (DigitalOcean, AWS, dll)

```bash
# Install PM2
npm install -g pm2

# Clone & install
git clone your-repo
cd kas-kelas
cd server && npm install
cd ../client && npm install && npm run build

# Start with PM2
pm2 start server/server.js --name kas-kelas
pm2 save
pm2 startup
```

Setup Nginx reverse proxy untuk production.

## 🔒 Security

- ✅ CORS protection
- ✅ Input validation with Mongoose
- ✅ Error handling middleware
- ✅ Environment variables for secrets
- 🔄 Rate limiting (optional)
- 🔄 Helmet.js for security headers (optional)
- 🔄 JWT authentication (optional)

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 📊 Database Schema

### Student Model
```javascript
{
  name: String,
  absen: Number (unique),
  status: "Aktif" | "Tidak Aktif" | "Alumni",
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Model
```javascript
{
  studentId: ObjectId (ref: Student),
  amount: Number,
  date: Date,
  week: Number,
  method: "Tunai" | "Transfer",
  note: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Expense Model
```javascript
{
  purpose: String,
  amount: Number,
  date: Date,
  category: "Kebersihan" | "Acara" | "Perlengkapan" | "Lain-lain",
  approvedBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Roadmap

- [x] Basic CRUD operations
- [x] Payment tracking
- [x] Auto status calculation
- [ ] User authentication
- [ ] Multi-class support
- [ ] Export to Excel
- [ ] WhatsApp notifications
- [ ] QR Code payments
- [ ] Upload bukti transfer
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## �� Acknowledgments

- Inspired by real classroom needs
- Built with ❤️ for students and teachers
- Thanks to all contributors

## 📞 Support

Jika ada pertanyaan atau masalah:

1. Buka [Issues](https://github.com/yourusername/kas-kelas/issues)
2. Email: support@example.com
3. Documentation: [Wiki](https://github.com/yourusername/kas-kelas/wiki)

## 📸 Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Payment Tracking
![Payments](screenshots/payments.png)

### Mobile View
![Mobile](screenshots/mobile.png)

---

**Made with �� by [Your Name]**

⭐ Star this repo if you find it helpful!
