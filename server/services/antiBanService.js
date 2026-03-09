// ==============================================
// 🛡️ ANTI-BAN SERVICE
// Sistem proteksi agar WhatsApp tidak mendeteksi
// aktivitas bot/automasi pada nomor pengirim.
//
// Teknik:
//   1. Random delay dengan distribusi gaussian (human-like)
//   2. Jitter pada waktu cron (±random menit)
//   3. Daily message cap & hourly throttle
//   4. Humanisasi pesan (typo kecil, variasi emoji, spasi, dll)
//   5. Sesi kirim bertahap (batch kecil, istirahat panjang)
//   6. Shuffle urutan penerima agar pola tidak terbaca
// ==============================================

class AntiBanService {
    constructor() {
        // --- Rate limiting state ---
        this.messagesSentToday = 0;
        this.messagesSentThisHour = 0;
        this.lastResetDay = new Date().getDate();
        this.lastResetHour = new Date().getHours();

        // --- Configurable limits ---
        this.config = {
            // Maksimal pesan per hari (semua tipe)
            maxPerDay: parseInt(process.env.WA_MAX_PER_DAY) || 30,
            // Maksimal pesan per jam
            maxPerHour: parseInt(process.env.WA_MAX_PER_HOUR) || 8,
            // Delay antar pesan (ms) — min & max untuk random range
            delayMin: parseInt(process.env.WA_DELAY_MIN) || 45_000, // 45 detik
            delayMax: parseInt(process.env.WA_DELAY_MAX) || 180_000, // 3 menit
            // Setiap N pesan, istirahat panjang
            batchSize: parseInt(process.env.WA_BATCH_SIZE) || 4,
            // Durasi istirahat panjang (ms)
            batchPauseMin: parseInt(process.env.WA_BATCH_PAUSE_MIN) || 300_000, // 5 menit
            batchPauseMax: parseInt(process.env.WA_BATCH_PAUSE_MAX) || 600_000, // 10 menit
            // Jitter untuk cron schedule (menit)
            cronJitterMin: 0,
            cronJitterMax: parseInt(process.env.WA_CRON_JITTER) || 25, // 0-25 menit
        };
    }

    // =====================
    // 🎲 RANDOM UTILITIES
    // =====================

    /**
     * Gaussian (normal) random — menghasilkan distribusi yang lebih natural
     * daripada Math.random() yang uniform.
     * Menggunakan Box-Muller transform.
     */
    gaussianRandom(mean, stdDev) {
        let u1 = 0,
            u2 = 0;
        while (u1 === 0) u1 = Math.random();
        while (u2 === 0) u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + z * stdDev;
    }

    /**
     * Random integer antara min dan max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Pilih elemen random dari array
     */
    pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // =====================
    // ⏱️ DELAY ENGINE
    // =====================

    /**
     * Hitung delay antar pesan (ms) — gaussian, bukan linear.
     * Mean-nya di tengah range, dengan stddev ≈ 1/4 range.
     */
    calculateMessageDelay() {
        const { delayMin, delayMax } = this.config;
        const mean = (delayMin + delayMax) / 2;
        const stdDev = (delayMax - delayMin) / 4;
        const delay = this.gaussianRandom(mean, stdDev);
        // Clamp agar tetap dalam batas
        return Math.max(delayMin, Math.min(delayMax, Math.round(delay)));
    }

    /**
     * Hitung durasi batch pause (istirahat panjang setelah N pesan)
     */
    calculateBatchPause() {
        const { batchPauseMin, batchPauseMax } = this.config;
        const mean = (batchPauseMin + batchPauseMax) / 2;
        const stdDev = (batchPauseMax - batchPauseMin) / 4;
        const pause = this.gaussianRandom(mean, stdDev);
        return Math.max(
            batchPauseMin,
            Math.min(batchPauseMax, Math.round(pause))
        );
    }

    /**
     * Hitung jitter untuk cron (berapa menit tambahan random)
     */
    calculateCronJitter() {
        const { cronJitterMin, cronJitterMax } = this.config;
        return this.randomInt(cronJitterMin, cronJitterMax);
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Terapkan cron jitter — tunggu random menit sebelum eksekusi.
     * Dipanggil di awal setiap cron handler.
     */
    async applyCronJitter(jobName) {
        const jitterMinutes = this.calculateCronJitter();
        const jitterMs = jitterMinutes * 60 * 1000;
        console.log(
            `🎲 [${jobName}] Cron jitter: menunggu ${jitterMinutes} menit sebelum mulai...`
        );
        await this.sleep(jitterMs);
        console.log(`✅ [${jobName}] Jitter selesai, mulai proses.`);
    }

    // =====================
    // 🚦 RATE LIMITER
    // =====================

    /**
     * Reset counter jika sudah berganti hari/jam
     */
    _resetCountersIfNeeded() {
        const now = new Date();
        if (now.getDate() !== this.lastResetDay) {
            this.messagesSentToday = 0;
            this.lastResetDay = now.getDate();
        }
        if (now.getHours() !== this.lastResetHour) {
            this.messagesSentThisHour = 0;
            this.lastResetHour = now.getHours();
        }
    }

    /**
     * Cek apakah masih boleh mengirim pesan
     */
    canSendMessage() {
        this._resetCountersIfNeeded();
        return (
            this.messagesSentToday < this.config.maxPerDay &&
            this.messagesSentThisHour < this.config.maxPerHour
        );
    }

    /**
     * Catat bahwa satu pesan telah berhasil dikirim
     */
    recordMessageSent() {
        this._resetCountersIfNeeded();
        this.messagesSentToday++;
        this.messagesSentThisHour++;
    }

    /**
     * Info sisa kuota
     */
    getRateLimitStatus() {
        this._resetCountersIfNeeded();
        return {
            sentToday: this.messagesSentToday,
            sentThisHour: this.messagesSentThisHour,
            remainingToday: this.config.maxPerDay - this.messagesSentToday,
            remainingThisHour:
                this.config.maxPerHour - this.messagesSentThisHour,
            maxPerDay: this.config.maxPerDay,
            maxPerHour: this.config.maxPerHour,
        };
    }

    // =====================
    // 🔀 SHUFFLE
    // =====================

    /**
     * Fisher-Yates shuffle — acak urutan penerima
     * agar tidak selalu kirim ke orang yang sama duluan
     */
    shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // =====================
    // 🎭 MESSAGE HUMANIZER
    // =====================

    /**
     * Humanisasi pesan agar setiap pesan unik secara fingerprint.
     * Teknik:
     *   - Variasi spasi (zero-width space, thin space)
     *   - Tambah/kurangi emoji
     *   - Variasi tanda baca
     *   - Sisipkan variasi sapaan pembuka/penutup
     */
    humanizeMessage(message) {
        let msg = message;

        // 1. Sisipkan zero-width characters secara random di beberapa posisi
        //    Ini membuat hash/fingerprint setiap pesan berbeda
        //    tanpa mengubah tampilan visual
        msg = this._insertInvisibleVariation(msg);

        // 2. Variasi emoji — ganti beberapa emoji dengan alternatif
        msg = this._varyEmojis(msg);

        // 3. Variasi tanda baca
        msg = this._varyPunctuation(msg);

        // 4. Tambahkan variasi penutup random
        msg = this._addRandomClosing(msg);

        return msg;
    }

    /**
     * Sisipkan zero-width space di 2-4 posisi random
     * Invisible tapi membuat setiap pesan unik secara byte
     */
    _insertInvisibleVariation(msg) {
        const invisibles = [
            '\u200B', // zero-width space
            '\u200C', // zero-width non-joiner
            '\u200D', // zero-width joiner
            '\uFEFF', // zero-width no-break space
        ];

        const lines = msg.split('\n');
        const insertCount = this.randomInt(2, 4);

        for (let i = 0; i < insertCount; i++) {
            const lineIdx = this.randomInt(0, lines.length - 1);
            const line = lines[lineIdx];
            if (line.length < 3) continue;
            const charIdx = this.randomInt(1, line.length - 1);
            const invisible = this.pickRandom(invisibles);
            lines[lineIdx] =
                line.slice(0, charIdx) + invisible + line.slice(charIdx);
        }

        return lines.join('\n');
    }

    /**
     * Ganti beberapa emoji dengan varian serupa
     */
    _varyEmojis(msg) {
        const emojiSwaps = {
            '😄': ['😃', '😁', '😊', '🙂'],
            '😊': ['🙂', '☺️', '😌'],
            '🥰': ['😍', '💕', '🤗'],
            '💙': ['💜', '🩵', '💗', '❤️'],
            '🌟': ['⭐', '✨', '💫'],
            '✨': ['🌟', '⭐', '💫'],
            '🚀': ['🏃‍♂️', '💨', '⚡'],
            '💪': ['✊', '🤜', '👊'],
            '🙏': ['🤲', '👏', '🙇'],
            '🎉': ['🥳', '🎊', '🪅'],
            '👋': ['🤚', '✋', '👐'],
            '😎': ['🤩', '😏', '🥸'],
            '😆': ['😂', '🤣', '😹'],
            '👑': ['🏆', '🥇', '🎖️'],
            '💰': ['💵', '💸', '🤑'],
            '📢': ['📣', '🔔', '🗣️'],
            '🔥': ['⚡', '💥', '☄️'],
        };

        let result = msg;
        for (const [original, alternatives] of Object.entries(emojiSwaps)) {
            // Hanya ganti 50% chance per emoji type
            if (Math.random() > 0.5 && result.includes(original)) {
                const replacement = this.pickRandom(alternatives);
                // Hanya ganti satu occurrence
                result = result.replace(original, replacement);
            }
        }

        return result;
    }

    /**
     * Variasi tanda baca ringan
     */
    _varyPunctuation(msg) {
        // Kadang tambahkan spasi sebelum tanda seru
        if (Math.random() > 0.7) {
            msg = msg.replace(/!(?!\s)/, '! ');
        }
        // Kadang ganti "..." dengan ".."
        if (Math.random() > 0.6) {
            msg = msg.replace('...', '..');
        }
        // Kadang tambah/kurangi ~ di akhir kalimat
        if (Math.random() > 0.7) {
            msg = msg.replace(/~\n/, '~~\n');
        }
        return msg;
    }

    /**
     * Tambahkan variasi penutup kecil di akhir pesan
     */
    _addRandomClosing(msg) {
        const closings = [
            '', // tanpa tambahan (most common)
            '',
            '',
            '\n\n~',
            '\n\n..',
        ];

        return msg + this.pickRandom(closings);
    }

    // =====================
    // 📊 CATEGORY MIXER
    // =====================

    /**
     * Pilih kategori template yang berbeda-beda untuk setiap penerima
     * (bukan satu kategori untuk semua)
     */
    getRandomCategory() {
        const categories = [
            'friendly',
            'motivational',
            'gentle',
            'energetic',
            'humorous',
            'formal',
        ];
        return this.pickRandom(categories);
    }

    // =====================
    // 🧩 BATCH ORCHESTRATOR
    // =====================

    /**
     * Kirim pesan ke daftar penerima dengan semua proteksi anti-ban aktif.
     *
     * @param {Array} recipients - Array of { student, weeksLate, amountOwed }
     * @param {Function} sendFn - async function(student, weeksLate, amount, category) => result
     * @returns {Object} { total, success, failed, skipped, rateLimited }
     */
    async sendWithProtection(recipients, sendFn) {
        const results = {
            total: recipients.length,
            success: 0,
            failed: 0,
            skipped: 0,
            rateLimited: 0,
            details: [],
        };

        // Shuffle urutan penerima
        const shuffled = this.shuffleArray(recipients);

        let batchCount = 0;

        for (let i = 0; i < shuffled.length; i++) {
            const { student, weeksLate, amountOwed } = shuffled[i];

            // Cek rate limit
            if (!this.canSendMessage()) {
                console.log(
                    `🚫 Rate limit tercapai. Sisa ${shuffled.length - i} pesan ditunda.`
                );
                results.rateLimited += shuffled.length - i;
                break;
            }

            // Cek apakah sudah dikirim dalam 3 hari terakhir (anti-spam existing)
            if (student.lastNotificationSent) {
                const daysSinceLastSent = Math.floor(
                    (Date.now() - student.lastNotificationSent.getTime()) /
                        (24 * 60 * 60 * 1000)
                );
                if (daysSinceLastSent < 3) {
                    console.log(
                        `⏭️  Skip ${student.name} (terakhir dikirim ${daysSinceLastSent} hari lalu)`
                    );
                    results.skipped++;
                    results.details.push({
                        name: student.name,
                        status: 'skipped',
                        reason: 'recent',
                    });
                    continue;
                }
            }

            try {
                // Pilih kategori random per penerima
                const category = this.getRandomCategory();

                console.log(
                    `📤 [${i + 1}/${shuffled.length}] Mengirim ke ${student.name} (kategori: ${category})...`
                );

                const result = await sendFn(
                    student,
                    weeksLate,
                    amountOwed,
                    category
                );

                if (result.success) {
                    this.recordMessageSent();
                    results.success++;
                    results.details.push({
                        name: student.name,
                        status: 'sent',
                        category,
                    });
                    console.log(`✅ Terkirim ke ${student.name}`);
                } else {
                    results.failed++;
                    results.details.push({
                        name: student.name,
                        status: 'failed',
                    });
                    console.log(`❌ Gagal kirim ke ${student.name}`);
                }
            } catch (error) {
                results.failed++;
                results.details.push({
                    name: student.name,
                    status: 'error',
                    error: error.message,
                });
                console.error(
                    `❌ Error kirim ke ${student.name}:`,
                    error.message
                );
            }

            batchCount++;

            // Apakah sudah waktunya batch pause?
            if (
                batchCount >= this.config.batchSize &&
                i < shuffled.length - 1
            ) {
                const pauseMs = this.calculateBatchPause();
                const pauseMin = (pauseMs / 60000).toFixed(1);
                console.log(
                    `☕ Batch pause: istirahat ${pauseMin} menit (sudah kirim ${batchCount} pesan)...`
                );
                await this.sleep(pauseMs);
                batchCount = 0;
            } else if (i < shuffled.length - 1) {
                // Normal delay antar pesan
                const delayMs = this.calculateMessageDelay();
                const delaySec = (delayMs / 1000).toFixed(0);
                console.log(
                    `⏳ Delay ${delaySec} detik sebelum pesan berikutnya...`
                );
                await this.sleep(delayMs);
            }
        }

        const status = this.getRateLimitStatus();
        console.log(`\n📊 Anti-Ban Summary:`);
        console.log(`   Terkirim: ${results.success}/${results.total}`);
        console.log(`   Gagal: ${results.failed}`);
        console.log(`   Skipped: ${results.skipped}`);
        console.log(`   Rate-limited: ${results.rateLimited}`);
        console.log(`   Sisa kuota hari ini: ${status.remainingToday}`);
        console.log(`   Sisa kuota jam ini: ${status.remainingThisHour}`);

        return results;
    }

    /**
     * Get current config (for admin dashboard)
     */
    getConfig() {
        return { ...this.config };
    }
}

export default new AntiBanService();
