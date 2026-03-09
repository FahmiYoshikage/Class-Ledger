import axios from 'axios';
import Notification from '../models/Notification.js';
import antiBanService from './antiBanService.js';

// ==============================================
// 💳 INFORMASI PEMBAYARAN
// ==============================================
const PAYMENT_INFO = `

━━━━━━━━━━━━━━━━━━━━
💳 *INFORMASI PEMBAYARAN*
Semua atas nama: *Fahmi Ilham Bagaskara*

*E-Wallet:*
� Gopay: 085646745887
💰 Dana: 085646745887
🛍️ ShopeePay: 085646745887

*Mobile Banking:*
🏦 SeaBank: 901006225290
🏦 BRI: 011001041959536
━━━━━━━━━━━━━━━━━━━━

_Mohon konfirmasi setelah transfer ya!_ ✅

🏆 *Cek Leaderboard Donatur Kelas:*
https://triforce.deepkernel.site/leaderboard
_Raih posisi teratas dan jadi donatur terbaik!_ 🚀`;

// ==============================================
// 🎨 TEMPLATE PESAN KREATIF & VARIATIF
// ==============================================

const CREATIVE_TEMPLATES = {
    // Template lucu & santai
    friendly: [
        (name, weeks, amount) =>
            `Halo ${name}! 👋\n\n` +
            `Kangen bayar kas ya? 😄\n` +
            `Udah ${weeks} minggu nih belum bayar\n` +
            `Total: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Yuk buruan bayar biar adem hatinya 🥰\n` +
            `Ditunggu ya bestie! 💙` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `Hai ${name}! 🌟\n\n` +
            `Notif spesial buat kamu nih!\n` +
            `Kas kelas lagi kangen kontribusimu 💰\n\n` +
            `Tunggakan: ${weeks} minggu\n` +
            `Total: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Gas bayar sekarang yuk! 🚀` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `${name}, denger denger ada yang belum bayar kas? 🤔\n\n` +
            `Oh ternyata kamu toh! 😆\n` +
            `${weeks} minggu = Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Yuk dibayar, jangan lupa ya! 💪` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `Woi ${name}! 🫡\n\n` +
            `Kabar kas kelas nih..\n` +
            `Kamu masih ada tunggakan ${weeks} minggu lho\n` +
            `Totalnya Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Kapan nih mau bayar? 😁\n` +
            `Kutunggu yaa~ 💕` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `Hei hei ${name}! 🤗\n\n` +
            `Bendahara lagi keliling nagih nih hehe\n` +
            `Giliran kamu sekarang 😄\n\n` +
            `${weeks} minggu belum bayar\n` +
            `= Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Yuk bayar biar gak kepikiran terus 🙌` +
            PAYMENT_INFO,
    ],

    // Template motivasi
    motivational: [
        (name, weeks, amount) =>
            `${name}, setiap pembayaran adalah investasi! 💎\n\n` +
            `Dengan membayar kas, kita bersama-sama\n` +
            `membangun kelas yang lebih baik 🏆\n\n` +
            `Tunggakan: ${weeks} minggu\n` +
            `Nominal: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Mari jadi teladan! ⭐` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `Hai ${name}! 🌈\n\n` +
            `"Kebaikan dimulai dari hal kecil"\n` +
            `Termasuk membayar kas tepat waktu! ⏰\n\n` +
            `Tunggakan: ${weeks} minggu (Rp ${amount.toLocaleString(
                'id-ID'
            )})\n\n` +
            `Yuk jadi yang terdepan! 🎯` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `${name}! 🌟\n\n` +
            `Tau gak sih? Kelas kita makin solid\n` +
            `karena kontribusi teman-teman yang bayar kas 💪\n\n` +
            `Kamu juga bisa jadi bagian itu!\n` +
            `Tinggal lunasin ${weeks} minggu (Rp ${amount.toLocaleString('id-ID')})\n\n` +
            `Ayo kita raih yang terbaik bareng! 🏅` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `Hey ${name} 🔥\n\n` +
            `"Disiplin adalah jembatan antara\n` +
            `tujuan dan pencapaian"\n\n` +
            `Tunggakan kas: ${weeks} minggu\n` +
            `Total: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Ayo buktiin kalau kamu bisa! 🚀` +
            PAYMENT_INFO,
    ],

    // Template formal tapi tetap ramah
    formal: [
        (name, weeks, amount) =>
            `Kepada Yth. ${name} 📢\n\n` +
            `Kami informasikan bahwa terdapat\n` +
            `tunggakan pembayaran kas kelas:\n\n` +
            `• Periode: ${weeks} minggu\n` +
            `• Nominal: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Mohon dapat segera dilunasi.\n` +
            `Terima kasih atas perhatiannya! 🙏` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `Reminder Pembayaran Kas 📋\n\n` +
            `Nama: ${name}\n` +
            `Status: Belum Lunas\n` +
            `Tunggakan: ${weeks} minggu\n` +
            `Total: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Dimohon untuk segera melakukan pembayaran.\n` +
            `Salam hormat, Bendahara Kelas 🙏` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `Pemberitahuan Kas Kelas 🔔\n\n` +
            `Yth. ${name},\n\n` +
            `Dengan ini kami sampaikan bahwa\n` +
            `pembayaran kas kelas Anda tercatat\n` +
            `memiliki tunggakan sebagai berikut:\n\n` +
            `Durasi : ${weeks} minggu\n` +
            `Jumlah : Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Mohon kerjasamanya untuk segera\n` +
            `menyelesaikan pembayaran. Terima kasih.` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `📌 Notifikasi Kas Kelas\n\n` +
            `Sdr/i ${name},\n\n` +
            `Berdasarkan catatan bendahara,\n` +
            `Anda memiliki kewajiban pembayaran\n` +
            `kas yang belum terpenuhi.\n\n` +
            `Detail:\n` +
            `- Minggu tertunggak: ${weeks}\n` +
            `- Total: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Atas perhatiannya, terima kasih. 🙏` +
            PAYMENT_INFO,
    ],

    // Template dengan emoji & energi tinggi
    energetic: [
        (name, weeks, amount) =>
            `🔥 ALERT! ALERT! 🔥\n\n` +
            `${name}, ini bukan spam kok! 😎\n` +
            `Cuma mau ngingetin aja~\n\n` +
            `⏰ ${weeks} minggu belum bayar\n` +
            `💰 Total: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Yuk gas ke bendahara! 🏃‍♂️💨\n` +
            `Let's gooo! 🚀` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `⚡ FLASH REMINDER ⚡\n\n` +
            `Hai ${name}!\n` +
            `Time to shine! ✨\n\n` +
            `📌 Tunggakan: ${weeks} minggu\n` +
            `💵 Amount: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Bayar sekarang = Auto sultan! 👑` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `💥 BOOM! ${name}! 💥\n\n` +
            `Bendahara memanggil! 📣\n` +
            `Ada misi penting untukmu nih!\n\n` +
            `🎯 Misi: Bayar kas ${weeks} minggu\n` +
            `💰 Reward: Hati tenang & nama bersih\n` +
            `📊 Total: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Accept mission? LFG! 🔥🔥` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `🚨 REMINDER ALERT 🚨\n\n` +
            `${name}! Jangan skip yang satu ini!\n\n` +
            `Kas kelas butuh kontribusimu!\n` +
            `${weeks} minggu x Rp 2.000\n` +
            `= Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Action sekarang! Kamu pasti bisa! 💪🔥` +
            PAYMENT_INFO,
    ],

    // Template dengan puns & humor
    humorous: [
        (name, weeks, amount) =>
            `${name}, kabar gembira! 🎉\n\n` +
            `Kamu menang undian jadi orang yang\n` +
            `paling ditunggu bayaran kasnya! 😂\n\n` +
            `Hadiah: Lunasin ${weeks} minggu\n` +
            `Bonus: Hati adem, dompet ringan 💸\n` +
            `Total: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Klaim hadiahnya ke bendahara ya! 🏆` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `Breaking News! 📰\n\n` +
            `${name} masuk trending topic\n` +
            `kategori "Belum Bayar Kas" 😱\n\n` +
            `Durasi trending: ${weeks} minggu\n` +
            `Cara turun trending: Bayar Rp ${amount.toLocaleString(
                'id-ID'
            )}\n\n` +
            `Gaskeun biar viral positif! 📈` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `${name}, fun fact: 🤓\n\n` +
            `Tahukah kamu bahwa ${weeks} minggu itu\n` +
            `sama dengan ${weeks * 7} hari tanpa bayar kas? 😱\n\n` +
            `Totalnya udah Rp ${amount.toLocaleString('id-ID')} lho!\n\n` +
            `Mending bayar sekarang daripada\n` +
            `angkanya makin gede kan? 😂\n` +
            `Hidup hemat, bayar kas! 💸` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `Psst.. ${name}! 🤫\n\n` +
            `Aku punya rahasia nih..\n` +
            `*bisik-bisik*\n\n` +
            `Kamu belum bayar kas ${weeks} minggu 😂\n` +
            `Totalnya Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Rahasia ini bakal hilang\n` +
            `kalau kamu bayar sekarang! 🤐✨` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `⚠️ PERINGATAN PENTING ⚠️\n\n` +
            `${name}, jangan panik dulu..\n` +
            `Ini cuma reminder kas kok 😆\n\n` +
            `Tunggakan: ${weeks} minggu\n` +
            `Total: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Bayar sekarang, free dari rasa bersalah!\n` +
            `Deal? 🤝😄` +
            PAYMENT_INFO,
    ],

    // Template gentle reminder
    gentle: [
        (name, weeks, amount) =>
            `Hai ${name} 🌸\n\n` +
            `Mau ngingetin dengan lembut nih~\n` +
            `Kas kelas masih menunggu ya 💕\n\n` +
            `Periode: ${weeks} minggu\n` +
            `Jumlah: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `No pressure, tapi jangan lupa ya! 🥺\n` +
            `Makasih banyak! ✨` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `Dear ${name} 💌\n\n` +
            `Just a friendly reminder bahwa\n` +
            `ada kas yang nunggu dibayar nih 😊\n\n` +
            `${weeks} minggu x Rp 2.000 = Rp ${amount.toLocaleString(
                'id-ID'
            )}\n\n` +
            `Whenever you're ready ya!\n` +
            `Thank you! 🙏💖` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `${name} 🫶\n\n` +
            `Maaf ganggu waktunya yaa\n` +
            `Cuma mau kasih tau kalau kas kelas\n` +
            `kamu belum lunas ${weeks} minggu 😊\n\n` +
            `Totalnya Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Kalau sempat, tolong dibayar ya~\n` +
            `Terima kasih banyak! 🙏💫` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `Hi ${name}~ 🌷\n\n` +
            `Semoga harimu menyenangkan!\n` +
            `Oh iya, sekalian mau remind\n` +
            `soal kas kelas ya..\n\n` +
            `Tunggakan: ${weeks} minggu\n` +
            `Nominal: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `Gak buru-buru sih, tapi jangan\n` +
            `sampai lupa ya 😊✨` +
            PAYMENT_INFO,
    ],

    // Template chat casual (baru)
    casual: [
        (name, weeks, amount) =>
            `oi ${name} 😗\n\n` +
            `kas nya kapan dibayar bre\n` +
            `udah ${weeks} minggu ni\n` +
            `Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `jangan lupa yak 🙏` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `${name} gasss bayar kas dong 😤\n\n` +
            `udah numpuk ${weeks} minggu\n` +
            `totalnya Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `ayolah masa harus ditagih terus 😭\n` +
            `thx ya kalau udah bayar! 🫡` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `eh ${name}\n\n` +
            `gua ingetin ya kas nya\n` +
            `${weeks} minggu belom dibayar\n` +
            `Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `tolong ya dibayar 🙏\n` +
            `makasih!` +
            PAYMENT_INFO,

        (name, weeks, amount) =>
            `${name}! cek ini dong 👇\n\n` +
            `Kas kelas kamu belum lunas\n` +
            `${weeks} minggu = Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `bayar sekarang biar tenang~\n` +
            `ok? ok! 😎👍` +
            PAYMENT_INFO,
    ],
};

// Template untuk ucapan terima kasih setelah bayar
const THANK_YOU_TEMPLATES = [
    (name) =>
        `Makasih banget ${name}! 🎉\n\n` +
        `Pembayaranmu udah diterima! ✅\n` +
        `Kamu keren banget! 💪\n\n` +
        `Keep being awesome! 🌟`,

    (name) =>
        `Yeay! ${name} udah bayar! 🎊\n\n` +
        `Terima kasih ya sudah berkontribusi\n` +
        `untuk kas kelas kita! 💙\n\n` +
        `You're the best! ⭐`,

    (name) =>
        `${name}, you rock! 🎸\n\n` +
        `Pembayaran berhasil diterima!\n` +
        `Saldo kas kelas bertambah nih! 📈\n\n` +
        `Thanks a million! 🙏✨`,

    (name) =>
        `Wah ${name} udah bayar! 🥳\n\n` +
        `Terima kasih banyak ya!\n` +
        `Kas kelas makin sehat berkat kamu 💰\n\n` +
        `Semoga rezekinya makin lancar! 🤲✨`,

    (name) =>
        `${name}! Pembayaran diterima 🫡\n\n` +
        `Mantap! Kamu sudah berkontribusi\n` +
        `untuk kelas kita. Respect! 🔥\n\n` +
        `Terima kasih banyak ya 🙏`,

    (name) =>
        `Cie ${name} udah bayar 😏\n\n` +
        `Sip banget! Pembayaran tercatat.\n` +
        `Kamu teman kelas yang top! 👑\n\n` +
        `Thank you! 💜`,
];

// ==============================================
// 🎉 TEMPLATE EVENT REMINDER
// ==============================================

const EVENT_REMINDER_TEMPLATES = {
    friendly: [
        (name, eventName, amount, deadline) =>
            `Hai ${name}! 👋\n\n` +
            `Reminder nih untuk event:\n` +
            `🎉 *${eventName}*\n\n` +
            `Iuran: Rp ${amount.toLocaleString('id-ID')}\n` +
            `Deadline: ${deadline}\n\n` +
            `Yuk segera bayar ya!\n` +
            `Ditunggu partisipasinya! 💙` +
            PAYMENT_INFO,

        (name, eventName, amount, deadline) =>
            `Halo ${name}! 🌟\n\n` +
            `Jangan lupa ya, ada event:\n` +
            `✨ *${eventName}*\n\n` +
            `Yang perlu dibayar: Rp ${amount.toLocaleString('id-ID')}\n` +
            `Batas waktu: ${deadline}\n\n` +
            `Ayo segera daftar! 🚀` +
            PAYMENT_INFO,
    ],

    urgent: [
        (name, eventName, amount, deadline) =>
            `⚡ URGENT REMINDER ⚡\n\n` +
            `${name}, event *${eventName}* sudah dekat!\n\n` +
            `💰 Iuran: Rp ${amount.toLocaleString('id-ID')}\n` +
            `⏰ Deadline: ${deadline}\n\n` +
            `Buruan bayar sebelum terlambat ya! 🏃‍♂️` +
            PAYMENT_INFO,

        (name, eventName, amount, deadline) =>
            `🔔 LAST CALL! 🔔\n\n` +
            `${name}, ini reminder terakhir nih!\n\n` +
            `Event: *${eventName}*\n` +
            `Bayar: Rp ${amount.toLocaleString('id-ID')}\n` +
            `Deadline: ${deadline}\n\n` +
            `Jangan sampai ketinggalan! ⚡` +
            PAYMENT_INFO,
    ],

    formal: [
        (name, eventName, amount, deadline) =>
            `Kepada Yth. ${name}\n\n` +
            `Pengingat pembayaran event:\n` +
            `📋 *${eventName}*\n\n` +
            `Nominal: Rp ${amount.toLocaleString('id-ID')}\n` +
            `Batas Akhir: ${deadline}\n\n` +
            `Mohon segera melakukan pembayaran.\n` +
            `Terima kasih 🙏` +
            PAYMENT_INFO,
    ],

    motivational: [
        (name, eventName, amount, deadline) =>
            `${name}, mari kita sukses bersama! 🎯\n\n` +
            `Event *${eventName}* butuh dukunganmu!\n\n` +
            `Kontribusi: Rp ${amount.toLocaleString('id-ID')}\n` +
            `Target: ${deadline}\n\n` +
            `Bersama kita bisa! 💪⭐` +
            PAYMENT_INFO,
    ],

    humorous: [
        (name, eventName, amount, deadline) =>
            `Knock knock! 🚪\n` +
            `Who's there?\n` +
            `Event reminder! 😄\n\n` +
            `${name}, jangan lupa ya:\n` +
            `🎪 *${eventName}*\n` +
            `💸 Rp ${amount.toLocaleString('id-ID')}\n` +
            `📅 Deadline: ${deadline}\n\n` +
            `Bayar sekarang = Auto VIP! 😎` +
            PAYMENT_INFO,
    ],
};

// ==============================================
// 🤖 FONNTE API INTEGRATION
// ==============================================

class WhatsAppService {
    constructor() {
        this.apiUrl = 'https://api.fonnte.com/send';
        this.apiToken = process.env.FONNTE_API_TOKEN || '';

        if (!this.apiToken) {
            console.warn('⚠️  FONNTE_API_TOKEN tidak ditemukan di .env');
        }
    }

    // Normalize nomor telepon ke format internasional
    normalizePhoneNumber(phone) {
        if (!phone) return null;

        // Remove semua karakter non-digit
        let cleaned = phone.replace(/\D/g, '');

        // Convert 08xxx ke 628xxx
        if (cleaned.startsWith('08')) {
            cleaned = '62' + cleaned.substring(1);
        }

        // Pastikan dimulai dengan 62
        if (!cleaned.startsWith('62')) {
            cleaned = '62' + cleaned;
        }

        return cleaned;
    }

    // Pilih template random dari kategori tertentu
    getRandomTemplate(category = 'friendly') {
        const templates =
            CREATIVE_TEMPLATES[category] || CREATIVE_TEMPLATES.friendly;
        const randomIndex = Math.floor(Math.random() * templates.length);
        return templates[randomIndex];
    }

    // Generate pesan reminder
    generateReminderMessage(
        studentName,
        weeksLate,
        amount,
        category = 'friendly'
    ) {
        const template = this.getRandomTemplate(category);
        return template(studentName, weeksLate, amount);
    }

    // Generate pesan thank you
    generateThankYouMessage(studentName) {
        const randomIndex = Math.floor(
            Math.random() * THANK_YOU_TEMPLATES.length
        );
        return THANK_YOU_TEMPLATES[randomIndex](studentName);
    }

    // Kirim pesan WhatsApp via Fonnte
    async sendMessage(phoneNumber, message, options = {}) {
        try {
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

            if (!normalizedPhone) {
                throw new Error('Nomor telepon tidak valid');
            }

            console.log(`🔧 WA_TEST_MODE: ${process.env.WA_TEST_MODE}`);
            console.log(
                `🔧 WA_TEST_MODE type: ${typeof process.env.WA_TEST_MODE}`
            );
            console.log(
                `🔧 Check result: ${process.env.WA_TEST_MODE === 'true'}`
            );

            // Mode test: hanya log tanpa kirim
            if (process.env.WA_TEST_MODE === 'true') {
                console.log('📱 TEST MODE - Pesan tidak dikirim:');
                console.log(`To: ${normalizedPhone}`);
                console.log(`Message:\n${message}`);
                return {
                    success: true,
                    status: 'sent',
                    messageId: 'test_' + Date.now(),
                    testMode: true,
                };
            }

            // 🛡️ Humanisasi pesan agar setiap pesan unik (anti-ban)
            const humanizedMessage = antiBanService.humanizeMessage(message);

            // Kirim via Fonnte API
            console.log(`📡 Calling Fonnte API...`);
            console.log(
                `🔑 API Token: ${
                    this.apiToken
                        ? this.apiToken.substring(0, 10) + '...'
                        : 'NOT SET'
                }`
            );
            console.log(`🎯 Target: ${normalizedPhone}`);

            const response = await axios.post(
                this.apiUrl,
                {
                    target: normalizedPhone,
                    message: humanizedMessage,
                    countryCode: '62',
                    ...options,
                },
                {
                    headers: {
                        Authorization: this.apiToken,
                    },
                }
            );

            console.log(`📥 Fonnte response:`, response.data);

            return {
                success: response.data.status === true,
                status: response.data.status ? 'sent' : 'failed',
                messageId: response.data.id || null,
                detail: response.data.detail || null,
            };
        } catch (error) {
            console.error('❌ Error sending WhatsApp:', error.message);
            if (error.response) {
                console.error('📛 Response status:', error.response.status);
                console.error('📛 Response data:', error.response.data);
            }
            return {
                success: false,
                status: 'failed',
                error: error.message,
            };
        }
    }

    // Kirim reminder pembayaran
    async sendPaymentReminder(
        student,
        weeksLate,
        amount,
        category = 'friendly'
    ) {
        try {
            if (!student.phoneNumber) {
                throw new Error('Siswa tidak memiliki nomor WhatsApp');
            }

            if (!student.enableNotification) {
                throw new Error('Notifikasi dinonaktifkan untuk siswa ini');
            }

            // Generate pesan
            const message = this.generateReminderMessage(
                student.name,
                weeksLate,
                amount,
                category
            );

            // Kirim pesan
            const result = await this.sendMessage(student.phoneNumber, message);

            // Save notification history
            const notification = await Notification.create({
                studentId: student._id,
                phoneNumber: this.normalizePhoneNumber(student.phoneNumber),
                message: message,
                type: 'payment_reminder',
                status: result.status,
                sentAt: result.success ? new Date() : null,
                weekNumber: weeksLate,
                tunggakan: amount,
                templateUsed: category,
                failureReason: result.error || null,
            });

            // Update last notification sent
            if (result.success) {
                student.lastNotificationSent = new Date();
                await student.save();
            }

            return {
                success: result.success,
                notification,
                messageId: result.messageId,
                testMode: result.testMode,
            };
        } catch (error) {
            console.error('Error sending reminder:', error.message);
            throw error;
        }
    }

    // Kirim ucapan terima kasih
    async sendThankYou(student) {
        try {
            if (!student.phoneNumber) {
                return { success: false, error: 'No phone number' };
            }

            const message = this.generateThankYouMessage(student.name);
            const result = await this.sendMessage(student.phoneNumber, message);

            // Save notification
            await Notification.create({
                studentId: student._id,
                phoneNumber: this.normalizePhoneNumber(student.phoneNumber),
                message: message,
                type: 'thank_you',
                status: result.status,
                sentAt: result.success ? new Date() : null,
            });

            return result;
        } catch (error) {
            console.error('Error sending thank you:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Kirim pesan custom
    async sendCustomMessage(student, message) {
        try {
            if (!student.phoneNumber) {
                throw new Error('Nomor WhatsApp tidak tersedia');
            }

            const result = await this.sendMessage(student.phoneNumber, message);

            await Notification.create({
                studentId: student._id,
                phoneNumber: this.normalizePhoneNumber(student.phoneNumber),
                message: message,
                type: 'custom',
                status: result.status,
                sentAt: result.success ? new Date() : null,
            });

            return result;
        } catch (error) {
            throw error;
        }
    }

    // Check status Fonnte API
    async checkStatus() {
        try {
            const response = await axios.post(
                'https://api.fonnte.com/validate',
                {},
                {
                    headers: {
                        Authorization: this.apiToken,
                    },
                }
            );

            return {
                valid: true,
                device: response.data.device || 'Unknown',
                expired: response.data.expired || 'Unknown',
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
            };
        }
    }

    // ==============================================
    // 📱 KIRIM KE GRUP WHATSAPP
    // ==============================================

    /**
     * Generate pesan untuk grup dengan mention semua yang belum bayar
     * @param {Array} studentsData - Array of {student, weeksLate, amount}
     * @param {String} category - Template category
     * @returns {String} Message with mentions
     */
    generateGroupReminderMessage(studentsData, category = 'friendly') {
        // Sort by weeks late (descending)
        const sorted = [...studentsData].sort(
            (a, b) => b.weeksLate - a.weeksLate
        );

        // Group by weeks late
        const grouped = {};
        sorted.forEach((item) => {
            const key = item.weeksLate;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });

        // Build message based on category
        let message = '';

        if (category === 'friendly') {
            message = `📢 *REMINDER KAS KELAS* 📢\n\n`;
            message += `Halo semuanya! 👋\n\n`;
            message += `Ini pengingat ramah untuk teman-teman\n`;
            message += `yang belum bayar kas kelas ya~ 😊\n\n`;
        } else if (category === 'humorous') {
            message += `🔔 *BREAKING NEWS!* 🔔\n\n`;
            message += `Wartawan kami melaporkan ada\n`;
            message += `beberapa VIP yang belum bayar kas! 😂\n\n`;
        } else if (category === 'formal') {
            message += `📋 *PENGUMUMAN RESMI*\n`;
            message += `*PEMBAYARAN KAS KELAS*\n\n`;
            message += `Kepada Yang Terhormat,\n`;
            message += `Berikut daftar siswa dengan tunggakan:\n\n`;
        } else {
            message += `⚡ *REMINDER KAS KELAS* ⚡\n\n`;
            message += `Halo guys! Ada yang belum bayar nih 💰\n\n`;
        }

        // List students by weeks
        Object.keys(grouped)
            .sort((a, b) => b - a)
            .forEach((weeks) => {
                const students = grouped[weeks];
                const amount = weeks * 2000;

                message += `*${weeks} Minggu (Rp ${amount.toLocaleString(
                    'id-ID'
                )})*\n`;

                students.forEach((item) => {
                    // Format: @phoneNumber (Name)
                    const phone = this.normalizePhoneNumber(
                        item.student.phoneNumber
                    );
                    message += `• @${phone} (${item.student.name})\n`;
                });
                message += `\n`;
            });

        // Closing message
        if (category === 'friendly') {
            message += `Yuk segera dilunasi ya! 🥰\n`;
            message += `Ditunggu pembayarannya~ 💙`;
            message += PAYMENT_INFO;
            message += `\n\n_Pesan otomatis dari sistem kas kelas_`;
        } else if (category === 'humorous') {
            message += `Yang disebutkan, buruan bayar\n`;
            message += `biar turun dari trending topic! 😆`;
            message += PAYMENT_INFO;
            message += `\n\n_Auto-generated by Kas Bot 🤖_`;
        } else if (category === 'formal') {
            message += `Mohon untuk segera melakukan pembayaran.\n`;
            message += `Terima kasih atas perhatian dan kerjasamanya.`;
            message += PAYMENT_INFO;
            message += `\n\nHormat kami,\n`;
            message += `Bendahara Kelas`;
        } else {
            message += `Gas langsung bayar ya! 🚀\n`;
            message += `Terima kasih! 🙏`;
            message += PAYMENT_INFO;
        }

        return message;
    }

    /**
     * Kirim pesan ke grup WhatsApp dengan mention
     * @param {String} groupId - ID grup WhatsApp (format: 628xxx-xxx@g.us)
     * @param {Array} studentsData - Array of students to mention
     * @param {String} category - Template category
     */
    async sendToGroup(groupId, studentsData, category = 'friendly') {
        try {
            if (!groupId) {
                throw new Error('Group ID tidak boleh kosong');
            }

            if (!studentsData || studentsData.length === 0) {
                throw new Error('Tidak ada siswa yang perlu diingatkan');
            }

            // Generate message with mentions
            const message = this.generateGroupReminderMessage(
                studentsData,
                category
            );

            // Mode test: hanya log
            if (process.env.WA_TEST_MODE === 'true') {
                console.log('📱 TEST MODE - Pesan grup tidak dikirim:');
                console.log(`To Group: ${groupId}`);
                console.log(`Message:\n${message}`);
                console.log(`\nMentions: ${studentsData.length} siswa`);
                return {
                    success: true,
                    status: 'sent',
                    messageId: 'test_group_' + Date.now(),
                    testMode: true,
                };
            }

            // Kirim via Fonnte API
            const response = await axios.post(
                this.apiUrl,
                {
                    target: groupId,
                    message: message,
                    countryCode: '62',
                },
                {
                    headers: {
                        Authorization: this.apiToken,
                    },
                }
            );

            // Save notification untuk tracking (tanpa studentId karena group message)
            await Notification.create({
                studentId: null,
                phoneNumber: groupId,
                message: message,
                type: 'group_reminder',
                status: response.data.status ? 'sent' : 'failed',
                sentAt: response.data.status ? new Date() : null,
                templateUsed: 'group_reminder_' + category,
            });

            return {
                success: response.data.status === true,
                status: response.data.status ? 'sent' : 'failed',
                messageId: response.data.id || null,
                detail: response.data.detail || null,
            };
        } catch (error) {
            console.error('Error sending to group:', error.message);
            return {
                success: false,
                status: 'failed',
                error: error.message,
            };
        }
    }

    // ==============================================
    // 🎉 EVENT REMINDER METHODS
    // ==============================================

    /**
     * Generate pesan reminder untuk event
     */
    generateEventReminderMessage(
        studentName,
        eventName,
        amount,
        deadline,
        category = 'friendly'
    ) {
        const templates =
            EVENT_REMINDER_TEMPLATES[category] ||
            EVENT_REMINDER_TEMPLATES.friendly;
        const randomIndex = Math.floor(Math.random() * templates.length);
        return templates[randomIndex](studentName, eventName, amount, deadline);
    }

    /**
     * Kirim reminder event ke satu siswa
     */
    async sendEventReminder(student, event, category = 'friendly') {
        try {
            if (!student.phoneNumber) {
                throw new Error('Siswa tidak memiliki nomor WhatsApp');
            }

            if (!student.enableNotification) {
                throw new Error('Notifikasi dinonaktifkan untuk siswa ini');
            }

            // Format deadline
            const deadline = new Date(event.endDate).toLocaleDateString(
                'id-ID',
                {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                }
            );

            // Generate pesan
            const message = this.generateEventReminderMessage(
                student.name,
                event.name,
                event.perStudentAmount,
                deadline,
                category
            );

            // Kirim pesan
            const result = await this.sendMessage(student.phoneNumber, message);

            // Save notification history
            const notification = await Notification.create({
                studentId: student._id,
                phoneNumber: this.normalizePhoneNumber(student.phoneNumber),
                message: message,
                type: 'event_reminder',
                status: result.status,
                sentAt: result.success ? new Date() : null,
                templateUsed: category,
                failureReason: result.error || null,
            });

            return {
                success: result.success,
                notification,
                messageId: result.messageId,
                testMode: result.testMode,
            };
        } catch (error) {
            console.error('Error sending event reminder:', error.message);
            throw error;
        }
    }

    /**
     * Generate pesan event reminder untuk grup
     */
    generateGroupEventReminderMessage(
        studentsData,
        event,
        category = 'friendly'
    ) {
        const deadline = new Date(event.endDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const collected = event.totalCollected || 0;
        const target = event.targetAmount;
        const percentage = Math.round((collected / target) * 100);
        const remaining = studentsData.length;
        const total = event.studentsPaid?.length + remaining || remaining;

        let message = '';

        if (category === 'friendly') {
            message = `🎉 *REMINDER EVENT* 🎉\n\n`;
            message += `Halo semuanya! 👋\n\n`;
            message += `Reminder untuk event:\n`;
            message += `✨ *${event.name}* Sebaiknya segera bayar kalau tidak mau di bacotion panitia nya\n\n`;
        } else if (category === 'urgent') {
            message = `⚡ *URGENT - EVENT REMINDER* ⚡\n\n`;
            message += `Event *${event.name}* sudah dekat!\n\n`;
        } else if (category === 'formal') {
            message = `📋 *PENGUMUMAN EVENT*\n`;
            message += `*${event.name.toUpperCase()}*\n\n`;
        } else {
            message = `🔔 *EVENT ALERT!* 🔔\n\n`;
            message += `Don't miss out guys!\n`;
            message += `🎪 *${event.name}*\n\n`;
        }

        // Event details
        message += `📝 ${event.description || 'Event kelas'}\n`;
        message += `💰 Iuran per orang: Rp ${event.perStudentAmount.toLocaleString(
            'id-ID'
        )}\n`;
        message += `🎯 Target: Rp ${target.toLocaleString('id-ID')}\n`;
        message += `📊 Terkumpul: Rp ${collected.toLocaleString(
            'id-ID'
        )} (${percentage}%)\n`;
        message += `⏰ Deadline: ${deadline}\n\n`;

        // List yang belum bayar
        message += `*Yang Belum Bayar (${remaining}/${total}):*\n`;
        studentsData.forEach((item) => {
            const phone = this.normalizePhoneNumber(item.student.phoneNumber);
            message += `• @${phone} (${item.student.name})\n`;
        });
        message += `\n`;

        // Closing
        if (category === 'friendly') {
            message += `Yuk segera bayar ya! 🥰\n`;
            message += `Pilih bayar atau di hujat irpan 🎊`;
            message += PAYMENT_INFO;
            message += `\n\nAuto-reminder dari sistem kas kelas`;
        } else if (category === 'urgent') {
            message += `Buruan bayar sebelum terlambat! ⚡\n`;
            message += `Deadline sudah dekat! 🏃‍♂️`;
            message += PAYMENT_INFO;
            message += `\n\n_Urgent reminder by Kas Bot_`;
        } else if (category === 'formal') {
            message += `Mohon segera melakukan pembayaran\n`;
            message += `sebelum batas waktu yang ditentukan.`;
            message += PAYMENT_INFO;
            message += `\n\nHormat kami,\n`;
            message += `Panitia ${event.name}`;
        } else {
            message += `Let's make it happen! 🚀\n`;
            message += `Ditunggu kontribusinya ya! 💪`;
            message += PAYMENT_INFO;
        }

        return message;
    }

    /**
     * Kirim event reminder ke grup
     */
    async sendEventReminderToGroup(
        groupId,
        studentsData,
        event,
        category = 'friendly'
    ) {
        try {
            if (!groupId) {
                throw new Error('Group ID tidak boleh kosong');
            }

            if (!studentsData || studentsData.length === 0) {
                throw new Error('Tidak ada siswa yang perlu diingatkan');
            }

            // Generate message
            const message = this.generateGroupEventReminderMessage(
                studentsData,
                event,
                category
            );

            // Mode test
            if (process.env.WA_TEST_MODE === 'true') {
                console.log('📱 TEST MODE - Event reminder grup:');
                console.log(`Event: ${event.name}`);
                console.log(`To Group: ${groupId}`);
                console.log(`Message:\n${message}`);
                console.log(`\nMentions: ${studentsData.length} siswa`);
                return {
                    success: true,
                    status: 'sent',
                    messageId: 'test_event_group_' + Date.now(),
                    testMode: true,
                };
            }

            // Kirim via Fonnte
            const response = await axios.post(
                this.apiUrl,
                {
                    target: groupId,
                    message: message,
                    countryCode: '62',
                },
                {
                    headers: {
                        Authorization: this.apiToken,
                    },
                }
            );

            console.log('Fonnte API Response:', response.data);

            // Save notification
            await Notification.create({
                studentId: null,
                phoneNumber: groupId,
                message: message,
                type: 'group_reminder',
                status: response.data.status ? 'sent' : 'failed',
                sentAt: response.data.status ? new Date() : null,
                failureReason: response.data.status
                    ? null
                    : response.data.reason || 'Unknown error',
                templateUsed: 'event_group_' + category,
            });

            return {
                success: response.data.status === true,
                status: response.data.status ? 'sent' : 'failed',
                messageId: response.data.id || null,
                detail: response.data.detail || response.data.reason || null,
            };
        } catch (error) {
            console.error(
                'Error sending event reminder to group:',
                error.message
            );
            console.error('Full error:', error.response?.data || error);

            // Save failed notification
            try {
                await Notification.create({
                    studentId: null,
                    phoneNumber: groupId,
                    message: message,
                    type: 'group_reminder',
                    status: 'failed',
                    failureReason:
                        error.response?.data?.reason || error.message,
                    templateUsed: 'event_group_' + category,
                });
            } catch (dbError) {
                console.error('Error saving failed notification:', dbError);
            }

            return {
                success: false,
                status: 'failed',
                error: error.message,
                detail: error.response?.data || null,
            };
        }
    }

    // ==============================================
    // 📝 CUSTOM MESSAGE - Kirim pesan kustom
    // ==============================================
    async sendCustomMessage(phoneNumber, customMessage, studentData = null) {
        try {
            // Format nomor telepon
            let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');

            // Tambahkan 62 jika belum ada
            if (!formattedNumber.startsWith('62')) {
                if (formattedNumber.startsWith('0')) {
                    formattedNumber = '62' + formattedNumber.substring(1);
                } else {
                    formattedNumber = '62' + formattedNumber;
                }
            }

            // Tambahkan payment info di akhir pesan
            const fullMessage = customMessage + PAYMENT_INFO;

            // Mode test
            if (process.env.WA_TEST_MODE === 'true') {
                console.log('📱 TEST MODE - Custom message:');
                console.log(`To: ${formattedNumber}`);
                console.log(`Message:\n${fullMessage}`);
                return {
                    success: true,
                    status: 'sent',
                    messageId: 'test_custom_' + Date.now(),
                    testMode: true,
                };
            }

            // Kirim via Fonnte
            const response = await axios.post(
                this.apiUrl,
                {
                    target: formattedNumber,
                    message: fullMessage,
                    countryCode: '62',
                },
                {
                    headers: {
                        Authorization: this.apiToken,
                    },
                }
            );

            console.log('Fonnte API Response (Custom):', response.data);

            // Save notification
            await Notification.create({
                studentId: studentData?._id || null,
                phoneNumber: formattedNumber,
                message: fullMessage,
                type: 'custom',
                status: response.data.status ? 'sent' : 'failed',
                sentAt: response.data.status ? new Date() : null,
                failureReason: response.data.status
                    ? null
                    : response.data.reason || 'Unknown error',
                templateUsed: 'custom_message',
            });

            return {
                success: response.data.status === true,
                status: response.data.status ? 'sent' : 'failed',
                messageId: response.data.id || null,
                detail: response.data.detail || response.data.reason || null,
            };
        } catch (error) {
            console.error('Error sending custom message:', error.message);
            console.error('Full error:', error.response?.data || error);

            // Save failed notification
            try {
                await Notification.create({
                    studentId: studentData?._id || null,
                    phoneNumber: phoneNumber,
                    message: customMessage,
                    type: 'custom',
                    status: 'failed',
                    failureReason:
                        error.response?.data?.reason || error.message,
                    templateUsed: 'custom_message',
                });
            } catch (dbError) {
                console.error('Error saving failed notification:', dbError);
            }

            return {
                success: false,
                status: 'failed',
                error: error.message,
                detail: error.response?.data || null,
            };
        }
    }
}

export default new WhatsAppService();
