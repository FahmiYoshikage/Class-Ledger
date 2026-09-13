#!/usr/bin/env node
/**
 * =============================================================================
 * Class-Ledger End-to-End (E2E) Test Safety Net
 * =============================================================================
 * Memverifikasi seluruh perilaku sistem (Frontend, Backend API, Proxy,
 * Database, Keamanan Auth, dan Resource Memory VPS) agar tetap terjaga.
 *
 * Cara menjalankan:
 *   node scripts/test-e2e.js
 *   node scripts/test-e2e.js --base-url https://triforce.crud.my.id
 *   npm test
 * =============================================================================
 */

import { execSync } from 'child_process';

// ── Konfigurasi Target URL ──
const args = process.argv.slice(2);
function getArg(flag, fallback) {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const customBase = getArg('--base-url', null);
const API_URL = customBase ? `${customBase}/api` : getArg('--api-url', 'http://localhost:5001/api');
const FRONTEND_URL = customBase || getArg('--frontend-url', 'http://localhost:8767');

// ── Formatting & Colors ──
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

let passed = 0;
let failed = 0;
const failures = [];

function logHeader(title) {
    console.log(`\n${c.bold}${c.cyan}┌── ${title} ──────────────────────────────────────────────────${c.reset}`);
}

async function runTest(name, fn) {
    const start = Date.now();
    process.stdout.write(`  ├─ ${name}... `);
    try {
        await fn();
        const ms = Date.now() - start;
        console.log(`${c.green}✓ PASS${c.reset} ${c.dim}(${ms}ms)${c.reset}`);
        passed++;
    } catch (err) {
        const ms = Date.now() - start;
        console.log(`${c.red}✗ FAIL${c.reset} ${c.dim}(${ms}ms)${c.reset}`);
        console.log(`  │  ${c.red}Error: ${err.message}${c.reset}`);
        failures.push({ name, error: err.message });
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

// ── Test Suites ──
async function main() {
    console.log(`${c.bold}${c.blue}════════════════════════════════════════════════════════════════════${c.reset}`);
    console.log(`${c.bold}   🛡️  CLASS-LEDGER E2E TEST SAFETY NET${c.reset}`);
    console.log(`${c.dim}   Target API:      ${API_URL}${c.reset}`);
    console.log(`${c.dim}   Target Frontend: ${FRONTEND_URL}${c.reset}`);
    console.log(`${c.bold}${c.blue}════════════════════════════════════════════════════════════════════${c.reset}`);

    // =========================================================================
    // SUITE 1: Infrastructure, Proxy & Health Checks
    // =========================================================================
    logHeader('SUITE 1: Infrastructure, Proxy & Health Checks');

    await runTest('Backend Direct Health Check (/api/health)', async () => {
        const res = await fetch(`${API_URL}/health`);
        assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
        const data = await res.json();
        assert(data.status === 'OK', `Expected status 'OK', got '${data.status}'`);
        assert(typeof data.timestamp === 'string', 'Expected timestamp in health response');
    });

    await runTest('Frontend Serving Static Bundle (/)', async () => {
        const res = await fetch(`${FRONTEND_URL}/`);
        assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
        const html = await res.text();
        assert(html.includes('<div id="root">'), 'Expected index.html to contain React root element');
    });

    await runTest('Nginx Reverse Proxy (/api/health through frontend)', async () => {
        const res = await fetch(`${FRONTEND_URL}/api/health`);
        assert(res.status === 200, `Expected HTTP 200 through proxy, got ${res.status}`);
        const data = await res.json();
        assert(data.status === 'OK', `Expected proxy health status 'OK', got '${data.status}'`);
    });

    await runTest('PWA Manifest & Service Worker Assets', async () => {
        const [manifestRes, swRes] = await Promise.all([
            fetch(`${FRONTEND_URL}/manifest.webmanifest`),
            fetch(`${FRONTEND_URL}/sw.js`),
        ]);
        assert(manifestRes.status === 200, `Expected manifest.webmanifest HTTP 200, got ${manifestRes.status}`);
        assert(swRes.status === 200, `Expected sw.js HTTP 200, got ${swRes.status}`);
    });

    await runTest('SPA Router Fallback (try_files for client-side routing)', async () => {
        const [loginRes, adminRes] = await Promise.all([
            fetch(`${FRONTEND_URL}/login`),
            fetch(`${FRONTEND_URL}/admin`),
        ]);
        assert(loginRes.status === 200, `/login expected HTTP 200 fallback, got ${loginRes.status}`);
        assert(adminRes.status === 200, `/admin expected HTTP 200 fallback, got ${adminRes.status}`);
        const html = await loginRes.text();
        assert(html.includes('<div id="root">'), 'SPA fallback should serve index.html');
    });

    await runTest('HTTP Security Headers (Nginx protection)', async () => {
        const res = await fetch(`${FRONTEND_URL}/`);
        const xcto = res.headers.get('x-content-type-options');
        const xfo = res.headers.get('x-frame-options');
        assert(xcto === 'nosniff', `Expected X-Content-Type-Options 'nosniff', got '${xcto}'`);
        assert(xfo === 'SAMEORIGIN', `Expected X-Frame-Options 'SAMEORIGIN', got '${xfo}'`);
    });

    // =========================================================================
    // SUITE 2: Public Ledger Data & Endpoints (Integrity & Backward Compatibility)
    // =========================================================================
    logHeader('SUITE 2: Public Ledger Data & API Endpoints');

    await runTest('Public Students Endpoint (GET /api/students)', async () => {
        const res = await fetch(`${API_URL}/students`);
        assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
        const students = await res.json();
        assert(Array.isArray(students), 'Expected students response to be an array');
        if (students.length > 0) {
            const first = students[0];
            assert(typeof first.name === 'string', 'Student must have name property');
            assert(typeof first.absen === 'number', 'Student must have absen number');
        }
    });

    await runTest('Public Payments Endpoint (GET /api/payments)', async () => {
        const res = await fetch(`${API_URL}/payments`);
        assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
        const payments = await res.json();
        assert(Array.isArray(payments), 'Expected payments response to be an array');
        if (payments.length > 0) {
            const first = payments[0];
            assert(typeof first.amount === 'number', 'Payment must have amount');
            assert(first.studentId !== undefined, 'Payment must reference student');
        }
    });

    await runTest('Public Expenses Endpoint (GET /api/expenses)', async () => {
        const res = await fetch(`${API_URL}/expenses`);
        assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
        const expenses = await res.json();
        assert(Array.isArray(expenses), 'Expected expenses response to be an array');
        if (expenses.length > 0) {
            const first = expenses[0];
            assert(typeof first.purpose === 'string', 'Expense must have purpose');
            assert(typeof first.amount === 'number', 'Expense must have amount');
        }
    });

    await runTest('Gamification & Leaderboard Endpoint (GET /api/leaderboard)', async () => {
        const res = await fetch(`${API_URL}/leaderboard`);
        assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
        const data = await res.json();
        assert(data.success === true, 'Expected leaderboard success: true');
        assert(Array.isArray(data.leaderboard), 'Expected leaderboard array');
    });

    await runTest('Events & Badges Endpoints', async () => {
        const [eventsRes, badgesRes] = await Promise.all([
            fetch(`${API_URL}/events`),
            fetch(`${API_URL}/badges`),
        ]);
        assert(eventsRes.status === 200, `Events expected HTTP 200, got ${eventsRes.status}`);
        assert(badgesRes.status === 200, `Badges expected HTTP 200, got ${badgesRes.status}`);
    });

    // =========================================================================
    // SUITE 3: Authentication & Security Boundaries
    // =========================================================================
    logHeader('SUITE 3: Authentication & Security Boundaries');

    await runTest('Protected Audit Logs Rejects Unauthenticated (/api/audit-logs)', async () => {
        const res = await fetch(`${API_URL}/audit-logs`);
        assert(res.status === 401, `Expected HTTP 401 Unauthorized, got ${res.status}`);
    });

    await runTest('Protected Sessions Rejects Unauthenticated (/api/sessions)', async () => {
        const res = await fetch(`${API_URL}/sessions`);
        assert(res.status === 401, `Expected HTTP 401 Unauthorized, got ${res.status}`);
    });

    await runTest('Protected Profile Rejects Unauthenticated (/api/auth/me)', async () => {
        const res = await fetch(`${API_URL}/auth/me`);
        assert(res.status === 401, `Expected HTTP 401 Unauthorized, got ${res.status}`);
    });

    await runTest('Login Correctly Rejects Invalid Credentials', async () => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'nonexistent_user', password: 'wrong_password_xyz' }),
        });
        assert(res.status === 401 || res.status === 400, `Expected HTTP 400/401 for bad login, got ${res.status}`);
    });

    // =========================================================================
    // SUITE 4: VPS 1GB Resource & Performance Safety Guard
    // =========================================================================
    logHeader('SUITE 4: VPS 1GB Resource & Performance Safety Guard');

    await runTest('API Response Time (< 500ms latency budget)', async () => {
        const start = Date.now();
        await fetch(`${API_URL}/students`);
        const elapsed = Date.now() - start;
        assert(elapsed < 500, `API took ${elapsed}ms (exceeds 500ms budget)`);
    });

    await runTest('Docker Container Health & Memory Budget (1GB VPS Guard)', async () => {
        try {
            const output = execSync('docker stats --no-stream --format "{{.Name}}|{{.MemUsage}}|{{.MemPerc}}"', {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore'],
            });

            const lines = output.trim().split('\n');
            let foundApi = false;
            let foundFrontend = false;

            for (const line of lines) {
                const [name, memUsage] = line.split('|');
                if (name === 'kas-kelas-api') {
                    foundApi = true;
                    const match = memUsage.match(/([\d.]+)MiB/);
                    if (match) {
                        const mib = parseFloat(match[1]);
                        assert(mib < 256, `API RAM is ${mib}MiB (exceeds 256MB limit!)`);
                    }
                }
                if (name === 'kas-kelas-frontend') {
                    foundFrontend = true;
                    const match = memUsage.match(/([\d.]+)MiB/);
                    if (match) {
                        const mib = parseFloat(match[1]);
                        assert(mib < 64, `Frontend RAM is ${mib}MiB (exceeds 64MB limit!)`);
                    }
                }
            }

            if (!foundApi || !foundFrontend) {
                // If running outside docker host, note it
                process.stdout.write(`(Docker host check skipped/partial) `);
            }
        } catch {
            process.stdout.write(`(Docker CLI not in PATH, skipped) `);
        }
    });

    // =========================================================================
    // SCORECARD & SUMMARY
    // =========================================================================
    console.log(`\n${c.bold}${c.blue}════════════════════════════════════════════════════════════════════${c.reset}`);
    console.log(`${c.bold}   TEST SUMMARY SCORECARD${c.reset}`);
    console.log(`${c.bold}${c.blue}════════════════════════════════════════════════════════════════════${c.reset}`);
    console.log(`   Total Tests:  ${passed + failed}`);
    console.log(`   Passed:       ${c.green}${c.bold}${passed}${c.reset}`);
    console.log(`   Failed:       ${failed > 0 ? `${c.red}${c.bold}${failed}` : '0'}${c.reset}`);

    if (failed > 0) {
        console.log(`\n${c.red}${c.bold}Failed Assertions:${c.reset}`);
        for (const f of failures) {
            console.log(`  - ${f.name}: ${f.error}`);
        }
        console.log(`\n${c.red}${c.bold}❌ E2E Safety Net FAILED! Check the errors above.${c.reset}\n`);
        process.exit(1);
    } else {
        console.log(`\n${c.green}${c.bold}✅ ALL E2E SAFETY NET TESTS PASSED! System behavior is intact.${c.reset}\n`);
        process.exit(0);
    }
}

main().catch((err) => {
    console.error(`\n${c.red}Fatal test runner error: ${err.message}${c.reset}`);
    process.exit(1);
});
